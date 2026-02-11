import { getOpenClawClient } from '@/lib/openclaw/client';

interface GatewayAgentInfo {
  id: string;
  name?: string;
}

interface GatewayAgentsList {
  defaultId?: string;
  mainKey?: string;
  agents: GatewayAgentInfo[];
}

interface GatewayAgentFile {
  name: string;
  path: string;
  missing?: boolean;
  size?: number;
  updatedAtMs?: number;
  content?: string;
}

interface GatewayAgentFilesList {
  agentId: string;
  workspace?: string;
  files: GatewayAgentFile[];
}

interface GatewayAgentFileGet {
  agentId: string;
  workspace?: string;
  file: GatewayAgentFile;
}

async function getConnectedClient() {
  const client = getOpenClawClient();
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}

export async function listGatewayAgents(): Promise<GatewayAgentsList> {
  const client = await getConnectedClient();
  return client.call<GatewayAgentsList>('agents.list');
}

export async function listGatewayAgentFiles(agentId: string): Promise<GatewayAgentFilesList> {
  const client = await getConnectedClient();
  return client.call<GatewayAgentFilesList>('agents.files.list', { agentId });
}

export async function getGatewayAgentFile(agentId: string, name: string): Promise<GatewayAgentFileGet> {
  const client = await getConnectedClient();
  return client.call<GatewayAgentFileGet>('agents.files.get', { agentId, name });
}

export async function setGatewayAgentFile(agentId: string, name: string, content: string): Promise<GatewayAgentFileGet> {
  const client = await getConnectedClient();
  return client.call<GatewayAgentFileGet>('agents.files.set', { agentId, name, content });
}

export async function getGatewayCronList() {
  const client = await getConnectedClient();
  return client.call<{ jobs: unknown[] }>('cron.list');
}

export async function updateGatewayCronJob(id: string, patch: Record<string, unknown>) {
  const client = await getConnectedClient();
  return client.call('cron.update', { id, patch });
}

export async function removeGatewayCronJob(id: string) {
  const client = await getConnectedClient();
  return client.call('cron.remove', { id });
}

export async function runGatewayCronJob(id: string) {
  const client = await getConnectedClient();
  return client.call('cron.run', { id });
}

export async function addGatewayCronJob(params: Record<string, unknown>) {
  const client = await getConnectedClient();
  return client.call('cron.add', params);
}
