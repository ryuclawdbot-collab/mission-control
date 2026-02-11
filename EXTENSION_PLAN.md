# Mission Control Extension Plan for Shawn's Multi-Agent Setup

**Generated:** 2026-02-10  
**Target:** Extend mission-control to manage 3 agents (Jarvis, Lasso, Roy_bot) with admin dashboard features  
**Repository:** ryuclawdbot-collab/mission-control

---

## Executive Summary

Mission Control is a task orchestration dashboard for OpenClaw agents. It currently focuses on **task management** (Kanban board, planning, deliverables). To support Shawn's 3-agent ecosystem, it needs **agent-centric admin features** inspired by kitze's admin dashboard prompt.

**Current State:**
- ✅ Task creation, planning (Q&A), and dispatch
- ✅ OpenClaw Gateway WebSocket integration
- ✅ Sub-agent session tracking
- ✅ Real-time SSE updates
- ✅ Deliverables and activity logging
- ✅ Workspaces support

**Gap Analysis:**
- ❌ No agent configuration management (SOUL.md, USER.md, etc.)
- ❌ No per-agent skill enable/disable controls
- ❌ No cron job visualization or management
- ❌ No channel binding overview
- ❌ Limited multi-agent orchestration features
- ❌ No agent-specific memory viewer
- ❌ No gateway restart or control features

---

## Architecture Overview

### Current Stack
- **Frontend:** Next.js 14 (React) + Tailwind CSS + Zustand state
- **Backend:** Next.js API routes (serverless functions)
- **Database:** SQLite (better-sqlite3) - local file storage
- **Real-time:** Server-Sent Events (SSE) via `/api/events/stream`
- **OpenClaw:** WebSocket client (`src/lib/openclaw/client.ts`)

### Key Components
| Component | Purpose | Location |
|-----------|---------|----------|
| `WorkspaceDashboard` | Main Kanban board | `src/components/WorkspaceDashboard.tsx` |
| `OpenClawClient` | Gateway WebSocket client | `src/lib/openclaw/client.ts` |
| `TaskModal` | Task creation/editing | `src/components/TaskModal.tsx` |
| `PlanningTab` | AI-guided Q&A planning | `src/components/PlanningTab.tsx` |
| `AgentsSidebar` | Agent list (basic) | `src/components/AgentsSidebar.tsx` |
| `SessionsList` | OpenClaw sessions | `src/components/SessionsList.tsx` |

### Database Schema
- **agents** - Agent profiles (name, role, status, emoji)
- **tasks** - Task queue with status pipeline
- **openclaw_sessions** - Maps agents to OpenClaw sessions
- **task_activities** - Activity log per task
- **task_deliverables** - Output files/URLs
- **planning_questions** - Q&A for task planning
- **workspaces** - Multi-workspace support

---

## Shawn's Setup Requirements

### 3-Agent Ecosystem

| Agent | ID | Channel | Purpose | Cron Jobs |
|-------|-----|---------|---------|-----------|
| **Jarvis** | `main` | Telegram (main) | Personal assistant, main interactions | General heartbeats |
| **Lasso** | `coach` | Telegram (coach) | Tony Robbins RPM coaching | Daily/weekly RPM check-ins |
| **Roy_bot** | `818boyz` | Discord | 818 Boyz community engagement | Proactive Discord posts |

### Infrastructure
- **Gateway:** lxc-docker (100.103.168.72:18789)
- **Node:** Mac Mini (100.74.180.15)
- **Vaults:** ClawdVault (read/write), StanfordVault (read-only), TRCoachVault (read/write)
- **Skills:** Obsidian CLI, TickTick, Readwise, GOG (Google Workspace), Canvas LMS

### Key Workflows
1. **Jarvis** handles task creation and delegates to sub-agents
2. **Lasso** checks in on RPM goals (daily notes, project planning)
3. **Roy_bot** posts proactive updates to Discord (events, community engagement)
4. All agents share core skills but have different workspace files (SOUL.md, MEMORY.md)

---

## Feature Comparison: Current vs. Needed

### Current Features (v1.0.1)
✅ Task creation and Kanban board  
✅ AI-guided planning (Q&A flow)  
✅ Sub-agent spawning and tracking  
✅ Real-time SSE updates  
✅ Deliverables management  
✅ Activity logging  
✅ OpenClaw session management  
✅ Workspace switching  

