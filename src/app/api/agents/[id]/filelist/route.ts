import { NextRequest, NextResponse } from 'next/server';
import { EDITABLE_FILES } from '@/lib/agent-workspaces';
import { listGatewayAgentFiles, listGatewayAgents } from '@/lib/openclaw/gateway-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const agents = await listGatewayAgents();
    const agent = agents.agents.find((a) => a.id === agentId);

    if (!agent) {
      return NextResponse.json({ error: 'Unknown agent ID' }, { status: 404 });
    }

    const fileList = await listGatewayAgentFiles(agentId);
    const byName = new Map(fileList.files.map((file) => [file.name, file]));

    const files = EDITABLE_FILES.map((filename) => {
      const file = byName.get(filename);
      return {
        filename,
        exists: !!file && !file.missing,
        size: file?.size ?? 0,
        modified: file?.updatedAtMs ? new Date(file.updatedAtMs).toISOString() : null,
      };
    });

    return NextResponse.json({
      agent_id: agentId,
      workspace: fileList.workspace,
      files,
    });
  } catch (error) {
    console.error('Failed to list agent files via gateway:', error);
    return NextResponse.json({ error: 'Failed to list agent files' }, { status: 500 });
  }
}
