import { NextRequest, NextResponse } from 'next/server';
import { EDITABLE_FILES } from '@/lib/agent-workspaces';
import { getGatewayAgentFile, listGatewayAgents, setGatewayAgentFile } from '@/lib/openclaw/gateway-admin';

async function ensureAgentExists(agentId: string): Promise<boolean> {
  const agents = await listGatewayAgents();
  return agents.agents.some((agent) => agent.id === agentId);
}

// GET /api/agents/:id/files/:filename - Read a file via OpenClaw gateway
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const exists = await ensureAgentExists(params.id);
    if (!exists) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const filename = decodeURIComponent(params.filename);
    if (!EDITABLE_FILES.includes(filename)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }

    const result = await getGatewayAgentFile(params.id, filename);
    const file = result.file;

    if (file.missing) {
      return NextResponse.json({ content: '', exists: false });
    }

    return NextResponse.json({
      content: file.content ?? '',
      exists: true,
      mtime: file.updatedAtMs ? new Date(file.updatedAtMs).toISOString() : null,
      size: file.size ?? 0,
    });
  } catch (error) {
    console.error('Failed to read agent file via gateway:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

// PUT /api/agents/:id/files/:filename - Write a file via OpenClaw gateway
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const exists = await ensureAgentExists(params.id);
    if (!exists) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const filename = decodeURIComponent(params.filename);
    if (!EDITABLE_FILES.includes(filename)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }

    const result = await setGatewayAgentFile(params.id, filename, content);
    const file = result.file;

    return NextResponse.json({
      success: true,
      mtime: file.updatedAtMs ? new Date(file.updatedAtMs).toISOString() : null,
      size: file.size ?? Buffer.byteLength(content, 'utf-8'),
    });
  } catch (error) {
    console.error('Failed to write agent file via gateway:', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