### Missing Features (from kitze's admin dashboard)
❌ **Agent file editing** (SOUL.md, USER.md, AGENTS.md, MEMORY.md, TOOLS.md)  
❌ **Per-agent skill management** (enable/disable skills)  
❌ **Cron job visualization** (schedule, frequency, grouped by channel)  
❌ **Channel bindings overview** (which agent handles which channel)  
❌ **Gateway controls** (restart, status, logs)  
❌ **Config viewer** (read-only openclaw.json)  
❌ **Global skills browser** (all available skills with metadata)  

### New Features for Shawn's Use Case
🆕 **Multi-agent dashboard** - Toggle between Jarvis, Lasso, Roy_bot  
🆕 **Agent health monitoring** - Last active, message count, error rate  
🆕 **Cross-agent task delegation** - Assign tasks between agents  
🆕 **Memory viewer** - Browse MEMORY.md across all agents  
🆕 **Cron job creation** - Add new scheduled tasks via UI  
🆕 **Skill dependency viewer** - See which agents use which skills  

---

## Prioritized Extension Plan

### Phase 1: Agent Admin Dashboard (High Priority)
**Goal:** Provide admin controls for agent configuration without touching `openclaw.json` directly

#### 1.1 Agent Files Editor (Week 1-2)
**User Story:** As Shawn, I want to edit SOUL.md, USER.md, AGENTS.md, MEMORY.md, and TOOLS.md for each agent without SSHing into the server.

**Implementation:**
- Add **"Agent Settings"** tab to existing workspace switcher
- Create `AgentFilesPage` component with tabbed editor
- Use Monaco Editor (markdown mode) for file editing
- API endpoints:
  ```
  GET  /api/agents/:id/files/:filename
  PUT  /api/agents/:id/files/:filename
  ```
- File list: SOUL.md, USER.md, AGENTS.md, MEMORY.md, TOOLS.md, HEARTBEAT.md
- Auto-save with debounce (3s delay)
- Show file last modified timestamp

**Acceptance Criteria:**
- ✅ Can view and edit all 6 agent workspace files
- ✅ Changes save to correct agent workspace on gateway
- ✅ Monaco editor has markdown syntax highlighting
- ✅ Read-only mode when agent is actively working

#### 1.2 Per-Agent Skills Management (Week 2-3)
**User Story:** As Shawn, I want to enable/disable skills for each agent (e.g., Lasso doesn't need Twitter, Roy_bot doesn't need Obsidian).

**Implementation:**
- Add **"Skills"** tab to Agent Settings
- Fetch all available skills from:
  - `~/.openclaw/skills/` (shared)
  - `<agent-workspace>/skills/` (agent-specific)
  - Bundled OpenClaw skills
- Group skills by category (from `SKILL.md` frontmatter `group` field)
- Toggle switches to enable/disable per agent
- **Enable logic:** Copy skill folder from source to `<workspace>/skills/<skill-name>/`
- **Disable logic:** Remove skill folder from agent workspace
- API endpoints:
  ```
  GET  /api/skills/all
  POST /api/agents/:id/skills/:skillName/enable
  POST /api/agents/:id/skills/:skillName/disable
  GET  /api/agents/:id/skills
  ```

**Acceptance Criteria:**
- ✅ Shows all available skills with descriptions
- ✅ Grouped by category (Communication, Productivity, Search, etc.)
- ✅ Can enable/disable skills per agent
- ✅ Bulk enable/disable all skills
- ✅ Shows which skills are currently active for each agent

#### 1.3 Gateway Status & Controls (Week 3)
**User Story:** As Shawn, I want to see gateway status and restart it when needed.

**Implementation:**
- Add **Gateway Header** component (fixed top bar)
- Display connection status (pulsing green dot when connected)
- Show gateway port, mode, agent count
- Add **"Restart Gateway"** button (calls `openclaw gateway restart` via API)
- API endpoints:
  ```
  GET  /api/gateway/status
  POST /api/gateway/restart
  ```

**Acceptance Criteria:**
- ✅ Real-time connection status indicator
- ✅ Restart button with confirmation dialog
- ✅ Shows gateway info (port, mode, protocol version)
- ✅ Displays count of active agents

