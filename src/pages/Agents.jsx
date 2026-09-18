import { motion } from 'framer-motion';
import { useState } from 'react';
import Layout from '../layouts/LandingLayout';
import { useToast } from '../lib/useToast';
import { Sparkles, Brain, MessageCircle, UserCheck, Heart, Search, ArrowRight, CheckCircle, Shield } from 'lucide-react';

const AGENTS = [
  {
    id: 'matcher',
    name: 'Matcher',
    tagline: 'Your AI compatibility advisor',
    type: 'matchmaking',
    icon: Heart,
    color: 'from-rose-400 to-pink-500',
    description: 'Matcher analyzes profiles across faith, values, lifestyle, and intentions to surface your strongest compatibility matches. It learns from your interactions to refine recommendations over time.',
    capabilities: ['AI-powered compatibility scoring', 'Smart match recommendations', 'Preference learning from activity', 'Real-time filter optimization'],
    stats: { accuracy: '94%', matches: '12K+', rating: '4.9' },
  },
  {
    id: 'profile-coach',
    name: 'Profile Coach',
    tagline: 'Polish your story',
    type: 'profile',
    icon: UserCheck,
    color: 'from-violet-400 to-purple-500',
    description: 'Get personalized suggestions to make your profile stand out — from bio writing to photo selection. Profile Coach ensures your authentic self shines through.',
    capabilities: ['Bio writing suggestions', 'Photo quality analysis', 'Completeness scoring', 'Visibility optimization tips'],
    stats: { accuracy: '89%', matches: '8.2K+', rating: '4.8' },
  },
  {
    id: 'conversation',
    name: 'Conversation Guide',
    tagline: 'Meaningful icebreakers',
    type: 'communication',
    icon: MessageCircle,
    color: 'from-sky-400 to-blue-500',
    description: 'Stuck on what to say? Conversation Guide suggests thoughtful, values-based openers tailored to each match — no cheesy lines, just genuine connection starters.',
    capabilities: ['Personalized icebreakers', 'Values-based conversation starters', 'Wali-friendly message templates', 'Timing suggestions'],
    stats: { accuracy: '91%', matches: '6.7K+', rating: '4.8' },
  },
  {
    id: 'wali-assist',
    name: 'Wali Assist',
    tagline: 'Respectful family coordination',
    type: 'communication',
    icon: Shield,
    color: 'from-emerald-400 to-teal-500',
    description: 'Coordinate smoothly with guardians and chaperones. Wali Assist helps families stay involved with transparency — sharing profiles, managing requests, and keeping everyone aligned.',
    capabilities: ['Guardian invitation workflows', 'Co-management permissions', 'Family approval tracking', 'Respectful chaperone integration'],
    stats: { accuracy: '96%', matches: '4.1K+', rating: '4.9' },
  },
  {
    id: 'compatibility',
    name: 'Compatibility Analyst',
    tagline: 'Deep-dive alignment reports',
    type: 'matchmaking',
    icon: Brain,
    color: 'from-amber-400 to-orange-500',
    description: 'Get a detailed breakdown of compatibility across faith, values, lifestyle, and timeline alignment — with actionable insights on where you match and where to communicate openly.',
    capabilities: ['Multi-factor alignment breakdown', 'Faith & values comparison', 'Lifestyle compatibility scoring', 'Timeline alignment analysis'],
    stats: { accuracy: '97%', matches: '15K+', rating: '5.0' },
  },
  {
    id: 'privacy-guard',
    name: 'Privacy Guard',
    tagline: 'Your data, your rules',
    type: 'profile',
    icon: Search,
    color: 'from-slate-400 to-gray-500',
    description: 'Automated privacy recommendations based on your preferences. Privacy Guard suggests optimal photo visibility, profile access, and watermarking settings to keep you in control.',
    capabilities: ['Auto privacy recommendations', 'Photo visibility optimization', 'Screenshot-deterrent watermarking', 'Incognito mode guidance'],
    stats: { accuracy: '99%', matches: '9.8K+', rating: '4.7' },
  },
];

const TABS = [
  { id: 'all', label: 'All Agents', icon: Sparkles },
  { id: 'matchmaking', label: 'Matchmaking', icon: Heart },
  { id: 'profile', label: 'Profile', icon: UserCheck },
  { id: 'communication', label: 'Communication', icon: MessageCircle },
];

export default function Agents() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [engaging, setEngaging] = useState(null);
  const { addToast } = useToast();

  const filtered = AGENTS.filter(a => {
    const matchesTab = activeTab === 'all' || a.type === activeTab;
    const matchesSearch = searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.tagline.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleEngage = async (agent) => {
    setEngaging(agent.id);
    await new Promise(r => setTimeout(r, 800));
    setEngaging(null);
    addToast(`Engaging with ${agent.name}…`, 'success');
  };

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">AI-powered assistance</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mt-2">Your Matchmaking Agents</h1>
          <p className="text-muted mt-2 max-w-xl mx-auto">Intelligent assistants that help you navigate the journey — from profile building to meaningful conversations.</p>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search agents…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-line/30 bg-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
            aria-label="Search agents" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${activeTab === tab.id ? 'border-primary bg-primary text-white' : 'border-line/25 text-muted hover:border-line/50'}`}>
              <TabIcon className="w-3.5 h-3.5" /> {tab.label}
            </button>
            );
          })}
        </div>

        {/* Agent grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-elevated rounded-2xl border border-line/20 overflow-hidden hover:shadow-md transition-all group">
              {/* Header gradient */}
              <div className={`h-2 bg-gradient-to-r ${agent.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white shadow-sm`}>
                    <agent.icon className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-semibold text-muted bg-hover px-2.5 py-1 rounded-full capitalize">{agent.type}</span>
                </div>
                <h3 className="text-lg font-bold text-ink">{agent.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{agent.tagline}</p>
                <p className="text-xs text-muted leading-relaxed mb-4">{agent.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-hover/60">
                    <div className="text-sm font-bold text-ink">{agent.stats.accuracy}</div>
                    <div className="text-[10px] text-muted">Accuracy</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-hover/60">
                    <div className="text-sm font-bold text-ink">{agent.stats.matches}</div>
                    <div className="text-[10px] text-muted">Uses</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-hover/60">
                    <div className="text-sm font-bold text-ink">{agent.stats.rating}</div>
                    <div className="text-[10px] text-muted">Rating</div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-1.5 mb-5">
                  {agent.capabilities.map(cap => (
                    <div key={cap} className="flex items-center gap-2 text-xs text-muted">
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" /> {cap}
                    </div>
                  ))}
                </div>

                <button onClick={() => handleEngage(agent)} disabled={engaging === agent.id}
                  className="w-full button primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {engaging === agent.id ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Starting…</>
                  ) : (
                    <>Get Started <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted py-12">No agents match your search. Try different keywords.</p>
        )}
      </main>
    </Layout>
  );
}
