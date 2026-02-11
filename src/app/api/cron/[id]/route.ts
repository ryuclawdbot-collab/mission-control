import { NextRequest, NextResponse } from 'next/server';
import { removeGatewayCronJob, updateGatewayCronJob } from '@/lib/openclaw/gateway-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const result = await updateGatewayCronJob(params.id, updates);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update cron job via gateway:', error);
    return NextResponse.json({ error: 'Failed to update cron job' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await removeGatewayCronJob(params.id);
    return NextResponse.json({ success: true, deleted: params.id });
  } catch (error) {
    console.error('Failed to delete cron job via gateway:', error);
    return NextResponse.json({ error: 'Failed to delete cron job' }, { status: 500 });
  }
}
