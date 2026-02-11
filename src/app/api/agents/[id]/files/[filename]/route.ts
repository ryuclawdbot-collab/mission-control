import { NextRequest, NextResponse } from 'next/server';
import { getAgentWorkspace, EDITABLE_FILES } from '@/lib/agent-workspaces';
import * as fs from 'fs';
import * as path from 'path';

// GET /api/agents/:id/files/:filename - Read a file
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  const workspace = getAgentWorkspace(params.id);
  if (!workspace) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const filename = decodeURIComponent(params.filename);
  if (!EDITABLE_FILES.includes(filename)) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
  }

  const filePath = path.join(workspace.path, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: '', exists: false });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const stat = fs.statSync(filePath);

  return NextResponse.json({
    content,
    exists: true,
    mtime: stat.mtime.toISOString(),
    size: stat.size,
  });
}

// PUT /api/agents/:id/files/:filename - Write a file
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  const workspace = getAgentWorkspace(params.id);
  if (!workspace) {
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

  const filePath = path.join(workspace.path, filename);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  const stat = fs.statSync(filePath);

  return NextResponse.json({
    success: true,
    mtime: stat.mtime.toISOString(),
    size: stat.size,
  });
}
