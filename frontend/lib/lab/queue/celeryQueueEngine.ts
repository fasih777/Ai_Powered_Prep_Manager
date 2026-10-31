export interface CeleryTask {
  id: string;
  name: string;
  taskName: string;
  args: any[];
  kwargs: Record<string, any>;
  retries: number;
  eta?: string;
  expires?: string;
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';
  state: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';
  result?: any;
  traceback?: string;
  timestamp: string;
  runtime?: number;
  queue: string;
  progressPercent: number;
  workerId?: string;
  executionTimeMs?: number;
  logs: Array<{ timestamp: string; step: string; message: string; level?: 'info' | 'error' | 'warning' }>;
}

export interface CeleryWorker {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE';
  concurrency: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastHeartbeat: string;
  queues: string[];
  queue: string;
  tasksCompleted: number;
  tasksFailed: number;
  cpuLoad: number;
  activeTaskId?: string;
}

export interface RedisInfoStats {
  redisVersion: string;
  connectedClients: number;
  usedMemory: string;
  usedMemoryKb: number;
  usedMemoryHuman: string;
  totalSystemMemory: string;
  totalSystemMemoryHuman: string;
  maxMemory: string;
  maxMemoryHuman: string;
  memFragmentationRatio: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: number;
  totalConnections: number;
  expiredKeys: number;
  evictedKeys: number;
  uptimeInSeconds: number;
  uptimeInDays: string;
  queueLengths: Record<string, number>;
}

export interface QueueMetrics {
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalTasks: number;
  averageRuntime: number;
  throughput: number;
}

/**
 * Celery Queue Engine - TypeScript client interface
 * Provides type definitions and simulated queue operations for the frontend
 */
export class CeleryQueueEngine {
  private static instance: CeleryQueueEngine;
  private tasks: Map<string, CeleryTask> = new Map();
  private workers: Map<string, CeleryWorker> = new Map();

  private constructor() {
    // Initialize with simulated data
    this.initializeSimulatedData();
  }

  static getInstance(): CeleryQueueEngine {
    if (!CeleryQueueEngine.instance) {
      CeleryQueueEngine.instance = new CeleryQueueEngine();
    }
    return CeleryQueueEngine.instance;
  }

