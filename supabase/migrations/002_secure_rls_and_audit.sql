-- =============================================================================
-- 002_secure_rls_and_audit.sql
-- Patches: (1) broad FOR ALL policies on review/evidence tables,
--          (2) non-immutable audit_logs,
--          (3) missing auto-audit trigger on prep_overrides.
--
-- ASSUMPTIONS (adjust if your 001_initial_schema.sql differs):
--   - auth.uid() returns the current Supabase user id.
--   - An `organization_members` table exists:
--       organization_members(user_id uuid, organization_id uuid, role member_role)
--   - Tables prep_reviews / prep_review_images / prep_check_results / prep_evidence
--     each carry an `organization_id uuid` column (directly or inheritable — see
--     note on prep_review_images/prep_check_results/prep_evidence below).
--   - prep_overrides has columns: id, review_id, original_verdict, corrected_verdict,
--     reviewer_id, created_at (at minimum).
--   - audit_logs has columns: id, organization_id, actor_id, action, entity_type,
--     entity_id, payload jsonb, created_at. (Claude assumed table_name and record_id, I'll map to entity_type and entity_id)
--   - member_role enum: 'operator', 'reviewer', 'manager', 'admin'.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = target_org_id
  );
$$;

-- prep_reviews
ALTER TABLE prep_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_reviews FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_member_access ON prep_reviews;
CREATE POLICY prep_reviews_select ON prep_reviews FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY prep_reviews_insert ON prep_reviews FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY prep_reviews_no_update ON prep_reviews AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY prep_reviews_no_delete ON prep_reviews AS RESTRICTIVE FOR DELETE USING (false);

-- prep_review_images
ALTER TABLE prep_review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_review_images FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS review_images_member_access ON prep_review_images;
CREATE POLICY prep_review_images_select ON prep_review_images FOR SELECT USING (EXISTS (SELECT 1 FROM prep_reviews r WHERE r.id = prep_review_images.review_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_review_images_insert ON prep_review_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM prep_reviews r WHERE r.id = prep_review_images.review_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_review_images_no_update ON prep_review_images AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY prep_review_images_no_delete ON prep_review_images AS RESTRICTIVE FOR DELETE USING (false);

-- prep_check_results
ALTER TABLE prep_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_check_results FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS check_results_member_access ON prep_check_results;
CREATE POLICY prep_check_results_select ON prep_check_results FOR SELECT USING (EXISTS (SELECT 1 FROM prep_reviews r WHERE r.id = prep_check_results.review_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_check_results_insert ON prep_check_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM prep_reviews r WHERE r.id = prep_check_results.review_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_check_results_no_update ON prep_check_results AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY prep_check_results_no_delete ON prep_check_results AS RESTRICTIVE FOR DELETE USING (false);

-- prep_evidence
ALTER TABLE prep_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_evidence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evidence_member_access ON prep_evidence;
CREATE POLICY prep_evidence_select ON prep_evidence FOR SELECT USING (EXISTS (SELECT 1 FROM prep_check_results cr JOIN prep_reviews r ON r.id = cr.review_id WHERE cr.id = prep_evidence.check_result_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_evidence_insert ON prep_evidence FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM prep_check_results cr JOIN prep_reviews r ON r.id = cr.review_id WHERE cr.id = prep_evidence.check_result_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_evidence_no_update ON prep_evidence AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY prep_evidence_no_delete ON prep_evidence AS RESTRICTIVE FOR DELETE USING (false);

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (public.is_org_member(organization_id) AND actor_id = auth.uid());
CREATE POLICY audit_logs_no_update ON audit_logs AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY audit_logs_no_delete ON audit_logs AS RESTRICTIVE FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'audit_logs is append-only: % operations are not permitted (attempted on row id=%)',
    TG_OP,
    COALESCE(OLD.id, NEW.id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Auto-audit trigger on prep_overrides
CREATE OR REPLACE FUNCTION public.audit_prep_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organization_id uuid;
BEGIN
  SELECT r.organization_id
    INTO v_organization_id
    FROM prep_reviews r
   WHERE r.id = NEW.review_id;

  INSERT INTO audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    payload,
    created_at
  )
  VALUES (
    v_organization_id,
    NEW.reviewer_id,
    'prep_override_created',
    'prep_overrides',
    NEW.id,
    jsonb_build_object(
      'original_verdict', NEW.original_verdict,
      'corrected_verdict', NEW.corrected_verdict,
      'reviewer_id', NEW.reviewer_id,
      'review_id', NEW.review_id
    ),
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_prep_override ON prep_overrides;
CREATE TRIGGER trg_audit_prep_override
  AFTER INSERT ON prep_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_prep_override();

-- prep_overrides
ALTER TABLE prep_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_overrides FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS overrides_reviewer_insert ON prep_overrides;
DROP POLICY IF EXISTS overrides_member_read ON prep_overrides;

CREATE POLICY prep_overrides_select ON prep_overrides FOR SELECT USING (EXISTS (SELECT 1 FROM prep_reviews r WHERE r.id = prep_overrides.review_id AND public.is_org_member(r.organization_id)));
CREATE POLICY prep_overrides_insert ON prep_overrides FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM prep_reviews r
      JOIN organization_members om
        ON om.organization_id = r.organization_id
       AND om.user_id = auth.uid()
      WHERE r.id = prep_overrides.review_id
        AND om.role IN ('reviewer', 'manager', 'admin')
    )
    AND reviewer_id = auth.uid()
  );
CREATE POLICY prep_overrides_no_update ON prep_overrides AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY prep_overrides_no_delete ON prep_overrides AS RESTRICTIVE FOR DELETE USING (false);
