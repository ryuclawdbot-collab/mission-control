'use client';

import { useState } from 'react';
import { FileText, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AgentFilesEditor } from './AgentFilesEditor';
import { CronJobsViewer } from './CronJobsViewer';
import { GatewayStatus } from './GatewayStatus';

type Tab = 'files' | 'cron';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('files');

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 bg-mc-bg-secondary border-b border-mc-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-mc-bg-tertiary rounded text-mc-text-secondary transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-mc-text uppercase tracking-wider text-sm">
            Agent Admin
          </span>

          {/* Tabs */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                activeTab === 'files'
                  ? 'bg-mc-accent-cyan/20 text-mc-accent-cyan'
                  : 'hover:bg-mc-bg-tertiary text-mc-text-secondary'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Files
            </button>
            <button
              onClick={() => setActiveTab('cron')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                activeTab === 'cron'
                  ? 'bg-mc-accent-cyan/20 text-mc-accent-cyan'
                  : 'hover:bg-mc-bg-tertiary text-mc-text-secondary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Cron Jobs
            </button>
          </div>
        </div>

        {/* Gateway status */}
        <GatewayStatus />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <AgentFilesEditor />}
        {activeTab === 'cron' && (
          <div className="h-full overflow-y-auto">
            <CronJobsViewer />
          </div>
        )}
      </div>
    </div>
  );
}