  private initializeSimulatedData(): void {
    // Simulate some initial tasks
    const task1: CeleryTask = {
      id: 'task-001',
      name: 'prep_review.evaluate_sync',
      taskName: 'prep_review.evaluate_sync',
      args: [],
      kwargs: { category: 'liquids', imageUrls: ['img1.jpg', 'img2.jpg'] },
      retries: 0,
      status: 'SUCCESS',
      state: 'SUCCESS',
      result: { verdict: 'PASS', checks: [] },
      timestamp: new Date(Date.now() - 5000).toISOString(),
      runtime: 2.3,
      queue: 'queue:prep_reviews',
      progressPercent: 100,
      workerId: 'worker-1@localhost',
      executionTimeMs: 2300,
      logs: [
        { timestamp: new Date(Date.now() - 5000).toISOString(), step: 'QUEUED', message: 'Task enqueued to prep_reviews queue', level: 'info' },
        { timestamp: new Date(Date.now() - 4800).toISOString(), step: 'STARTED', message: 'Worker worker-1@localhost started processing', level: 'info' },
        { timestamp: new Date(Date.now() - 4500).toISOString(), step: 'PREPROCESSING', message: 'OpenCV quality gate passed', level: 'info' },
        { timestamp: new Date(Date.now() - 4000).toISOString(), step: 'VLM_INFERENCE', message: 'Gemini VLM analysis completed', level: 'info' },
        { timestamp: new Date(Date.now() - 3000).toISOString(), step: 'EVALUATION', message: 'Rule engine verdict: PASS', level: 'info' },
        { timestamp: new Date(Date.now() - 2700).toISOString(), step: 'SUCCESS', message: 'Task completed successfully', level: 'info' }
      ]
    };

    const task2: CeleryTask = {
      id: 'task-002',
      name: 'prep_review.evaluate_sync',
      taskName: 'prep_review.evaluate_sync',
      args: [],
      kwargs: { category: 'fragile', imageUrls: ['img3.jpg'] },
      retries: 1,
      status: 'RETRY',
      state: 'RETRY',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      runtime: 5.1,
      queue: 'queue:high_priority',
      progressPercent: 65,
      workerId: 'worker-1@localhost',
      logs: [
        { timestamp: new Date(Date.now() - 10000).toISOString(), step: 'QUEUED', message: 'Task enqueued to high_priority queue', level: 'info' },
        { timestamp: new Date(Date.now() - 9800).toISOString(), step: 'STARTED', message: 'Worker worker-1@localhost started processing', level: 'info' },
        { timestamp: new Date(Date.now() - 9500).toISOString(), step: 'PREPROCESSING', message: 'OpenCV quality gate passed', level: 'info' },
        { timestamp: new Date(Date.now() - 9000).toISOString(), step: 'VLM_INFERENCE', message: 'VLM timeout, retrying...', level: 'warning' },
        { timestamp: new Date(Date.now() - 5000).toISOString(), step: 'RETRY', message: 'Retry attempt 1 initiated', level: 'warning' }
      ]
    };

    const task3: CeleryTask = {
      id: 'task-003',
      name: 'prep_review.evaluate_sync',
      taskName: 'prep_review.evaluate_sync',
      args: [],
      kwargs: { category: 'general', imageUrls: ['img4.jpg', 'img5.jpg', 'img6.jpg'] },
      retries: 0,
      status: 'PENDING',
      state: 'PENDING',
      timestamp: new Date().toISOString(),
      queue: 'queue:prep_reviews',
      progressPercent: 0,
      logs: []
    };

    this.tasks.set(task1.id, task1);
    this.tasks.set(task2.id, task2);
    this.tasks.set(task3.id, task3);

    // Simulate workers
    const worker1: CeleryWorker = {
      id: 'worker-1',
      name: 'worker-1@localhost',
      status: 'BUSY',
      concurrency: 4,
      activeTasks: 1,
      completedTasks: 142,
      failedTasks: 3,
      lastHeartbeat: new Date().toISOString(),
      queues: ['prep-review', 'high-priority'],
      queue: 'prep-review',
      tasksCompleted: 142,
      tasksFailed: 3,
      cpuLoad: 75,
      activeTaskId: 'task-002'
    };

    const worker2: CeleryWorker = {
      id: 'worker-2',
      name: 'worker-2@localhost',
      status: 'IDLE',
      concurrency: 4,
      activeTasks: 0,
      completedTasks: 98,
      failedTasks: 1,
      lastHeartbeat: new Date(Date.now() - 2000).toISOString(),
      queues: ['prep-review', 'low-priority'],
      queue: 'low-priority',
      tasksCompleted: 98,
      tasksFailed: 1,
      cpuLoad: 12
    };

    this.workers.set(worker1.name, worker1);
    this.workers.set(worker2.name, worker2);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): CeleryTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get task by ID
   */
  getTaskById(taskId: string): CeleryTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: CeleryTask['status']): CeleryTask[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  /**
   * Get all workers
   */
  getAllWorkers(): CeleryWorker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get worker by name
   */
  getWorkerByName(workerName: string): CeleryWorker | undefined {
    return this.workers.get(workerName);
  }

  /**
   * Get queue metrics
   */
  getQueueMetrics(): QueueMetrics {
    const tasks = this.getAllTasks();
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const active = tasks.filter(t => t.status === 'STARTED' || t.status === 'RETRY').length;
    const completed = tasks.filter(t => t.status === 'SUCCESS').length;
    const failed = tasks.filter(t => t.status === 'FAILURE').length;
    
    const completedTasks = tasks.filter(t => t.status === 'SUCCESS' && t.runtime);
    const avgRuntime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.runtime || 0), 0) / completedTasks.length
      : 0;

    return {
      pendingTasks: pending,
      activeTasks: active,
      completedTasks: completed,
      failedTasks: failed,
      totalTasks: tasks.length,
      averageRuntime: avgRuntime,
      throughput: completed / 60 // tasks per minute (simulated)
    };
  }

  /**
   * Simulate enqueueing a new task
   */
  enqueueTask(taskName: string, kwargs: Record<string, any>, priority: boolean = false): CeleryTask {
    const task: CeleryTask = {
      id: `task-${Date.now()}`,
      name: taskName,
      taskName: taskName,
      args: [],
      kwargs,
      retries: 0,
      status: 'PENDING',
      state: 'PENDING',
      timestamp: new Date().toISOString(),
      queue: priority ? 'queue:high_priority' : 'queue:prep_reviews',
      progressPercent: 0,
      logs: [{ timestamp: new Date().toISOString(), step: 'QUEUED', message: 'Task enqueued', level: 'info' }]
    };

    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * Simulate Redis info stats
   */
  getRedisInfoStats(): RedisInfoStats {
    return {
      redisVersion: '7.2.3',
      connectedClients: 5,
      usedMemory: '1048576',
      usedMemoryKb: 1024,
      usedMemoryHuman: '1.00M',
      totalSystemMemory: '17179869184',
      totalSystemMemoryHuman: '16.00G',
      maxMemory: '0',
      maxMemoryHuman: '0B',
      memFragmentationRatio: 1.05,
      keyspaceHits: 842,
      keyspaceMisses: 23,
      hitRate: 0.973,
      totalConnections: 127,
      expiredKeys: 15,
      evictedKeys: 0,
      uptimeInSeconds: 3600,
      uptimeInDays: '0d 1h 0m 0s',
      queueLengths: {
        'queue:prep_reviews': 3,
        'queue:high_priority': 1,
        'queue:low_priority': 0
      }
    };
  }
}
