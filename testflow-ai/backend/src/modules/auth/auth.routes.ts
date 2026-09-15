import { Router } from 'express';
import { clearFailedLogins, isLockedOut, recordFailedLogin } from '../../lib/bruteForce.js';
import { setSessionCookie } from '../../lib/cookies.js';
import { HttpError } from '../../lib/httpError.js';
import { createSession, destroySession, SESSION_COOKIE_NAME } from '../../lib/session.js';
import { readCookie, requireAuth } from '../../middleware/auth.js';
import { logIn, signUp } from './auth.service.js';

export const authRouter = Router();

const ALLOWED_SIGNUP_ROLES = new Set(['admin', 'qa_manager']);

/** POST /auth/signup — FR-AUTH-001/004/005/006, FR-ORG-001. Exact fields: name, email, password, role, organisationName. */
authRouter.post('/auth/signup', async (req, res, next) => {
  try {
    const { email, password, name, role, organisationName } = req.body ?? {};
    const fields: Record<string, string> = {};
    if (!email || typeof email !== 'string') fields.email = 'Email is required.';
    if (!password || typeof password !== 'string' || password.length < 8) {
      fields.password = 'Password must be at least 8 characters.';
    }
    if (!name || typeof name !== 'string') fields.name = 'Name is required.';
    if (!organisationName || typeof organisationName !== 'string') {
      fields.organisationName = 'Organisation name is required.';
    }
    // FR-AUTH-005: role selectable at sign-up is restricted to exactly Admin or QA Manager —
    // never accept an arbitrary role string (e.g., 'qa_tester' or 'admin; DROP ...').
    if (!role || typeof role !== 'string' || !ALLOWED_SIGNUP_ROLES.has(role)) {
      fields.role = 'Role must be admin or qa_manager.';
    }
    if (Object.keys(fields).length > 0) {
      throw HttpError.validation('Invalid sign-up request.', fields);
    }

    const user = await signUp({
      email,
      password,
      name,
      role: role as 'admin' | 'qa_manager',
      organisationName,
    });
    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

/** POST /auth/login — FR-AUTH-002. NFR-SEC-001: locks out after 5 failed attempts / 15 min. */
authRouter.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      throw HttpError.validation('Email and password are required.');
    }

    if (await isLockedOut(email)) {
      throw HttpError.tooManyRequests('Too many failed attempts. Please try again later.');
    }

    try {
      const user = await logIn({ email, password });
      await clearFailedLogins(email);
      const session = await createSession(user.id);
      setSessionCookie(res, session.token, session.expiresAt);
      res.status(200).json({ user });
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        await recordFailedLogin(email);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/** POST /auth/logout — FR-AUTH-003. Session invalidated server-side (NFR-SEC-002), not just the cookie cleared. */
authRouter.post('/auth/logout', requireAuth, async (req, res, next) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME);
    if (token) {
      await destroySession(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
