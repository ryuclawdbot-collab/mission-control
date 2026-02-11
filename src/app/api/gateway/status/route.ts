import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/lib/openclaw/client';

// GET /api/gateway/status - Get gateway connection status
export async function GET() {
  try {
    const client = getOpenClawClient();
    const isConnected = client.isConnected();

    if (!isConnected) {
      // Try to connect
      try {
        await client.connect();
      } catch {
        // Connection failed
      }
    }

    let sessions: unknown[] = [];
    let nodes: unknown[] = [];

    if (client.isConnected()) {
      try {
        sessions = await client.listSessions();
        nodes = await client.listNodes();
      } catch (error) {
        console.error('Failed to fetch gateway data:', error);
      }
    }

    const agentCount = sessions.length;

    return NextResponse.json({
      connected: client.isConnected(),
      gateway_url: process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789',
      agent_count: agentCount,
      sessions,
      nodes,
    });
  } catch (error) {
    console.error('Failed to get gateway status:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Failed to get gateway status',
      },
      { status: 500 }
    );
  }
}
