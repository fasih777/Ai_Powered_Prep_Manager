'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Database,
  RefreshCw,
  Play,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Send,
  Terminal,
  Layers,
  Cpu
} from 'lucide-react';
import { CeleryTask, CeleryWorker, RedisInfoStats } from '@/lib/lab/queue/celeryQueueEngine';

interface CeleryQueueMonitorProps {
  onEnqueueJob: (priority?: boolean) => void;
}

export const CeleryQueueMonitor: React.FC<CeleryQueueMonitorProps> = ({ onEnqueueJob }) => {
  const [tasks, setTasks] = useState<CeleryTask[]>([]);
  const [workers, setWorkers] = useState<CeleryWorker[]>([]);
  const [redisInfo, setRedisInfo] = useState<RedisInfoStats | null>(null);
  const [selectedTask, setSelectedTask] = useState<CeleryTask | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueueData = async () => {
    try {
      const [tasksRes, workersRes] = await Promise.all([
        fetch('/api/v1/prep-review/tasks'),
        fetch('/api/v1/workers/status')
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
        if (selectedTask) {
          const updated = data.tasks.find((t: CeleryTask) => t.id === selectedTask.id);
          if (updated) setSelectedTask(updated);
        }
      }

      if (workersRes.ok) {
        const data = await workersRes.json();
        setWorkers(data.workers || []);
        setRedisInfo(data.redis || null);
      }
    } catch (err) {
      console.warn('Queue poll error:', err);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 800);
    return () => clearInterval(interval);
  }, [selectedTask?.id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchQueueData();
    setIsRefreshing(false);
  };

  const handleRetry = async (taskId: string) => {
    try {
      await fetch(`/api/v1/prep-review/tasks/${taskId}/retry`, { method: 'POST' });
      fetchQueueData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'SUCCESS':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'FAILURE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'RETRY':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'PREPROCESSING':
      case 'PERCEPTION_VLM':
      case 'RULE_EVALUATION':
      case 'STARTED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Enqueue Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                Celery / RQ + Redis Async Background Job Queues
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                Worker Pool Architecture
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Simulates production async warehouse ingest pipelines: task serialization, worker concurrency pools, exponential backoff retries, and dead-letter queues (DLQ).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEnqueueJob(false)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enqueue Standard Job</span>
            </button>

            <button
              onClick={() => onEnqueueJob(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Enqueue High Priority</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              title="Refresh queue status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Redis Telemetry Strip */}
        {redisInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Redis Server Engine</span>
              <span className="text-zinc-200 font-bold">{redisInfo.redisVersion}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Queue Depths</span>
              <span className="text-sky-400 font-bold">
                Default: {redisInfo.queueLengths['queue:prep_reviews'] || 0} • High: {redisInfo.queueLengths['queue:high_priority'] || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Dead-Letter Queue (DLQ)</span>
              <span className="text-rose-400 font-bold">
                {redisInfo.queueLengths['dlq:prep_reviews'] || 0} Failed Tasks
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Used Memory</span>
              <span className="text-emerald-400 font-bold">{redisInfo.usedMemoryKb} KB</span>
            </div>
          </div>
        )}
      </div>

      {/* Worker Fleet Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Active Celery Worker Fleet ({workers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className={`p-4 rounded-xl border transition-all ${
                worker.status === 'BUSY'
                  ? 'bg-zinc-900 border-indigo-500/40 shadow-indigo-950/20 shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-zinc-100">{worker.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 block">ID: {worker.id}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    worker.status === 'BUSY'
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {worker.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Subscribed Queue:</span>
                  <span className="text-zinc-200">{worker.queue}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Tasks Completed / Failed:</span>
                  <span className="text-zinc-200">
                    <span className="text-emerald-400">{worker.tasksCompleted}</span> /{' '}
                    <span className="text-rose-400">{worker.tasksFailed}</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>CPU Load:</span>
                  <span className="text-sky-400">{worker.cpuLoad}%</span>
                </div>
              </div>

              {worker.activeTaskId && (
                <div className="mt-2.5 p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-indigo-300">
                  <span className="text-zinc-500 block text-[9px] uppercase">Processing Task:</span>
                  <span className="truncate block font-bold">{worker.activeTaskId}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Queue Ledger & Task Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Queue Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Real-time Task Stream ({tasks.length})
            </h3>
            <span className="text-xs text-zinc-500">Auto-refreshing 800ms</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80 shadow-sm max-h-[500px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No tasks currently in queue. Click "Enqueue Standard Job" above.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs ${
                    selectedTask?.id === task.id
                      ? 'bg-sky-500/10'
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-zinc-200">{task.id}</span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {task.queue.replace('queue:', '')}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getStateColor(
                        task.state
                      )}`}
                    >
                      {task.state}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden my-2 border border-zinc-800">
                    <div
                      style={{ width: `${task.progressPercent}%` }}
                      className={`h-full transition-all duration-300 ${
                        task.state === 'SUCCESS'
                          ? 'bg-emerald-500'
                          : task.state === 'FAILURE'
                          ? 'bg-rose-500'
                          : 'bg-sky-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>
                      {task.workerId ? `Worker: ${task.workerId.split('@')[0]}` : 'Waiting for worker...'}
                    </span>
                    <span>
                      {task.executionTimeMs ? `${task.executionTimeMs}ms` : `${task.progressPercent}%`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Task Inspector & Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Task Execution Logs & Telemetry
          </h3>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-4">
            {selectedTask ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-100 font-mono block">
                      {selectedTask.id}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Task: {selectedTask.taskName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRetry(selectedTask.id)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-medium rounded border border-zinc-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Trigger Retry</span>
                  </button>
                </div>

                {/* Step Logs Console */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-300 flex items-center space-x-1">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>Celery Worker Execution Log:</span>
                  </span>
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[10px] space-y-2 max-h-72 overflow-y-auto">
                    {selectedTask.logs.map((log, i) => (
                      <div key={i} className="leading-tight">
                        <span className="text-zinc-500">[{new Date(log.timestamp).toLocaleTimeString()}] </span>
                        <span className="text-sky-400 font-bold">[{log.step}] </span>
                        <span className={log.level === 'error' ? 'text-rose-400' : 'text-zinc-300'}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Result Summary if finished */}
                {selectedTask.result && (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <span className="text-zinc-400 block text-[10px] uppercase">Review Verdict:</span>
                    <span
                      className={`text-sm font-black block mt-0.5 ${
                        selectedTask.result.overallStatus === 'PASS'
                          ? 'text-emerald-400'
                          : selectedTask.result.overallStatus === 'FAIL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      PREP STATUS: {selectedTask.result.overallStatus}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 block leading-tight">
                      {selectedTask.result.summary}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Select a task from the stream to view worker execution logs and Redis state hashes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
