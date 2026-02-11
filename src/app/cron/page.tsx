'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Trash2, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import cronstrue from 'cronstrue';

interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  agent?: string;
  channel?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: string;
  [key: string]: unknown;
}

interface CronData {
  jobs: CronJob[];
  grouped: Record<string, Record<string, CronJob[]>>;
}

const AGENT_NAMES: Record<string, string> = {
  main: 'Jarvis',
  coach: 'Lasso',
  '818boyz': 'Roy_bot',
};

function getFrequencyColor(schedule: string): string {
  // Parse cron expression to determine frequency
  const parts = schedule.split(' ');
  if (parts.length < 5) return 'bg-gray-500';

  const minute = parts[0];
  const hour = parts[1];

  // Every few minutes (red)
  if (minute.includes('/') && !minute.includes('*')) {
    const interval = parseInt(minute.split('/')[1]);
    if (interval < 30) return 'bg-red-500';
  }

  // Hourly (yellow)
  if (hour === '*' || hour.includes('/')) {
    return 'bg-yellow-500';
  }

  // Daily/weekly (green)
  return 'bg-green-500';
}

function getReadableSchedule(schedule: string): string {
  try {
    return cronstrue.toString(schedule);
  } catch {
    return schedule;
  }
}

export default function CronJobsPage() {
  const [data, setData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cron');
      if (!res.ok) throw new Error('Failed to load cron jobs');
      const cronData: CronData = await res.json();
      setData(cronData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  }

  async function toggleJob(job: CronJob) {
    try {
      const res = await fetch(`/api/cron/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle job');
      await loadJobs();
    } catch (err) {
      alert(`Failed to toggle job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function runJob(job: CronJob) {
    if (!confirm(`Run "${job.name}" now?`)) return;

    try {
      const res = await fetch(`/api/cron/${job.id}/run`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run job');
      alert(`Job "${job.name}" triggered successfully`);
    } catch (err) {
      alert(`Failed to run job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function deleteJob(job: CronJob) {
    if (!confirm(`Delete "${job.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/cron/${job.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete job');
      await loadJobs();
    } catch (err) {
      alert(`Failed to delete job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cron Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Scheduled tasks and heartbeats across all agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadJobs()}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => alert('Create job feature coming soon')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        {data && data.jobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No cron jobs found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first scheduled task
            </p>
            <button
              onClick={() => alert('Create job feature coming soon')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Job
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {data &&
              Object.entries(data.grouped).map(([agent, channels]) => (
                <div key={agent} className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {AGENT_NAMES[agent] || agent}
                    </h2>
                  </div>

                  {Object.entries(channels).map(([channel, jobs]) => (
                    <div key={channel} className="border-b border-gray-100 last:border-0">
                      <div className="px-6 py-3 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-700">
                          {channel === 'default' ? 'Default Channel' : channel}
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Frequency Indicator */}
                              <div
                                className={`w-2 h-2 rounded-full ${getFrequencyColor(
                                  job.schedule
                                )}`}
                                title={getReadableSchedule(job.schedule)}
                              />

                              {/* Job Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium text-gray-900">
                                    {job.name}
                                  </h4>
                                  {!job.enabled && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                {job.description && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {job.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="font-mono">
                                    {getReadableSchedule(job.schedule)}
                                  </span>
                                  {job.lastRun && (
                                    <span>
                                      Last run:{' '}
                                      {new Date(job.lastRun).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={job.enabled}
                                  onChange={() => toggleJob(job)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>

                              <button
                                onClick={() => runJob(job)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Run now"
                              >
                                <Play className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => deleteJob(job)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete job"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
