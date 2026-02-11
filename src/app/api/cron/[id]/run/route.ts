import { NextRequest, NextResponse } from 'next/server';
import { runGatewayCronJob } from '@/lib/openclaw/gateway-admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await runGatewayCronJob(params.id);

    return NextResponse.json({
      success: true,
      message: `Job ${params.id} execution triggered`,
      job_id: params.id,
      result,
    });
  } catch (error) {
    console.error('Failed to run cron job via gateway:', error);
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