---

### Phase 2: Cron Job Management (Medium Priority)
**Goal:** Visualize and manage cron jobs (RPM check-ins, proactive Discord posts)

#### 2.1 Cron Jobs Viewer (Week 4)
**User Story:** As Shawn, I want to see all scheduled cron jobs, grouped by agent/channel, with visual frequency indicators.

**Implementation:**
- Add **"Scheduled Jobs"** page (new tab in main nav)
- Read from `~/.openclaw/cron/jobs.json`
- Group jobs by destination: Agent → Channel → Thread
- Color-coded frequency badges:
  - 🟢 Daily/weekly
  - 🟡 Hourly
  - 🔴 Every few minutes
- Show job details: name, description, schedule (cron expr), last run, next run, status
- API endpoint:
  ```
  GET /api/cron
  ```

**Acceptance Criteria:**
- ✅ Lists all cron jobs from jobs.json
- ✅ Grouped by agent and channel
- ✅ Visual frequency indicators (color-coded badges)
- ✅ Shows last run time and status

#### 2.2 Cron Job Actions (Week 4-5)
**User Story:** As Shawn, I want to enable/disable/run/delete cron jobs without editing JSON manually.

**Implementation:**
- Add action buttons per job:
  - ▶️ **Run Now** - Force execute job immediately
  - 🔄 **Enable/Disable** - Toggle job active state
  - 🗑️ **Delete** - Remove job from jobs.json
- API endpoints:
  ```
  PUT    /api/cron/:id          # Update job (enable/disable)
  DELETE /api/cron/:id          # Delete job
  POST   /api/cron/:id/run      # Force run job
  ```

**Acceptance Criteria:**
- ✅ Can enable/disable jobs via toggle switch
- ✅ "Run Now" button triggers immediate execution
- ✅ Delete button removes job (with confirmation)
- ✅ Real-time updates when job runs

#### 2.3 Cron Job Creation (Week 5-6)
**User Story:** As Shawn, I want to create new cron jobs (e.g., "Check Discord every 2 hours") via UI instead of manually editing jobs.json.

**Implementation:**
- Add **"+ New Cron Job"** button
- Modal form with fields:
  - Name & description
  - Target agent (dropdown)
  - Channel (Telegram/Discord)
  - Schedule picker (cron expression builder)
  - Message/command to send
- Validate cron expression before saving
- API endpoint:
  ```
  POST /api/cron  # Create new job
  ```

**Acceptance Criteria:**
- ✅ Form validates all required fields
- ✅ Cron expression builder with common presets (daily, hourly, custom)
- ✅ Saves to jobs.json
- ✅ New job appears in list immediately

---

### Phase 3: Multi-Agent Orchestration (Medium Priority)
**Goal:** Better support for cross-agent task delegation and collaboration

#### 3.1 Agent Dashboard View (Week 6)
**User Story:** As Shawn, I want a dedicated view for each agent showing their tasks, sessions, and activity.

**Implementation:**
- Add **"Agents"** tab to main navigation
- Agent cards showing:
  - Status (online/offline/working)
  - Active tasks count
  - Recent activity (last 5 actions)
  - Active sessions
- Click agent to see full dashboard:
  - All tasks assigned to agent
  - Session history
  - Activity timeline
  - Memory preview (first 500 chars of MEMORY.md)

**Acceptance Criteria:**
- ✅ Overview shows all 3 agents (Jarvis, Lasso, Roy_bot)
- ✅ Status indicators reflect real activity
- ✅ Clicking agent opens dedicated dashboard
- ✅ Shows task assignments per agent

#### 3.2 Cross-Agent Task Assignment (Week 7)
**User Story:** As Shawn (via Jarvis), I want to create a task and assign it to Lasso or Roy_bot directly.

**Implementation:**
- Update task creation modal:
  - Add "Assign to Agent" dropdown
  - Show agent availability/status
- Support task reassignment (drag-and-drop between agent columns)
- Log activity when task is reassigned
- Send notification to target agent via OpenClaw

**Acceptance Criteria:**
- ✅ Can assign task to any agent during creation
- ✅ Can reassign tasks between agents
- ✅ Target agent receives notification
- ✅ Activity log shows assignment changes

