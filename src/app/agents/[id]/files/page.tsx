'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { FileText, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface FileInfo {
  filename: string;
  exists: boolean;
  size: number;
  modified: string | null;
}

interface AgentFilesData {
  agent_id: string;
  workspace: string;
  files: FileInfo[];
}

const AGENT_NAMES: Record<string, string> = {
  main: 'Jarvis',
  coach: 'Lasso',
  '818boyz': 'Roy_bot',
};

export default function AgentFilesPage() {
  const params = useParams();
  const agentId = params?.id as string;

  const [filesData, setFilesData] = useState<AgentFilesData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const isDirty = fileContent !== originalContent;

  // Load file list
  useEffect(() => {
    loadFiles();
  }, [agentId]);

  // Load first existing file by default
  useEffect(() => {
    if (filesData && !selectedFile) {
      const firstExisting = filesData.files.find((f) => f.exists);
      if (firstExisting) {
        setSelectedFile(firstExisting.filename);
      } else {
        // Default to SOUL.md even if it doesn't exist
        setSelectedFile('SOUL.md');
      }
    }
  }, [filesData, selectedFile]);

  // Load selected file content
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/files`);
      if (!res.ok) throw new Error('Failed to load files');
      const data: AgentFilesData = await res.json();
      setFilesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  async function loadFileContent(filename: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/files/${filename}`);
      const data = await res.json();

      if (res.status === 404) {
        // File doesn't exist yet, start with empty content
        setFileContent('');
        setOriginalContent('');
        setLastSaved(null);
      } else if (!res.ok) {
        throw new Error('Failed to load file');
      } else {
        setFileContent(data.content || '');
        setOriginalContent(data.content || '');
        setLastSaved(data.modified);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selectedFile) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/files/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent }),
      });

      if (!res.ok) throw new Error('Failed to save file');

      const data = await res.json();
      setOriginalContent(fileContent);
      setLastSaved(data.modified);
      
      // Refresh file list to update sizes
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setSaving(false);
    }
  }

  const agentName = AGENT_NAMES[agentId] || agentId;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {agentName} Configuration Files
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filesData?.workspace || 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {new Date(lastSaved).toLocaleString()}
              </span>
            )}
            <button
              onClick={() => loadFiles()}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={saveFile}
              disabled={!isDirty || saving || !selectedFile}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File List Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Configuration Files
            </h2>
            <div className="space-y-1">
              {filesData?.files.map((file) => (
                <button
                  key={file.filename}
                  onClick={() => {
                    if (isDirty) {
                      if (
                        !confirm(
                          'You have unsaved changes. Are you sure you want to switch files?'
                        )
                      ) {
                        return;
                      }
                    }
                    setSelectedFile(file.filename);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 ${
                    selectedFile === file.filename
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{file.filename}</span>
                  </div>
                  {!file.exists && (
                    <span className="text-xs text-gray-400">new</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 bg-gray-900">
          {selectedFile ? (
            <Editor
              height="100%"
              defaultLanguage="markdown"
              language="markdown"
              theme="vs-dark"
              value={fileContent}
              onChange={(value) => setFileContent(value || '')}
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Loading editor...</div>
                </div>
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a file to edit
            </div>
          )}
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="bg-gray-800 text-gray-300 px-6 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Agent: {agentName}</span>
          {selectedFile && <span>File: {selectedFile}</span>}
        </div>
        <div>
          {isDirty && <span className="text-yellow-400">● Unsaved changes</span>}
        </div>
      </footer>
    </div>
  );
}
