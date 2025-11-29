import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { MiroCanvas } from '@/components/canvas';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Project, DiagramWorkspace } from '@/types';
import { Node, Edge } from 'reactflow';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
} from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export const DiagramStudioPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [_workspace, setWorkspace] = useState<DiagramWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  
  // AI Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Load project and workspace data
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        // Load project
        const projectData = await api.getProject(projectId);
        setProject(projectData);

        // Try to load existing workspace
        try {
          const workspaceData = await api.getDiagramWorkspace(projectId, 'canvas');
          setWorkspace(workspaceData);
          
          // Convert workspace nodes/edges to ReactFlow format
          if (workspaceData.nodes) {
            setInitialNodes(workspaceData.nodes.map((n: any) => ({
              id: n.id,
              type: n.type || 'shape',
              position: n.position || { x: 0, y: 0 },
              data: n.data || { label: 'Node' },
              style: n.style,
            })));
          }
          if (workspaceData.edges) {
            setInitialEdges(workspaceData.edges.map((e: any) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              type: e.type || 'smoothstep',
              label: e.label,
            })));
          }
        } catch {
          // No existing workspace, start fresh
          console.log('No existing workspace, starting fresh');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load diagram studio');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Save handler
  const handleSave = useCallback(async (nodes: Node[], edges: Edge[]) => {
    if (!projectId) return;

    try {
      await api.saveDiagramWorkspace(projectId, 'canvas', {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          label: typeof e.label === 'string' ? e.label : undefined,
        })),
      });
    } catch (err) {
      console.error('Failed to save:', err);
      throw err;
    }
  }, [projectId]);

  // AI Chat handler
  const handleSendChat = async () => {
    if (!chatInput.trim() || !projectId) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.chatDiagramWorkspace(projectId, 'canvas', chatInput);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message || 'I can help you with diagram creation. What would you like to add?',
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading diagram studio...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>
              Back to Project
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-slate-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="font-semibold text-slate-900">Diagram Studio</h1>
            <p className="text-xs text-slate-500">{project?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={chatOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <MiroCanvas
            projectId={projectId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onSave={handleSave}
          />
        </div>

        {/* AI Chat Panel */}
        {chatOpen && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">AI Assistant</h3>
                  <p className="text-xs text-slate-500">Ask me to create diagrams</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>Start a conversation</p>
                  <p className="text-xs mt-1">Ask me to create shapes, connectors, or entire diagrams</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Describe what to create..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <Button
                  size="sm"
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick prompts */}
              <div className="mt-3 flex flex-wrap gap-1">
                {['Add a user flow', 'Create ERD', 'Architecture diagram', 'Add class'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setChatInput(prompt)}
                    className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramStudioPage;