#### 3.3 Agent Health Monitoring (Week 7-8)
**User Story:** As Shawn, I want to see if an agent is healthy (last active, error rate, token usage).

**Implementation:**
- Add **"Agent Health"** section to agent dashboard
- Metrics to track:
  - Last active timestamp
  - Message count (24h)
  - Error rate (failed tasks / total tasks)
  - Average response time
  - Token usage (if available from OpenClaw)
- Visual indicators:
  - 🟢 Healthy (active in last 10 min)
  - 🟡 Idle (active in last hour)
  - 🔴 Offline (no activity in 1+ hours)

**Acceptance Criteria:**
- ✅ Shows real-time health status
- ✅ Displays last active timestamp
- ✅ Tracks message/task counts
- ✅ Visual health indicator (green/yellow/red)

---

### Phase 4: Channel & Config Visualization (Low Priority)
**Goal:** Provide visibility into channel bindings and OpenClaw configuration

#### 4.1 Channels Overview (Week 8)
**User Story:** As Shawn, I want to see which agents are bound to which channels (Telegram, Discord) and who handles what.

**Implementation:**
- Add **"Channels"** page
- Read from `openclaw.json`:
  - `channels.telegram` (accounts, groups)
  - `channels.discord` (guilds, channels)
  - `bindings` (agent-to-channel mappings)
- Display as grouped list:
  - **Telegram:** main (Jarvis), coach (Lasso)
  - **Discord:** 818boyz (Roy_bot)
- Show channel IDs, thread IDs, and agent bindings

**Acceptance Criteria:**
- ✅ Lists all configured channels
- ✅ Shows which agent handles each channel
- ✅ Displays channel IDs and thread IDs
- ✅ Updates when openclaw.json changes

#### 4.2 Config Viewer (Week 9)
**User Story:** As Shawn, I want to view the full openclaw.json config in a readable format (without editing it).

**Implementation:**
- Add **"Config"** tab
- Read-only Monaco Editor with JSON syntax highlighting
- Display full `openclaw.json` content
- Refresh button to reload config
- API endpoint:
  ```
  GET /api/config
  ```

**Acceptance Criteria:**
- ✅ Shows full openclaw.json content
- ✅ Syntax-highlighted JSON
- ✅ Read-only mode (no editing)
- ✅ Refresh button reloads config

---

### Phase 5: Advanced Features (Future)
**Goal:** Power-user features for deep observability and control

#### 5.1 Memory Viewer (Future)
- Browse MEMORY.md across all agents
- Search/filter memory entries
- Diff view (compare memory between agents)
- Export memory as markdown

#### 5.2 Session Inspector (Future)
- Real-time session history viewer
- Message replay (step through conversation)
- Token usage per session
- Export conversation as JSON

#### 5.3 Skill Dependency Graph (Future)
- Visualize which agents use which skills
- Show skill dependencies (e.g., `obsidian-cli` requires node connection)
- Highlight missing dependencies

#### 5.4 Log Viewer (Future)
- Stream gateway logs in real-time
- Filter by level (info/warn/error)
- Search logs by keyword
- Export logs as text

#### 5.5 WebSocket Debugger (Future)
- Live WebSocket message viewer
- Inspect requests/responses to OpenClaw Gateway
- Manual message sending (for testing)

---

## Implementation Guidelines

### Architecture Decisions

#### 1. Server-Side API Layer
**Problem:** Mission Control runs on localhost, but needs to access files on the gateway (lxc-docker).

**Solution:**
- All file operations go through Next.js API routes
- API routes make HTTP/WS calls to OpenClaw Gateway
- Gateway exposes file read/write endpoints (if not already available)

**Alternative:** SSH tunneling from Next.js server to gateway

#### 2. Real-Time Updates
**Current:** SSE (Server-Sent Events) for task/agent updates  
**Extend:** Broadcast events for:
- Agent file changes
- Skill enable/disable
- Cron job runs
- Gateway restarts

**Event types to add:**
```typescript
export type SSEEventType =
  | ... (existing)
  | 'agent_file_updated'
  | 'skill_toggled'
  | 'cron_job_ran'
  | 'gateway_restarted';
```

