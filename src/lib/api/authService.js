// ─── Auth service — hashed passwords, single session, admin flag ─────────────
// Demo-grade (localStorage) but honest: no plaintext passwords, deterministic,
// and API-identical to a future HTTP adapter. bcryptjs is sync — fine at this scale.
import bcrypt from 'bcryptjs';
import { read, write, remove } from './storage';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';
// Set VITE_ADMIN_EMAILS="a@x.com,b@y.com" to promote accounts to admin.
const ADMIN_EMAILS = String(import.meta.env?.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function toSession(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin === true,
  };
}

export const auth = {
  async register({ email, password, displayName }) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error('Email and password are required');
    const users = read(USERS_KEY, []);
    if (users.some((u) => u.email === cleanEmail)) throw new Error('Email already registered');
    const passwordHash = bcrypt.hashSync(String(password), 10);
    const user = {
      uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      email: cleanEmail,
      displayName: displayName?.trim() || cleanEmail.split('@')[0],
      passwordHash,
      isAdmin: ADMIN_EMAILS.includes(cleanEmail),
      createdAt: new Date().toISOString(),
    };
    write(USERS_KEY, [...users, user]);
    const session = toSession(user);
    write(SESSION_KEY, session);
    return session;
  },

  async login({ email, password }) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const users = read(USERS_KEY, []);
    const user = users.find((u) => u.email === cleanEmail);
    if (!user || !bcrypt.compareSync(String(password ?? ''), user.passwordHash)) {
      throw new Error('Invalid email or password');
    }
    const session = toSession(user);
    write(SESSION_KEY, session);
    return session;
  },

  logout() {
    remove(SESSION_KEY);
  },

  current() {
    return read(SESSION_KEY, null);
  },

  isLoggedIn() {
    return read(SESSION_KEY, null) !== null;
  },
};

export default auth;
