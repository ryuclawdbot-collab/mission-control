import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const AGENT_WORKSPACES: Record<string, string> = {
  main: '/home/node/clawd',
  coach: '/home/node/coach-workspace',
  '818boyz': '/home/node/818boyz-workspace',
};

const ALLOWED_FILES = [
  'SOUL.md',
  'USER.md',
  'AGENTS.md',
  'MEMORY.md',
  'TOOLS.md',
  'IDENTITY.md',
  'HEARTBEAT.md',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const workspacePath = AGENT_WORKSPACES[agentId];

    if (!workspacePath) {
      return NextResponse.json(
        { error: 'Unknown agent ID' },
        { status: 404 }
      );
    }

    const files = await Promise.all(
      ALLOWED_FILES.map(async (filename) => {
        const filePath = path.join(workspacePath, filename);
        try {
          const stats = await fs.stat(filePath);
          return {
            filename,
            exists: true,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        } catch {
          return {
            filename,
            exists: false,
            size: 0,
            modified: null,
          };
        }
      })
    );

    return NextResponse.json({ agent_id: agentId, workspace: workspacePath, files });
  } catch (error) {
    console.error('Failed to list agent files:', error);
    return NextResponse.json(
      { error: 'Failed to list agent files' },
      { status: 500 }
    );
  }
}