#### 3. Monaco Editor Integration
**Install:**
```bash
npm install @monaco-editor/react
```

**Usage:**
```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="80vh"
  defaultLanguage="markdown"
  theme="vs-dark"
  value={fileContent}
  onChange={handleChange}
  options={{
    wordWrap: 'on',
    minimap: { enabled: false },
    readOnly: false,
  }}
/>
```

#### 4. Cron Expression Parsing
**Install:**
```bash
npm install cronstrue
```

**Usage:**
```typescript
import cronstrue from 'cronstrue';

const humanReadable = cronstrue.toString('0 9 * * 1-5');
// "At 09:00 AM, Monday through Friday"
```

#### 5. Gateway API Extensions
**New endpoints needed on OpenClaw Gateway:**
```
GET  /agent/:id/file/:filename      # Read agent workspace file
PUT  /agent/:id/file/:filename      # Write agent workspace file
GET  /skills/all                    # List all available skills
POST /agent/:id/skill/:name/enable  # Copy skill to agent workspace
POST /agent/:id/skill/:name/disable # Remove skill from agent workspace
GET  /cron                          # Read cron/jobs.json
PUT  /cron                          # Write cron/jobs.json
POST /gateway/restart               # Restart gateway
```

**If Gateway doesn't support these:**
- Implement via `exec` tool (SSH to gateway)
- Or add to Gateway as new API methods

---

## Security Considerations

### 1. Authentication
**Current:** No authentication (localhost only)  
**Recommendation:** 
- Keep as localhost-only for now
- If exposing to network, add basic auth or API key

### 2. File Access
**Risk:** Unrestricted file read/write via API  
**Mitigation:**
- Restrict file operations to agent workspaces only
- Validate file paths to prevent directory traversal
- Whitelist allowed filenames (SOUL.md, USER.md, etc.)

### 3. Cron Job Execution
**Risk:** Arbitrary command execution via cron job creation  
**Mitigation:**
- Validate cron expressions before saving
- Limit allowed payload types (agentTurn only)
- Require confirmation for "Run Now" action

### 4. Gateway Restart
**Risk:** Restarting gateway interrupts all active sessions  
**Mitigation:**
- Add confirmation dialog with warning
- Show count of active sessions before restart
- Log who triggered restart (if auth is added later)

---

## Testing Strategy

### Unit Tests
- API route handlers (`/api/agents/:id/files/:filename`)
- OpenClaw client methods (`getAgentFile`, `setAgentFile`)
- Cron expression validation
- File path sanitization

### Integration Tests
- Full workflow: Edit SOUL.md → Save → Verify on gateway
- Skill enable/disable → Verify folder copied/removed
- Cron job creation → Verify in jobs.json
- Gateway restart → Verify reconnection

### Manual Testing Checklist
- [ ] Can edit all 6 agent files (SOUL.md, USER.md, etc.)
- [ ] Changes persist after refresh
- [ ] Skill toggles work for all 3 agents
- [ ] Cron jobs display correctly grouped
- [ ] "Run Now" executes job immediately
- [ ] Gateway restart reconnects successfully

---

## Migration Path

### Step 1: Add New Pages (Non-Breaking)
- Create new routes: `/agents`, `/cron`, `/channels`, `/config`
- Keep existing Kanban board at `/`
- Add navigation tabs

### Step 2: Extend Database Schema
```sql
-- Add agent configuration table (optional)
CREATE TABLE IF NOT EXISTS agent_configs (
  agent_id TEXT PRIMARY KEY,
  last_file_edit TEXT,
  skill_count INTEGER,
  last_health_check TEXT
);
```

### Step 3: Implement API Routes
- Start with read-only endpoints (GET)
- Add write endpoints (PUT/POST/DELETE)
- Test with Jarvis agent first

### Step 4: Build UI Components
- Agent Files Editor (Monaco)
- Skills Manager (toggle switches)
- Cron Jobs Table (grouped view)

