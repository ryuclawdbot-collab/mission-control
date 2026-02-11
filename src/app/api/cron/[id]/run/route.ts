import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const CRON_JOBS_PATH = '/home/node/.openclaw/cron/jobs.json';

// POST /api/cron/:id/run - Force run a cron job
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raw = fs.readFileSync(CRON_JOBS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const job = data.jobs.find((j: { id: string }) => j.id === params.id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Use openclaw CLI to trigger job
    try {
      const { stdout } = await execAsync(`openclaw cron run ${params.id}`, { timeout: 30000 });
      return NextResponse.json({ success: true, output: stdout.trim() });
    } catch (cliError) {
      // Fallback: just report we tried
      return NextResponse.json({
        success: false,
        error: `CLI trigger failed: ${cliError instanceof Error ? cliError.message : 'unknown'}`,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run job' },
      { status: 500 }
    );
  }
}
