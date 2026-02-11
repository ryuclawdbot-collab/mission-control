'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Save, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { AGENT_WORKSPACES, EDITABLE_FILES, type AgentWorkspace } from '@/lib/agent-workspaces';

interface FileInfo {
  filename: string;
  exists: boolean;
  mtime: string | null;
  size: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AgentFilesEditor() {
  const [selectedAgent, setSelectedAgent] = useState<AgentWorkspace>(AGENT_WORKSPACES[0]);
  const [selectedFile, setSelectedFile] = useState<string>(EDITABLE_FILES[0]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load file list for agent
  const loadFiles = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/files`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    }
  }, []);

  // Load file content
  const loadFile = useCallback(async (agentId: string, filename: string) => {
    setLoading(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/agents/${agentId}/files/${encodeURIComponent(filename)}`);
      const data = await res.json();
      const c = data.content || '';
      setContent(c);
      setOriginalContent(c);
    } catch {
      setContent('');
      setOriginalContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(selectedAgent.id);
  }, [selectedAgent, loadFiles]);

  useEffect(() => {
    loadFile(selectedAgent.id, selectedFile);
  }, [selectedAgent, selectedFile, loadFile]);

  const isDirty = content !== originalContent;

  const saveFile = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch(
        `/api/agents/${selectedAgent.id}/files/${encodeURIComponent(selectedFile)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      if (res.ok) {
        setSaveStatus('saved');
        setOriginalContent(content);
        loadFiles(selectedAgent.id);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  }, [selectedAgent, selectedFile, content, loadFiles]);

  // Auto-save with debounce
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newContent = value || '';
      setContent(newContent);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      if (newContent !== originalContent) {
        saveTimerRef.current = setTimeout(() => {
          // Trigger save
          setSaveStatus('saving');
          fetch(
            `/api/agents/${selectedAgent.id}/files/${encodeURIComponent(selectedFile)}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: newContent }),
            }
          )
            .then(res => {
              if (res.ok) {
                setSaveStatus('saved');
                setOriginalContent(newContent);
                setTimeout(() => setSaveStatus('idle'), 2000);
              } else {
                setSaveStatus('error');
              }
            })
            .catch(() => setSaveStatus('error'));
        }, 3000);
      }
    },
    [selectedAgent, selectedFile, originalContent]
  );

  return (
    <div className="flex h-full">
      {/* Sidebar: Agent & File selector */}
      <div className="w-64 border-r border-mc-border bg-mc-bg-secondary flex flex-col">
        {/* Agent tabs */}
        <div className="p-3 border-b border-mc-border">
          <h3 className="text-xs font-semibold text-mc-text-secondary uppercase mb-2">Agent</h3>
          <div className="space-y-1">
            {AGENT_WORKSPACES.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  selectedAgent.id === agent.id
                    ? 'bg-mc-accent-cyan/20 text-mc-accent-cyan'
                    : 'hover:bg-mc-bg-tertiary text-mc-text-secondary'
                }`}
              >
                <span>{agent.emoji}</span>
                <span>{agent.name}</span>
                <span className="text-xs text-mc-text-secondary/50">({agent.id})</span>
              </button>
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="p-3 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-mc-text-secondary uppercase mb-2">Files</h3>
          <div className="space-y-1">
            {EDITABLE_FILES.map(filename => {
              const fileInfo = files.find(f => f.filename === filename);
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                    selectedFile === filename
                      ? 'bg-mc-accent-purple/20 text-mc-accent-purple'
                      : 'hover:bg-mc-bg-tertiary text-mc-text-secondary'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{filename}</span>
                  {fileInfo && !fileInfo.exists && (
                    <span className="text-xs text-mc-text-secondary/40 ml-auto">new</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        {/* Editor toolbar */}
        <div className="h-10 bg-mc-bg-secondary border-b border-mc-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm">
            <span>{selectedAgent.emoji}</span>
            <span className="text-mc-text-secondary">{selectedAgent.name}</span>
            <span className="text-mc-text-secondary/30">/</span>
            <span className="text-mc-text">{selectedFile}</span>
            {isDirty && <span className="text-mc-accent-yellow text-xs">● unsaved</span>}
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-mc-text-secondary" />}
            {saveStatus === 'saved' && <Check className="w-4 h-4 text-mc-accent-green" />}
            {saveStatus === 'error' && <AlertCircle className="w-4 h-4 text-mc-accent-red" />}
            <button
              onClick={saveFile}
              disabled={!isDirty || saveStatus === 'saving'}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-mc-accent-cyan/20 text-mc-accent-cyan rounded hover:bg-mc-accent-cyan/30 disabled:opacity-30 transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-mc-text-secondary" />
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="markdown"
              theme="vs-dark"
              value={content}
              onChange={handleEditorChange}
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                scrollBeyondLastLine: false,
                padding: { top: 8 },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
