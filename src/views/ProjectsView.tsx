import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  Archive,
  MessageSquare,
  FileText,
  Compass,
  Database,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Project, Conversation, FileItem, ResearchSession } from '../types';

interface ProjectsViewProps {
  onOpenConversation: (conv: Conversation) => void;
  onNavigateToWorkspace: (view: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenConversation,
  onNavigateToWorkspace,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetails, setProjectDetails] = useState<{
    conversations: Conversation[];
    files: FileItem[];
    research: ResearchSession[];
  } | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.projects.list();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0 && !selectedProject) {
        selectProject(res.projects[0]);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (p: Project) => {
    setSelectedProject(p);
    try {
      const res = await api.projects.get(p.id);
      setProjectDetails({
        conversations: res.conversations || [],
        files: res.files || [],
        research: res.research || [],
      });
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await api.projects.create({
        name: newProjectName,
        description: newProjectDescription,
      });
      setProjects((prev) => [res.project, ...prev]);
      selectProject(res.project);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (err: any) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.projects.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setProjectDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] overflow-hidden">
      {/* Left Column: Projects List */}
      <div className="w-full md:w-80 border-r border-white/10 bg-[#070709] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">PROJECT WORKSPACES</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{projects.length} active initiatives</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm"
            title="Create Project"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Project Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No projects created yet. Group chats, research, and data into a unified project.
            </div>
          ) : (
            projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => selectProject(proj)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-white/15 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#3b82f6' }}
                      />
                      <span className="text-xs font-semibold text-white truncate">{proj.name}</span>
                    </div>
                    {proj.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{proj.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 font-mono">
                      <span>{proj.chatCount || 0} chats</span>
                      <span>•</span>
                      <span>{proj.fileCount || 0} files</span>
                      <span>•</span>
                      <span>{proj.researchCount || 0} research</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(proj.id);
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors shrink-0"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected Project Detail & Connected Assets */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    style={{ backgroundColor: selectedProject.color || '#3b82f6' }}
                  />
                  <h1 className="text-xl font-bold text-white tracking-tight">{selectedProject.name}</h1>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-emerald-400">
                  {selectedProject.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{selectedProject.description}</p>
            </div>

            {/* Attached Chats */}
            <div className="p-5 rounded-xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  <span>Linked Conversations ({projectDetails?.conversations?.length || 0})</span>
                </div>
                <button
                  onClick={() => onNavigateToWorkspace('chat')}
                  className="text-[11px] text-zinc-400 hover:text-white font-mono"
                >
                  + New linked chat
                </button>
              </div>

              {projectDetails?.conversations?.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No conversations linked to this project yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {projectDetails?.conversations?.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onOpenConversation(conv)}
                      className="p-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 text-left transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium text-white truncate">{conv.title}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{conv.model}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Files */}
            <div className="p-5 rounded-xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>Project Documents & Datasets ({projectDetails?.files?.length || 0})</span>
                </div>
                <button
                  onClick={() => onNavigateToWorkspace('files')}
                  className="text-[11px] text-zinc-400 hover:text-white font-mono"
                >
                  Upload to project
                </button>
              </div>

              {projectDetails?.files?.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No documents attached to this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {projectDetails?.files?.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{f.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{f.mimeType}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Research Sessions */}
            <div className="p-5 rounded-xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Compass className="w-4 h-4 text-zinc-400" />
                  <span>Research Syntheses ({projectDetails?.research?.length || 0})</span>
                </div>
                <button
                  onClick={() => onNavigateToWorkspace('research')}
                  className="text-[11px] text-zinc-400 hover:text-white font-mono"
                >
                  Launch research
                </button>
              </div>

              {projectDetails?.research?.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No research sessions recorded in this project.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectDetails?.research?.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium text-white truncate">{r.topic}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {r.sources?.length || 0} sources gathered
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-xs text-zinc-500">
            Select a project to review connected conversations, datasets, and research.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl glass-panel border border-white/15 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Create New Project Workspace</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Climate & Clean Energy Transition"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief summary of research scope, objectives, or team deliverables..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
