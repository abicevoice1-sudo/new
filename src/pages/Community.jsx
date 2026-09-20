import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../layouts/LandingLayout';
import { useAuth } from '../lib/auth/AuthContext';
import { MessageCircle, Heart, Plus, Lock, Search, X, ChevronRight } from 'lucide-react';

const DEFAULT_SUBREDDITS = [
  { id: 'all', name: 'All', icon: '💰', members: 2400 },
  { id: 'hyderabad', name: 'Hyderabad', icon: '🇮🇳', members: 340 },
  { id: 'dubai', name: 'Dubai', icon: '🇦🇪', members: 280 },
  { id: 'dallas', name: 'Dallas', icon: '🇺🇸', members: 195 },
  { id: 'london', name: 'London', icon: '🇬🇧', members: 420 },
  { id: 'toronto', name: 'Toronto', icon: '🇨🇦', members: 310 },
  { id: 'reverts', name: 'Reverts', icon: '🧘', members: 180 },
  { id: 'parents', name: 'Parents', icon: '👨‍👩‍👧‍👦', members: 220 },
  { id: 'newlywed', name: 'Newlywed', icon: '💍', members: 150 },
];

const INITIAL_POSTS = [
  { id: 1, sub: 'hyderabad', title: 'Best halal restaurants in Hyderabad for a first meeting?', author: 'Anonymous', avatar: 'A', replies: 12, likes: 24, time: '2h ago', tags: ['meeting'], pinned: true },
  { id: 2, sub: 'dallas', title: 'How to balance career and marriage preparation?', author: 'Fatima Z.', avatar: 'F', replies: 18, likes: 31, time: '4h ago', tags: ['career'] },
  { id: 3, sub: 'london', title: 'Tips for writing an authentic bio that reflects values', author: 'Anonymous', avatar: 'A', replies: 23, likes: 45, time: '6h ago', tags: ['profile'] },
  { id: 4, sub: 'reverts', title: 'New reverts support group — weekly virtual meetups', author: 'Support Team', avatar: 'S', replies: 15, likes: 38, time: '8h ago', tags: ['support'], pinned: true },
  { id: 5, sub: 'parents', title: 'How to involve wali without overstepping boundaries?', author: 'Anonymous', avatar: 'A', replies: 29, likes: 52, time: '1d ago', tags: ['wali'] },
  { id: 6, sub: 'toronto', title: 'Understanding different sects — respectful dialogue', author: 'Imam Hassan', avatar: 'I', replies: 34, likes: 67, time: '1d ago', tags: ['faith'] },
  { id: 7, sub: 'newlywed', title: 'Halal investment strategies for married couples', author: 'Anonymous', avatar: 'A', replies: 27, likes: 41, time: '2d ago', tags: ['finance'] },
  { id: 8, sub: 'hyderabad', title: 'Eid gathering for single professionals — interested?', author: 'Community Mod', avatar: 'C', replies: 45, likes: 89, time: '3d ago', tags: ['event'] },
  { id: 9, sub: 'dallas', title: 'Red flags in early conversations — what to watch for', author: 'Anonymous', avatar: 'A', replies: 31, likes: 56, time: '3d ago', tags: ['safety'] },
  { id: 10, sub: 'reverts', title: 'Brothers: what helped you most after reverting?', author: 'Yusuf K.', avatar: 'Y', replies: 42, likes: 73, time: '4d ago', tags: ['reverts'] },
  { id: 11, sub: 'dubai', title: 'Nikah preparation checklist — what documents do I need?', author: 'Anonymous', avatar: 'A', replies: 38, likes: 62, time: '5d ago', tags: ['nikah'] },
  { id: 12, sub: 'dubai', title: 'Professional networking events for Muslims in Dubai?', author: 'Omar D.', avatar: 'O', replies: 21, likes: 44, time: '1w ago', tags: ['networking'] },
];