### Step 5: Real-Time Integration
- Extend SSE event types
- Broadcast agent file updates
- Broadcast skill/cron changes

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "cronstrue": "^2.50.0"
  }
}
```

**Optional:**
- `react-syntax-highlighter` (for code previews in deliverables)
- `react-diff-viewer` (for memory diff view in Phase 5)

---

## Timeline Estimate

| Phase | Features | Estimated Effort | Priority |
|-------|----------|------------------|----------|
| Phase 1 | Agent Admin Dashboard | 3-4 weeks | **High** |
| Phase 2 | Cron Job Management | 2-3 weeks | **Medium** |
| Phase 3 | Multi-Agent Orchestration | 2-3 weeks | **Medium** |
| Phase 4 | Channel & Config Visualization | 1-2 weeks | **Low** |
| Phase 5 | Advanced Features | 4-6 weeks | **Future** |

**Total for Phases 1-4:** ~8-12 weeks  
**Recommended MVP (Phases 1-2):** ~5-7 weeks

---

## Success Metrics

### Phase 1 Success
- ✅ All 3 agents have editable workspace files
- ✅ Skills can be enabled/disabled per agent
- ✅ Gateway restart works from UI

### Phase 2 Success
- ✅ All cron jobs visible and manageable
- ✅ Can create new cron jobs via UI
- ✅ Jobs execute on schedule

### Phase 3 Success
- ✅ Tasks can be assigned cross-agent
- ✅ Agent health status accurate
- ✅ Agent dashboard shows all relevant data

### Phase 4 Success
- ✅ Channel bindings clear and accurate
- ✅ Config viewer loads full openclaw.json

---

## Risks & Mitigations

### Risk 1: OpenClaw Gateway API Limitations
**Risk:** Gateway may not support file read/write or cron management  
**Mitigation:**
- Implement via SSH + `exec` tool as fallback
- Contribute Gateway API extensions to OpenClaw project

### Risk 2: File Conflicts
**Risk:** User edits SOUL.md in UI while agent also writes to it  
**Mitigation:**
- Add file locking mechanism
- Show warning when agent is actively working
- Add "Last modified by" timestamp

### Risk 3: Real-Time Sync Issues
**Risk:** SSE connection drops, UI out of sync  
**Mitigation:**
- Auto-reconnect SSE on disconnect
- Add "Refresh" button for manual sync
- Show connection status indicator

### Risk 4: Cron Job Misconfiguration
**Risk:** Invalid cron expression or message breaks scheduler  
**Mitigation:**
- Validate cron expression before saving
- Test cron expression with dry-run
- Show warning for expressions that run too frequently

---

## Open Questions

1. **Gateway API Support:** Does OpenClaw Gateway expose file read/write endpoints? If not, should we extend it or use SSH?
2. **Skill Sources:** Where are skills stored? `~/.openclaw/skills/` or agent-specific workspaces?
3. **Cron Job Format:** Is `jobs.json` format stable? Any plan to change it?
4. **Authentication:** Will Mission Control ever be exposed outside localhost?
5. **Multi-User:** Do multiple users need to share the same Mission Control instance?

---

## Next Steps

### Immediate Actions
1. **Review this plan** with Shawn
2. **Prioritize features** (confirm Phase 1 scope)
3. **Confirm Gateway API** capabilities (file read/write, cron access)
4. **Set up dev environment** (clone repo, test locally)
5. **Create GitHub issues** for Phase 1 features

### Development Workflow
1. Create feature branch: `git checkout -b feature/agent-files-editor`
2. Implement API route: `/api/agents/:id/files/:filename`
3. Build UI component: `AgentFilesPage.tsx`
4. Test with Jarvis agent
5. Submit PR to `ryuclawdbot-collab/mission-control`

---

## Conclusion

This extension plan transforms Mission Control from a **task-centric dashboard** into a **comprehensive agent admin platform**. By adding agent configuration, skill management, and cron job controls, Shawn will have full visibility and control over his 3-agent ecosystem (Jarvis, Lasso, Roy_bot) without manually editing JSON files or SSHing into the gateway.

**Recommended MVP:** Focus on **Phase 1 (Agent Admin Dashboard)** and **Phase 2 (Cron Job Management)** first. These provide the highest immediate value and align with kitze's admin dashboard vision.

**Timeline:** 5-7 weeks for MVP (Phases 1-2)

**Key Benefit:** One unified dashboard to manage all agents, tasks, skills, and schedules — eliminating the need to juggle multiple terminals, config files, and SSH sessions.

---

**End of Extension Plan**
