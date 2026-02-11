'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertCircle, Server } from 'lucide-react';

interface GatewayStatusData {
  connected: boolean;
  gateway_url: string;
  agent_count: number;
  sessions?: unknown[];
  error?: string;
}

export function GatewayStatus() {
  const [status, setStatus] = useState<GatewayStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadStatus();
    // Poll status every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const res = await fetch('/api/gateway/status');
      const data: GatewayStatusData = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load gateway status:', error);
      setStatus({
        connected: false,
        gateway_url: 'Unknown',
        agent_count: 0,
        error: 'Failed to load status',
      });
    }
  }

  async function restartGateway() {
    setRestarting(true);
    try {
      const res = await fetch('/api/gateway/restart', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        // Wait a few seconds then reload status
        setTimeout(() => {
          loadStatus();
          setRestarting(false);
        }, 3000);
      } else {
        throw new Error(data.error || 'Restart failed');
      }
    } catch (error) {
      console.error('Failed to restart gateway:', error);
      alert(`Failed to restart gateway: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRestarting(false);
    } finally {
      setShowConfirm(false);
    }
  }

  if (!status) {
    return (
      <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse" />
          <span className="text-sm">Loading gateway status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between border-b border-gray-700">
      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              status.connected
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
            }`}
            title={status.connected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-sm font-medium">
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Agent Count */}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Activity className="w-4 h-4" />
          <span>
            {status.agent_count} {status.agent_count === 1 ? 'agent' : 'agents'}
          </span>
        </div>

        {/* Gateway URL */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Server className="w-4 h-4" />
          <span className="font-mono text-xs">
            {status.gateway_url.replace('ws://', '').replace('wss://', '')}
          </span>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{status.error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        <button
          onClick={() => {
            setLoading(true);
            loadStatus().finally(() => setLoading(false));
          }}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
          title="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Restart Button */}
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-yellow-400">Restart gateway?</span>
            <button
              onClick={restartGateway}
              disabled={restarting}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {restarting ? 'Restarting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
            title="Restart OpenClaw Gateway"
          >
            <RefreshCw className="w-4 h-4" />
            Restart Gateway
          </button>
        )}
      </div>
    </div>
  );
}
