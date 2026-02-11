import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addGatewayCronJob, getGatewayCronList } from '@/lib/openclaw/gateway-admin';

interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string | { kind?: string; expr?: string; tz?: string };
  agentId?: string;
  channel?: string;
  enabled: boolean;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const response = await getGatewayCronList();
    const jobs = (response.jobs || []) as CronJob[];

    const grouped: Record<string, Record<string, CronJob[]>> = {};

    for (const job of jobs) {
      const agent = job.agentId || 'unknown';
      const channel = job.channel || 'default';

      if (!grouped[agent]) grouped[agent] = {};
      if (!grouped[agent][channel]) grouped[agent][channel] = [];
      grouped[agent][channel].push(job);
    }

    return NextResponse.json({ jobs, grouped });
  } catch (error) {
    console.error('Failed to read cron jobs from gateway:', error);
    return NextResponse.json({ error: 'Failed to read cron jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.schedule) {
      return NextResponse.json({ error: 'Name and schedule are required' }, { status: 400 });
    }

    const schedule = typeof body.schedule === 'string'
      ? { kind: 'cron', expr: body.schedule }
      : body.schedule;

    const jobPayload = {
      id: body.id || uuidv4(),
      name: body.name,
      description: body.description,
      enabled: body.enabled !== false,
      agentId: body.agentId || body.agent,
      channel: body.channel,
      schedule,
      sessionTarget: body.sessionTarget || {
        kind: 'agent',
        agentId: body.agentId || body.agent || 'main',
      },
      payload: body.payload || {
        kind: 'text',
        message: body.message || body.description || body.name,
      },
      delivery: body.delivery,
      ...body,
    };

    const result = await addGatewayCronJob(jobPayload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create cron job via gateway:', error);
    return NextResponse.json({ error: 'Failed to create cron job' }, { status: 500 });
  }
}
