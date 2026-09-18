// In-memory mock data store with localStorage persistence
const STORAGE_KEY = 'shiarishta_data';

const defaultProfiles = [
  {
    id: 'p1',
    displayName: 'Aaliyah R.',
    age: 27,
    city: 'Chicago',
    country: 'USA',
    profession: 'Product Designer',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Halal lifestyle',
    intentions: 'Ready for nikah within 6-12 months',
    photoAccess: 'match',
    matchScore: 96,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Practicing, family-oriented, and intentional about building a peaceful home with faith, kindness, and clear communication.',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Bachelor's degree",
    languages: ['English', 'Urdu'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p2',
    displayName: 'Yusuf K.',
    age: 31,
    city: 'Dallas',
    country: 'USA',
    profession: 'Software Engineer',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Community-centered',
    intentions: 'Serious nikah timeline',
    photoAccess: 'public',
    matchScore: 91,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Values deen, emotional maturity, and a steady family life. Enjoys community work, hiking, and thoughtful conversations.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'Arab',
    educationLevel: "Master's degree",
    languages: ['English', 'Arabic'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p3',
    displayName: 'Maryam S.',
    age: 25,
    city: 'Toronto',
    country: 'Canada',
    profession: 'Teacher',
    religiosity: 'Moderately practicing',
    prayer: 'Consistent prayers',
    halalLifestyle: 'Modest, family-focused',
    intentions: 'Open to a thoughtful timeline',
    photoAccess: 'interest',
    matchScore: 89,
    is_verified: false,
    verificationLevel: 'basic',
    about: 'Warm, grounded, and close with family. Looking for someone sincere, responsible, and ready for a serious halal process.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Bachelor's degree",
    languages: ['English', 'French', 'Urdu'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p4',
    displayName: 'Hassan M.',
    age: 29,
    city: 'New Jersey',
    country: 'USA',
    profession: 'Physician Assistant',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Family-oriented',
    intentions: 'Marriage in the near term',
    photoAccess: 'match',
    matchScore: 87,
    is_verified: true,
    verificationLevel: 'identity',
    about: 'Calm, family-first, and committed to respectful introductions. Enjoys fitness, volunteering, and long-form reading.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'Arab',
    educationLevel: "Master's degree",
    languages: ['English', 'Arabic'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p5',
    displayName: 'Zainab H.',
    age: 24,
    city: 'London',
    country: 'UK',
    profession: 'Marketing Associate',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Modest lifestyle',
    intentions: 'Open to relocation discussions',
    photoAccess: 'public',
    matchScore: 84,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Soft-spoken, thoughtful, and values steady commitment. Wants a home rooted in peace, accountability, and faith.',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Bachelor's degree",
    languages: ['English', 'Urdu'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p6',
    displayName: 'Abbas S.',
    age: 33,
    city: 'Houston',
    country: 'USA',
    profession: 'Civil Engineer',
    religiosity: 'Very practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Structured family life',
    intentions: 'Ready for immediate introductions',
    photoAccess: 'interest',
    matchScore: 82,
    is_verified: true,
    verificationLevel: 'family',
    about: 'Practical, stable, and serious about marriage. Keeps a disciplined routine and is close with extended family.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Bachelor's degree",
    languages: ['English', 'Urdu', 'Punjabi'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p7',
    displayName: 'Fatima N.',
    age: 28,
    city: 'Atlanta',
    country: 'USA',
    profession: 'Content Strategist',
    religiosity: 'Moderately practicing',
    prayer: 'Consistent prayers',
    halalLifestyle: 'Balanced and intentional',
    intentions: '6-12 month timeline',
    photoAccess: 'match',
    matchScore: 88,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Clear communicator who likes calm, purposeful conversations. Wants a respectful, faith-minded introduction process.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'African',
    educationLevel: "Master's degree",
    languages: ['English', 'Arabic'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p8',
    displayName: 'Ali J.',
    age: 30,
    city: 'Seattle',
    country: 'USA',
    profession: 'Data Analyst',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Minimalist and balanced',
    intentions: 'Potential relocation friendly',
    photoAccess: 'interest',
    matchScore: 90,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Quiet, observant, and grounded. Enjoys reading, coffee, and community work with a long-term family focus.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Master's degree",
    languages: ['English', 'Urdu'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p9',
    displayName: 'Sara K.',
    age: 26,
    city: 'Detroit',
    country: 'USA',
    profession: 'Pharmacist',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Healthy and family centered',
    intentions: 'Clear about nikah goals',
    photoAccess: 'public',
    matchScore: 79,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Cares deeply about family, balance, and honest communication. Wants a respectful path from match to marriage.',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'Arab',
    educationLevel: 'Doctorate',
    languages: ['English', 'Arabic'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p10',
    displayName: 'Omer T.',
    age: 34,
    city: 'Vancouver',
    country: 'Canada',
    profession: 'Architect',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Thoughtful and private',
    intentions: 'Ready for serious conversation',
    photoAccess: 'match',
    matchScore: 85,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Creative, practical, and consistent. Looking for someone with a calm personality and a long-term family mindset.',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'Turkish',
    educationLevel: "Master's degree",
    languages: ['English', 'Turkish'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p11',
    displayName: 'Noor A.',
    age: 23,
    city: 'Boston',
    country: 'USA',
    profession: 'Medical Student',
    religiosity: 'Very practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Study-focused and family guided',
    intentions: 'Long-term compatibility',
    photoAccess: 'match',
    matchScore: 83,
    is_verified: true,
    verificationLevel: 'identity',
    about: 'Focused on studies, family, and a meaningful life path. Prefers structured, respectful introductions.',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=70',
    gender: 'female',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Some college",
    languages: ['English', 'Urdu', 'Arabic'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  },
  {
    id: 'p12',
    displayName: 'Zaid R.',
    age: 32,
    city: 'San Diego',
    country: 'USA',
    profession: 'Operations Manager',
    religiosity: 'Practicing',
    prayer: 'Daily prayers',
    halalLifestyle: 'Stable home, simple routine',
    intentions: 'Serious and ready',
    photoAccess: 'match',
    matchScore: 86,
    is_verified: true,
    verificationLevel: 'premium',
    about: 'Organized and dependable with a big appreciation for peace at home. Wants a steady, faith-based marriage journey.',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=70',
    gender: 'male',
    maritalStatus: 'Never married',
    children: 'No children',
    ethnicity: 'South Asian',
    educationLevel: "Bachelor's degree",
    languages: ['English', 'Urdu'],
    sect: 'Ithna Ashari (Twelver)',
    isPrivate: false
  }
];

export { defaultProfiles as SEED_PROFILES };
export { defaultProfiles };

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { profiles: defaultProfiles, messages: [], tickets: [] };
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export function getStore() {
  return loadStore();
}

export function getProfiles() {
  return loadStore().profiles;
}

export function getProfile(id) {
  return loadStore().profiles.find(p => p.id === id);
}

export function saveProfile(profile) {
  const store = loadStore();
  const idx = store.profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) store.profiles[idx] = { ...store.profiles[idx], ...profile };
  else store.profiles.push(profile);
  saveStore(store);
  return store.profiles[idx] || store.profiles[store.profiles.length - 1];
}

export function getMessages() {
  return loadStore().messages;
}

export function addMessage(msg) {
  const store = loadStore();
  store.messages.push({ ...msg, id: 'm' + Date.now(), timestamp: new Date().toISOString() });
  saveStore(store);
}

export function getTickets() {
  return loadStore().tickets;
}

export function addTicket(ticket) {
  const store = loadStore();
  store.tickets.push({ ...ticket, id: 't' + Date.now(), status: 'open', createdAt: new Date().toISOString() });
  saveStore(store);
}

export function resetStore() {
  localStorage.removeItem(STORAGE_KEY);
}