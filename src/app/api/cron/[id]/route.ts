import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CRON_JOBS_PATH = path.join(
  process.env.HOME || '/home/node',
  '.openclaw/cron/jobs.json'
);

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  [key: string]: unknown;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const updates = await request.json();

    const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
    const jobs: CronJob[] = JSON.parse(content);

    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    jobs[jobIndex] = { ...jobs[jobIndex], ...updates };

    await fs.writeFile(CRON_JOBS_PATH, JSON.stringify(jobs, null, 2), 'utf-8');

    return NextResponse.json(jobs[jobIndex]);
  } catch (error) {
    console.error('Failed to update cron job:', error);
    return NextResponse.json(
      { error: 'Failed to update cron job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
    const jobs: CronJob[] = JSON.parse(content);

    const filteredJobs = jobs.filter((j) => j.id !== jobId);

    if (filteredJobs.length === jobs.length) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await fs.writeFile(
      CRON_JOBS_PATH,
      JSON.stringify(filteredJobs, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true, deleted: jobId });
  } catch (error) {
    console.error('Failed to delete cron job:', error);
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
      { status: 500 }
    );
  }
}