function LoginGate({ onClose }) {
  return (
    <div className="ai-backdrop" style={{ zIndex: 400 }} onClick={onClose}>
      <div className="ai-drawer" style={{ width: '380px', maxWidth: '95vw', margin: '2rem auto', borderRadius: 'var(--radius-xl)', position: 'relative', top: '20vh' }} onClick={e => e.stopPropagation()}>
        <div className="ai-drawer-header">
          <div className="ai-orb"><Lock className="w-4 h-4" /></div>
          <div><p className="ai-drawer-title">Join the conversation</p></div>
          <button className="ai-icon-btn" onClick={onClose}><span style={{ fontSize: '1.25rem' }}>Ã—</span></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Create a free account or log in to comment, post, and join communities. Reading is open to everyone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/register" className="button primary w-full text-center py-2.5 font-semibold" onClick={onClose}>Create free account</Link>
            <Link to="/auth/login" className="button w-full text-center py-2.5 font-semibold" onClick={onClose} style={{ background: 'var(--color-elevated)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function Community() {
  const { isLoggedIn } = useAuth();
  const [activeSub, setActiveSub] = useState('all');
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [subreddits, setSubreddits] = useState(DEFAULT_SUBREDDITS);
    const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const { slug } = useParams();
  const navigate = useNavigate();

  // Sync activeSub from URL slug on mount and when slug changes
  useEffect(() => {
    if (slug && subreddits.some(s => s.id === slug)) {
      setActiveSub(slug);
    }
  }, [slug, subreddits]);

  // Navigate to a community's URL slug
  const goToSub = (id) => {
    setActiveSub(id);
    navigate(`/community/${id}`);
  };

  const filtered = useMemo(() => {
    let result = activeSub === 'all' ? posts : posts.filter(p => p.sub === activeSub);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeSub, posts, searchQuery]);

    const filteredSubs = useMemo(() => {
    if (!searchQuery.trim()) return subreddits;
    const q = searchQuery.toLowerCase();
    return subreddits.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [subreddits, searchQuery]);

  // Check if search query matches a community slug exactly — enables URL slug navigation
  const searchSlugMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().replace(/^\//, '');
    return subreddits.find(s => s.id === q) || null;
  }, [subreddits, searchQuery]);

  const activeSubData = subreddits.find(s => s.id === activeSub);
  const handleComment = () => { if (!isLoggedIn) setShowLoginGate(true); };
  const handlePost = () => { if (!isLoggedIn) { setShowLoginGate(true); return; } setShowNewPost(true); };
  const submitPost = () => {
    if (!newTitle.trim()) return;
    const post = { id: Date.now(), sub: activeSub === 'all' ? 'general' : activeSub, title: newTitle, author: anonymous ? 'Anonymous' : 'You', avatar: anonymous ? 'A' : 'Y', replies: 0, likes: 0, time: 'Just now', tags: [] };
    setPosts([post, ...posts]);
    setNewTitle(''); setNewBody(''); setShowNewPost(false);
  };
  const handleCreateSub = () => {
    if (!newSubName.trim()) return;
    const id = newSubName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (subreddits.some(s => s.id === id)) return;
    setSubreddits([...subreddits, { id, name: newSubName, icon: '🌍', members: 1 }]);
    setNewSubName(''); setNewSubDesc(''); setShowCreateSub(false);
    setActiveSub(id);
    navigate(`/community/${id}`);
  };

  return (
    <Layout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)', fontWeight: 700, color: 'var(--color-ink)' }}>Community</h1>
            <p style={{ color: 'var(--color-ink-secondary)', marginTop: '0.25rem' }}>Connect, share, and grow — together in faith.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateSub(true)} className="button secondary px-4 py-2.5 font-semibold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create
            </button>
            <button onClick={handlePost} className="button primary px-5 py-2.5 font-semibold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>
        </div>

        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-ink-faint)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search communities or posts... (e.g. /hyderabad, /dubai)"
              className="input input-with-icon input-with-action text-sm"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              aria-label="Search communities and posts"
            />
                        {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-ink-faint)' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Jump to community by exact slug match */}
          {searchSlugMatch && searchSlugMatch.id !== activeSub && (
            <button
              onClick={() => goToSub(searchSlugMatch.id)}
              className="mt-2 text-xs hover:underline flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}
            >
              <ChevronRight className="w-3 h-3" /> Jump to /{searchSlugMatch.name}
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filteredSubs.map(sub => (
            <button key={sub.id} onClick={() => goToSub(sub.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap" style={activeSub === sub.id ? { background: 'var(--color-primary)', color: '#fff' } : { background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-ink-secondary)' }}>
              <span>{sub.icon}</span> /{sub.name.toLowerCase()}
              <span className="text-[10px] opacity-70">{(sub.members || 0).toLocaleString()}</span>
            </button>
          ))}
        </div>

        {activeSub !== 'all' && activeSubData && (
          <div className="p-3 rounded-xl mb-5" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.5rem' }}>{activeSubData.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '1rem' }}>/{activeSubData.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-secondary)' }}>{activeSubData.members || 0} members Â· {filtered.length} discussions</p>
                </div>
              </div>
              <button onClick={handlePost} className="button primary px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Post
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="rounded-xl p-4 transition-all cursor-pointer group" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-subtle)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{post.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.pinned && (<span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: 'var(--color-primary)' }}>Pinned</span>)}
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-subtle)' }}>/{subreddits.find(s => s.id === post.sub)?.name || post.sub}</span>
                    <span className="text-[10px]" style={{ color: 'var(--color-ink-faint)' }}>Â· {post.time}</span>
                  </div>
                  <h3 style={{ fontWeight: 600, color: 'var(--color-ink)', marginBottom: '0.15rem', lineHeight: 1.4 }} className="group-hover:text-primary transition-colors">{post.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>by {post.author}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <button onClick={handleComment} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-ink-secondary)' }}>
                      <MessageCircle className="w-3.5 h-3.5" /> {post.replies}
                    </button>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-ink-secondary)' }}>
                      <Heart className="w-3.5 h-3.5" /> {post.likes}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      {post.tags.map(tag => (<span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--color-ink-secondary)', background: 'var(--color-surface)' }}>#{tag}</span>))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showLoginGate && <LoginGate onClose={() => setShowLoginGate(false)} />}

      {showNewPost && (
        <div className="ai-backdrop" style={{ zIndex: 400 }} onClick={() => setShowNewPost(false)}>
          <div className="ai-drawer" style={{ width: '480px', maxWidth: '95vw', margin: '2rem auto', borderRadius: 'var(--radius-xl)', position: 'relative', top: '10vh' }} onClick={e => e.stopPropagation()}>
            <div className="ai-drawer-header">
              <p className="ai-drawer-title">New post in /{activeSubData?.name || activeSub}</p>
              <button className="ai-icon-btn" onClick={() => setShowNewPost(false)}><span style={{ fontSize: '1.25rem' }}>Ã—</span></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Post title..." className="w-full px-3 py-2 rounded-lg mb-3" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', fontSize: '0.9375rem' }} />
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Share your thoughts (optional)..." rows={4} className="w-full px-3 py-2 rounded-lg mb-3 resize-none" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', fontSize: '0.9375rem' }} />
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-secondary)' }}>Post anonymously</span>
              </label>
              <button onClick={submitPost} className="button primary w-full py-2.5 font-semibold">Submit post</button>
            </div>
          </div>
        </div>
      )}

      {showCreateSub && (
        <div className="ai-backdrop" style={{ zIndex: 400 }} onClick={() => setShowCreateSub(false)}>
          <div className="ai-drawer" style={{ width: '480px', maxWidth: '95vw', margin: '2rem auto', borderRadius: 'var(--radius-xl)', position: 'relative', top: '10vh' }} onClick={e => e.stopPropagation()}>
            <div className="ai-drawer-header">
              <p className="ai-drawer-title">Create a community</p>
              <button className="ai-icon-btn" onClick={() => setShowCreateSub(false)}><X className="w-4 h-4" /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-secondary)', marginBottom: '1.5rem' }}>Create a new community for people to connect, share, and grow together.</p>
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '0.5rem' }}>Community name *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-ink-faint)' }}>/</span>
                    <input
                      type="text"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      placeholder="e.g. hyderabad, dubai, london"
                      className="input input-with-prefix text-sm"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)', marginTop: '0.5rem' }}>Lowercase letters and numbers only. This will be your community URL.</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '0.5rem' }}>Description (optional)</label>
                  <textarea
                    value={newSubDesc}
                    onChange={e => setNewSubDesc(e.target.value)}
                    placeholder="What is this community about?"
                    rows={3}
                    className="input px-3 py-2 text-sm resize-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  />
                </div>
                <button onClick={handleCreateSub} className="button primary w-full py-2.5 font-semibold" disabled={!newSubName.trim()}>Create Community</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


