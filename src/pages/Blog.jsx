import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/LandingLayout';
import { Clock, ArrowRight, TrendingUp, Bookmark, ArrowLeft, Sparkles } from 'lucide-react';

const articles = [
  { id: 1, title: 'The Art of Intentional Matchmaking', excerpt: 'Approach your search with clarity and faith.', readTime: '5 min', category: 'Guidance', date: 'Aug 20, 2026', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80', trending: true },
  { id: 2, title: 'Family Involvement in Your Search', excerpt: 'Balancing family input with compatibility.', readTime: '7 min', category: 'Family', date: 'Aug 15, 2026', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80', trending: true },
  { id: 3, title: 'A Profile That Reflects Your Values', excerpt: 'Tips for an authentic profile.', readTime: '4 min', category: 'Tips', date: 'Aug 10, 2026', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80' },
  { id: 4, title: 'Privacy & Safety Online', excerpt: 'Protect your information.', readTime: '6 min', category: 'Safety', date: 'Aug 5, 2026', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80' },
  { id: 5, title: 'Wali in Modern Matchmaking', excerpt: 'Guardianship for respectful introductions.', readTime: '5 min', category: 'Guardians', date: 'Jul 28, 2026', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80' },
  { id: 6, title: 'Red Flags and Green Flags', excerpt: 'What to look for early.', readTime: '8 min', category: 'Guidance', date: 'Jul 20, 2026', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80' },
  { id: 7, title: 'Cultural Compatibility', excerpt: 'Shared values and traditions.', readTime: '6 min', category: 'Guidance', date: 'Jul 12, 2026', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80' },
  { id: 8, title: 'Preparing for First Meeting', excerpt: 'Chaperoned introduction advice.', readTime: '5 min', category: 'Tips', date: 'Jul 5, 2026', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80' },
];

const categories = ['All', 'Guidance', 'Family', 'Tips', 'Safety', 'Guardians'];

function getBody(a) {
  return [
    a.title + ' matters deeply to anyone walking the path of intentional matchmaking.',
    'The foundation is clarity. Reflect on what you value before sending your first message.',
    'Complete every section of your profile. Honesty is attractive.',
    'Privacy is built in. Control who sees your photos.',
    'Take your time. The right person will respect your pace.',
    'May Allah put barakah in your search.',
  ].join('\n\n');
}


export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [reading, setReading] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());
  const filtered = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory);
  const toggleBookmark = (id) => setBookmarked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  if (reading) {
    const body = getBody(reading);
    return (
      <Layout>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <button onClick={() => setReading(null)} className="button ghost btn-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to articles
          </button>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-subtle)' }}>{reading.category}</span>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2, margin: '0.75rem 0 1rem' }}>{reading.title}</h1>
          <div className="flex items-center gap-4 mb-6" style={{ color: 'var(--color-ink-faint)', fontSize: '0.8125rem' }}>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reading.readTime}</span>
            <span>{reading.date}</span>
          </div>
          <div className="rounded-2xl overflow-hidden mb-8">
            <img src={reading.image} alt={reading.title} className="w-full h-64 sm:h-80 object-cover" />
          </div>
          <div style={{ color: 'var(--color-ink-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
            {body.split('\n\n').map((p, i) => (<p key={i} style={{ marginBottom: '1.25rem' }}>{p}</p>))}
          </div>
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link to="/register" className="button primary px-6 py-2.5 font-semibold">Start your journey</Link>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <section style={{ padding: 'clamp(2.5rem,5vw,4rem) 1.5rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '0.75rem' }}>Guidance for your journey</h1>
          <p style={{ color: 'var(--color-ink-secondary)', fontSize: '1.0625rem' }}>Thoughtful articles on intentional matchmaking.</p>
        </section>
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ' + (activeCategory === cat ? 'button primary' : 'button ghost')} style={activeCategory === cat ? {} : { border: '1px solid var(--color-border)', color: 'var(--color-ink-secondary)' }}>{cat}</button>))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state text-center py-12">
              <div className="empty-state-icon">
                <Sparkles className="w-16 h-16" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h1 className="empty-state-title text-xl font-bold">No articles found</h1>
              <p className="empty-state-text text-lg">
                Try selecting a different category or check back later for new content.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to="/" className="button ghost">Explore other sections</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <article key={article.id} className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }} onClick={() => setReading(article)}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {article.trending && (<div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold text-white px-2 py-1 rounded-full" style={{ background: 'var(--color-accent)' }}><TrendingUp className="w-3 h-3" /> Trending</div>)}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-medium">
                      <button className="button ghost btn-xs" onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id); }} aria-label={bookmarked.has(article.id) ? 'Remove bookmark' : 'Bookmark article'}>
                        {bookmarked.has(article.id) ? <Bookmark className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-subtle)' }}>{article.category}</span>
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-ink-faint)' }}><Clock className="w-3 h-3" /> {article.readTime}</span>
                    </div>
                    <h3 style={{ fontWeight: 600, color: 'var(--color-ink)', marginBottom: '0.5rem' }}>{article.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{article.excerpt}</p>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>{article.date}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: 'var(--color-primary)' }}>Read article <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}
