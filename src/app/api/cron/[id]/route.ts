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

// PUT /api/cron/:id - Update a cron job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const updates = await request.json();

    // Read existing jobs
    const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
    const jobs: CronJob[] = JSON.parse(content);

    // Find and update job
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    jobs[jobIndex] = { ...jobs[jobIndex], ...updates };

    // Write back
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

// DELETE /api/cron/:id - Delete a cron job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Read existing jobs
    const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
    const jobs: CronJob[] = JSON.parse(content);

    // Filter out the job
    const filteredJobs = jobs.filter((j) => j.id !== jobId);

    if (filteredJobs.length === jobs.length) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Write back
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
