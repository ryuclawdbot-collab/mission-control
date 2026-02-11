import { NextRequest, NextResponse } from 'next/server';
import { getAgentWorkspace, EDITABLE_FILES } from '@/lib/agent-workspaces';
import * as fs from 'fs';
import * as path from 'path';

// GET /api/agents/:id/filelist - List available files for an agent
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const workspace = getAgentWorkspace(params.id);
  if (!workspace) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const files = EDITABLE_FILES.map(filename => {
    const filePath = path.join(workspace.path, filename);
    const exists = fs.existsSync(filePath);
    let mtime: string | null = null;
    let size = 0;
    if (exists) {
      const stat = fs.statSync(filePath);
      mtime = stat.mtime.toISOString();
      size = stat.size;
    }
    return { filename, exists, mtime, size };
  });

  return NextResponse.json({ agent: workspace, files });
}
