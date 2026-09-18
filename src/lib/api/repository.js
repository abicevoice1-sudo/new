// ─── Repository: typed CRUD over the storage adapter ─────────────────────────
// Single place where entity shapes live. No artificial latency, no randomness.
// Every method is async so swapping to HTTP later changes zero call sites.
import { read, write } from './storage';
import { SEED_PROFILES } from './mockData';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function allProfiles() {
  const cached = read('profiles', null);
  if (cached) return cached;
  write('profiles', SEED_PROFILES);
  return SEED_PROFILES;
}

export const profilesRepo = {
  async all() {
    return allProfiles();
  },
  async getById(id) {
    return allProfiles().find((p) => p.id === id) ?? null;
  },
  async search(filters = {}) {
    let list = allProfiles();
    if (filters.minAge) list = list.filter((p) => p.age >= +filters.minAge);
    if (filters.maxAge) list = list.filter((p) => p.age <= +filters.maxAge);
    if (filters.verifiedOnly) list = list.filter((p) => p.is_verified);
    if (filters.gender) list = list.filter((p) => p.gender === filters.gender);
    if (filters.sect && filters.sect !== 'Any sect') list = list.filter((p) => p.sect === filters.sect);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) =>
        [p.displayName, p.profession, p.city, p.country].join(' ').toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  },
  async save(profile) {
    const list = allProfiles();
    const idx = list.findIndex((p) => p.id === profile.id);
    const next = [...list];
    if (idx >= 0) next[idx] = { ...next[idx], ...profile };
    else next.push({ ...profile, id: profile.id ?? uid() });
    write('profiles', next);
    return next[idx >= 0 ? idx : next.length - 1];
  },
};

export const messagesRepo = {
  async conversations() {
    return read('conv', [
      {
        id: 'c1',
        participantId: 'p1',
        participantName: 'Zainab H.',
        lastMessage: 'Assalamu Alaikum!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        unread: true,
      },
    ]);
  },
  async thread(cid) {
    const all = read('msg', {});
    return (
      all[cid] ?? [
        {
          id: 'm1',
          senderId: 'them',
          text: 'Assalamu Alaikum! Thank you for reaching out.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
    );
  },
  async send(cid, text) {
    const all = read('msg', {});
    const msg = { id: uid(), senderId: 'me', text, timestamp: new Date().toISOString() };
    write('msg', { ...all, [cid]: [...(all[cid] ?? []), msg] });
    return msg;
  },
};

export const matchesRepo = {
  async suggestions(limit = 6) {
    const list = await profilesRepo.all();
    return [...list].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, limit);
  },
  // Deterministic: idempotent, no Math.random() — mutual match resolved server-side later.
  async expressInterest(profileId) {
    const existing = read('int', []);
    if (!existing.some((i) => i.profileId === profileId)) {
      write('int', [...existing, { profileId, timestamp: new Date().toISOString() }]);
    }
    return { success: true, matched: false };
  },
};

export const ticketsRepo = {
  async all() {
    return read('tickets', []);
  },
  async create(ticket) {
    const list = read('tickets', []);
    const created = {
      ...ticket,
      id: `t${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    write('tickets', [...list, created]);
    return created;
  },
};
