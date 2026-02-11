// Agent workspace configuration

export interface AgentWorkspace {
  id: string;
  name: string;
  emoji: string;
  path: string;
}

export const AGENT_WORKSPACES: AgentWorkspace[] = [
  {
    id: 'main',
    name: 'Jarvis',
    emoji: '🤖',
    path: '/home/node/clawd',
  },
  {
    id: 'coach',
    name: 'Lasso',
    emoji: '🧢',
    path: '/home/node/coach-workspace',
  },
  {
    id: '818boyz',
    name: 'Roy_bot',
    emoji: '🎮',
    path: '/home/node/818boyz-workspace',
  },
];

export const EDITABLE_FILES = [
  'SOUL.md',
  'USER.md',
  'AGENTS.md',
  'MEMORY.md',
  'TOOLS.md',
  'IDENTITY.md',
  'HEARTBEAT.md',
];
