import { Router } from 'express';
import { db } from '../db/store';
import { User, Session } from '../types';

export const authRouter = Router();

// Middleware to get current user from Bearer token or cookie
export function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/, '') : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const session = db.sessions.get(token);
  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const user = db.users.get(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  req.session = session;
  next();
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { email, name, password, onboardingPurpose } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, name, and password are required' });
  }

  // Check if exists
  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: `hash_${password}`, // Simulated secure hash
    role: 'USER',
    onboardingPurpose: onboardingPurpose || 'General',
    themePreference: 'dark',
    modelPreference: 'NEXA Auto',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.set(newUser.id, newUser);

  const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const session: Session = {
    id: `sess-${Date.now()}`,
    userId: newUser.id,
    token,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.sessions.set(token, session);

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ user: safeUser, token });
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const session: Session = {
    id: `sess-${Date.now()}`,
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.sessions.set(token, session);

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/, '');
  if (token) {
    db.sessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: any, res) => {
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  // In production this sends an email. Return simulated recovery payload
  return res.json({
    success: true,
    message: `Password reset instructions sent to ${email}`,
    resetToken: 'rst-simulated-token-99x',
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  return res.json({
    success: true,
    message: 'Password successfully reset. You can now log in.',
  });
});

// PATCH /api/auth/profile
authRouter.patch('/profile', authenticate, (req: any, res) => {
  const { name, themePreference, modelPreference, onboardingPurpose } = req.body;
  const user = req.user as User;

  if (name) user.name = name.trim();
  if (themePreference) user.themePreference = themePreference;
  if (modelPreference) user.modelPreference = modelPreference;
  if (onboardingPurpose) user.onboardingPurpose = onboardingPurpose;
  user.updatedAt = new Date().toISOString();

  db.users.set(user.id, user);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// DELETE /api/auth/account
authRouter.delete('/account', authenticate, (req: any, res) => {
  const user = req.user as User;
  db.users.delete(user.id);
  // Cleanup sessions
  for (const [key, sess] of db.sessions.entries()) {
    if (sess.userId === user.id) db.sessions.delete(key);
  }
  return res.json({ success: true, message: 'Account and associated records deleted' });
});
