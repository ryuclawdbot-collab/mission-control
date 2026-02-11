'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Pause, RotateCw, Loader2, CheckCircle, XCircle, Timer } from 'lucide-react';
import cronstrue from 'cronstrue';
import { formatDistanceToNow } from 'date-fns';

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  agentId?: string;
  schedule: {
    kind: string;
    expr: string;
    tz?: string;
  };
  payload: {
    kind: string;
    message?: string;
  };
  delivery?: {
    mode: string;
    channel: string;
    to?: string;
  };
  state?: {
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    nextRunAtMs?: number;
    consecutiveErrors?: number;
  };
}

function getFrequencyColor(expr: string): string {
  // Simple heuristic based on cron expression
  if (expr.startsWith('*/')) {
    const min = parseInt(expr.split(' ')[0].replace('*/', ''));
    if (min <= 5) return 'text-mc-accent-red bg-mc-accent-red/20';
    if (min <= 30) return 'text-mc-accent-yellow bg-mc-accent-yellow/20';
  }
  if (expr.includes('* * *')) return 'text-mc-accent-green bg-mc-accent-green/20'; // daily
  return 'text-mc-accent-cyan bg-mc-accent-cyan/20';
}

export function CronJobsViewer() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      await fetch(`/api/cron/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, enabled } : j)));
    } catch {
      alert('Failed to update job');
    }
  };

  const runJob = async (jobId: string) => {
    setRunningJobs(prev => new Set(prev).add(jobId));
    try {
      await fetch(`/api/cron/${jobId}/run`, { method: 'POST' });
      // Refresh after a delay
      setTimeout(fetchJobs, 2000);
    } catch {
      alert('Failed to run job');
    } finally {
      setRunningJobs(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  // Group by agent
  const grouped = jobs.reduce<Record<string, CronJob[]>>((acc, job) => {
    const key = job.agentId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  const agentLabels: Record<string, { name: string; emoji: string }> = {
    main: { name: 'Jarvis', emoji: '🤖' },
    coach: { name: 'Lasso', emoji: '🏈' },
    '818boyz': { name: 'Roy_bot', emoji: '🎮' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-mc-text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-mc-accent-cyan" />
          <h2 className="text-lg font-semibold">Cron Jobs</h2>
          <span className="text-xs text-mc-text-secondary bg-mc-bg-tertiary px-2 py-0.5 rounded">
            {jobs.length} jobs
          </span>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-mc-bg-tertiary hover:bg-mc-bg-secondary rounded transition-colors text-mc-text-secondary"
        >
          <RotateCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {Object.entries(grouped).map(([agentId, agentJobs]) => {
        const label = agentLabels[agentId] || { name: agentId, emoji: '❓' };
        return (
          <div key={agentId} className="space-y-2">
            <h3 className="text-sm font-semibold text-mc-text-secondary flex items-center gap-2">
              <span>{label.emoji}</span>
              <span>{label.name}</span>
              <span className="text-xs text-mc-text-secondary/50">({agentJobs.length})</span>
            </h3>

            <div className="space-y-2">
              {agentJobs.map(job => {
                let humanSchedule = job.schedule.expr;
                try {
                  humanSchedule = cronstrue.toString(job.schedule.expr);
                } catch {
                  // keep raw
                }

                const isRunning = runningJobs.has(job.id);

                return (
                  <div
                    key={job.id}
                    className={`border border-mc-border rounded-lg p-4 bg-mc-bg-secondary ${
                      !job.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{job.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getFrequencyColor(
                              job.schedule.expr
                            )}`}
                          >
                            {humanSchedule}
                          </span>
                          {job.delivery && (
                            <span className="text-xs text-mc-text-secondary bg-mc-bg-tertiary px-2 py-0.5 rounded">
                              {job.delivery.channel}
                            </span>
                          )}
                        </div>

                        {job.payload.message && (
                          <p className="text-xs text-mc-text-secondary line-clamp-2 max-w-2xl">
                            {job.payload.message.slice(0, 150)}
                            {job.payload.message.length > 150 ? '...' : ''}
                          </p>
                        )}

                        {/* Status row */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-mc-text-secondary">
                          {job.state?.lastRunAtMs && (
                            <div className="flex items-center gap-1">
                              {job.state.lastStatus === 'ok' ? (
                                <CheckCircle className="w-3 h-3 text-mc-accent-green" />
                              ) : (
                                <XCircle className="w-3 h-3 text-mc-accent-red" />
                              )}
                              <span>
                                Last: {formatDistanceToNow(job.state.lastRunAtMs, { addSuffix: true })}
                              </span>
                            </div>
                          )}
                          {job.state?.lastDurationMs && (
                            <div className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              <span>{(job.state.lastDurationMs / 1000).toFixed(1)}s</span>
                            </div>
                          )}
                          {job.state?.nextRunAtMs && (
                            <span>
                              Next: {formatDistanceToNow(job.state.nextRunAtMs, { addSuffix: true })}
                            </span>
                          )}
                          {(job.state?.consecutiveErrors ?? 0) > 0 && (
                            <span className="text-mc-accent-red">
                              {job.state!.consecutiveErrors} consecutive errors
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => runJob(job.id)}
                          disabled={isRunning || !job.enabled}
                          className="p-1.5 hover:bg-mc-bg-tertiary rounded text-mc-accent-green disabled:opacity-30 transition-colors"
                          title="Run Now"
                        >
                          {isRunning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleJob(job.id, !job.enabled)}
                          className={`p-1.5 hover:bg-mc-bg-tertiary rounded transition-colors ${
                            job.enabled ? 'text-mc-accent-yellow' : 'text-mc-text-secondary'
                          }`}
                          title={job.enabled ? 'Disable' : 'Enable'}
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {jobs.length === 0 && (
        <div className="text-center text-mc-text-secondary py-12">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No cron jobs found</p>
        </div>
      )}
    </div>
  );
}
