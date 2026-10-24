import { Router } from 'express';
import { authenticate } from './auth';
import { db } from '../db/store';
import { Project } from '../types';

export const projectsRouter = Router();

// GET /api/projects
projectsRouter.get('/projects', authenticate, (req: any, res) => {
  const userId = req.user.id;
  const list = Array.from(db.projects.values()).filter((p) => p.ownerId === userId);

  // Attach counts of chats, files, datasets
  const enriched = list.map((p) => {
    const chatCount = Array.from(db.conversations.values()).filter((c) => c.projectId === p.id).length;
    const fileCount = Array.from(db.files.values()).filter((f) => f.projectId === p.id).length;
    const researchCount = Array.from(db.researchSessions.values()).filter((r) => r.projectId === p.id).length;
    return {
      ...p,
      chatCount,
      fileCount,
      researchCount,
    };
  });

  return res.json({ projects: enriched });
});

// POST /api/projects
projectsRouter.post('/projects', authenticate, (req: any, res) => {
  const { name, description, color } = req.body;
  const userId = req.user.id;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project: Project = {
    id: `proj-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: userId,
    status: 'active',
    color: color || '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.set(project.id, project);
  return res.status(201).json({ project });
});

// GET /api/projects/:id
projectsRouter.get('/projects/:id', authenticate, (req: any, res) => {
  const project = db.projects.get(req.params.id);
  if (!project || project.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const conversations = Array.from(db.conversations.values()).filter((c) => c.projectId === project.id);
  const files = Array.from(db.files.values()).filter((f) => f.projectId === project.id);
  const research = Array.from(db.researchSessions.values()).filter((r) => r.projectId === project.id);

  return res.json({ project, conversations, files, research });
});

// PATCH /api/projects/:id
projectsRouter.patch('/projects/:id', authenticate, (req: any, res) => {
  const project = db.projects.get(req.params.id);
  if (!project || project.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { name, description, status, color } = req.body;
  if (name !== undefined) project.name = name.trim();
  if (description !== undefined) project.description = description?.trim();
  if (status !== undefined) project.status = status;
  if (color !== undefined) project.color = color;
  project.updatedAt = new Date().toISOString();

  db.projects.set(project.id, project);
  return res.json({ project });
});

// DELETE /api/projects/:id
projectsRouter.delete('/projects/:id', authenticate, (req: any, res) => {
  const project = db.projects.get(req.params.id);
  if (!project || project.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.projects.delete(project.id);
  // Unlink associated chats and files
  for (const conv of db.conversations.values()) {
    if (conv.projectId === project.id) conv.projectId = null;
  }
  for (const file of db.files.values()) {
    if (file.projectId === project.id) file.projectId = null;
  }

  return res.json({ success: true, message: 'Project removed successfully' });
});
