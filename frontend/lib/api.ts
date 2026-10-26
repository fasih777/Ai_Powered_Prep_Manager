import axios from 'axios';
import type {
  PrepReviewResponse,
  CategoryInfo,
  ScenarioPreset,
  AuditLogEntry,
  Verdict,
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const prepReviewApi = {
  createReview: async (payload: {
    category: string;
    work_order_ref?: string | null;
    images: Array<{ id: string; url?: string | null; angle?: string | null; data?: string | null }>;
    preset?: string | null;
    evidence_override?: Record<string, any> | null;
  }): Promise<PrepReviewResponse> => {
    const response = await api.post<PrepReviewResponse>('/v1/prep-review', payload);
    return response.data;
  },

  createReviewUpload: async (
    category: string,
    workOrderRef: string | null,
    preset: string | null,
    images: File[]
  ): Promise<PrepReviewResponse> => {
    const formData = new FormData();
    formData.append('category', category);
    if (workOrderRef) {
      formData.append('work_order_ref', workOrderRef);
    }
    if (preset) {
      formData.append('preset', preset);
    }
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post<PrepReviewResponse>('/v1/prep-review/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitOverride: async (
    reviewId: string,
    checkId: string,
    correctedVerdict: Verdict,
    note: string,
    reviewerName: string = 'Senior Compliance Reviewer'
  ): Promise<PrepReviewResponse> => {
    const response = await api.post<PrepReviewResponse>(`/v1/prep-review/${reviewId}/override`, {
      check_id: checkId,
      corrected_verdict: correctedVerdict,
      note,
      reviewer_name: reviewerName,
    });
    return response.data;
  },

  listCategories: async (): Promise<{ categories: CategoryInfo[] }> => {
    const response = await api.get<{ categories: CategoryInfo[] }>('/v1/categories');
    return response.data;
  },

  getRuleSet: async (category: string): Promise<Record<string, any>> => {
    const response = await api.get<Record<string, any>>(`/v1/rule-sets/${category}`);
    return response.data;
  },

  listScenarios: async (): Promise<{ scenarios: ScenarioPreset[] }> => {
    const response = await api.get<{ scenarios: ScenarioPreset[] }>('/v1/scenarios');
    return response.data;
  },

  listReviews: async (limit: number = 20): Promise<{ reviews: PrepReviewResponse[]; total: number }> => {
    const response = await api.get<{ reviews: PrepReviewResponse[]; total: number }>(`/v1/prep-reviews?limit=${limit}`);
    return response.data;
  },

  getAuditLogs: async (limit: number = 50): Promise<{ logs: AuditLogEntry[]; total: number }> => {
    const response = await api.get<{ logs: AuditLogEntry[]; total: number }>(`/v1/audit-logs?limit=${limit}`);
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};
