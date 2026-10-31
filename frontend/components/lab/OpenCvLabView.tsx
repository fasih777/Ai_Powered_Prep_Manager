'use client';

import React, { useState } from 'react';
import { OpenCVPipelineLab } from './OpenCVPipelineLab';
import { PRELOADED_SCENARIOS, TestScenario } from '@/lib/lab/scenarios/testScenarios';

export function OpenCvLabView() {
  const [currentScenario, setCurrentScenario] = useState<TestScenario>(PRELOADED_SCENARIOS[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-ink">Scenario:</label>
        <select
          value={currentScenario.id}
          onChange={(e) => {
            const sc = PRELOADED_SCENARIOS.find((s) => s.id === e.target.value);
            if (sc) setCurrentScenario(sc);
          }}
          className="rounded-[4px] border border-line bg-surface px-3 py-1.5 text-sm text-ink"
        >
          {PRELOADED_SCENARIOS.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.name} ({sc.expectedOverallStatus})
            </option>
          ))}
        </select>
      </div>

      <OpenCVPipelineLab currentScenario={currentScenario} />
    </div>
  );
}
