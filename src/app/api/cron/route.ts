import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const CRON_JOBS_PATH = path.join(
  process.env.HOME || '/home/node',
  '.openclaw/cron/jobs.json'
);

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

// GET /api/cron - List all cron jobs
export async function GET() {
  try {
    const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
    const jobs: CronJob[] = JSON.parse(content);

    // Group jobs by agent and channel
    const grouped: Record<string, Record<string, CronJob[]>> = {};

    for (const job of jobs) {
      const agent = job.agent || 'unknown';
      const channel = job.channel || 'default';

      if (!grouped[agent]) {
        grouped[agent] = {};
      }
      if (!grouped[agent][channel]) {
        grouped[agent][channel] = [];
      }

      grouped[agent][channel].push(job);
    }

    return NextResponse.json({
      jobs,
      grouped,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ jobs: [], grouped: {} });
    }

    console.error('Failed to read cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to read cron jobs' },
      { status: 500 }
    );
  }
}

// POST /api/cron - Create a new cron job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.schedule) {
      return NextResponse.json(
        { error: 'Name and schedule are required' },
        { status: 400 }
      );
    }

    // Read existing jobs
    let jobs: CronJob[] = [];
    try {
      const content = await fs.readFile(CRON_JOBS_PATH, 'utf-8');
      jobs = JSON.parse(content);
    } catch {
      // File doesn't exist, start with empty array
    }

    // Create new job
    const newJob: CronJob = {
      id: body.id || uuidv4(),
      name: body.name,
      description: body.description,
      schedule: body.schedule,
      agent: body.agent,
      channel: body.channel,
      enabled: body.enabled !== false,
      ...body,
    };

    jobs.push(newJob);

    // Ensure directory exists
    const dir = path.dirname(CRON_JOBS_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Write back
    await fs.writeFile(CRON_JOBS_PATH, JSON.stringify(jobs, null, 2), 'utf-8');

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Failed to create cron job:', error);
    return NextResponse.json(
      { error: 'Failed to create cron job' },
      { status: 500 }
    );
  }
}
