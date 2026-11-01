import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Barcode,
  BookOpen,
  Server,
  FileCheck2,
  Activity
} from 'lucide-react';

export type ActiveTab =
  | 'review'
  | 'opencv'
  | 'barcode'
  | 'vlm'
  | 'celery'
  | 'audit';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  systemHealth: {
    status: string;
    ruleSetVersion: string;
    hasGeminiApiKey: boolean;
    activeWorkersCount: number;
    redisKeysCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemHealth
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  AI-Powered Prep Manager
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                  Rule Set v{systemHealth.ruleSetVersion}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Inbound Fulfillment Compliance • VLM & Algorithmic Perception Engine
              </p>
            </div>
          </div>

          {/* System Telemetry Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            {/* Redis Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-zinc-400">Redis:</span>
              <span className="text-emerald-400 font-medium">7.2 Online</span>
            </div>

            {/* Celery Workers */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-400">Celery:</span>
              <span className="text-indigo-400 font-medium">{systemHealth.activeWorkersCount} Workers</span>
            </div>

            {/* VLM Engine */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-zinc-400">VLM:</span>
              <span className={systemHealth.hasGeminiApiKey ? 'text-sky-400 font-medium' : 'text-amber-400 font-medium'}>
                {systemHealth.hasGeminiApiKey ? 'Gemini 3.8 Flash' : 'Calibrated Perception'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-zinc-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'review'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Review Station (PRD 10 Scenarios)</span>
          </button>

          <button
            onClick={() => setActiveTab('opencv')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'opencv'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>OpenCV Preprocessing Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('barcode')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'barcode'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Barcode & Coverage Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('vlm')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'vlm'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>VLM Context & Prompt Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('celery')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'celery'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Celery / RQ + Redis Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Audit Trail & Overrides</span>
          </button>
        </div>
      </div>
    </header>
  );
};
