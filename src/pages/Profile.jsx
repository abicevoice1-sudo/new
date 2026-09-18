import { Link, useParams } from 'react-router-dom';
import Layout from '../layouts/LandingLayout';
import { api } from '../lib/api/client';
import { analytics } from '../lib/analytics';
import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, MapPin, Heart, MessageCircle, Bookmark, Lock, Users, Award, Sparkles, BadgeCheck, Flag } from 'lucide-react';
import CompatibilityIndex from '../components/CompatibilityIndex';
import { computeCompatibility } from '../lib/compatibility';

const GX = ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=75'];

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [interestSent, setInterestSent] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  useEffect(() => {
    if (id) { api.getProfile(id).then(p => { setProfile({ ...p, gallery: [p.photo, ...GX] }); analytics.track('profile_viewed', { id }); }).catch(() => setError('Not found')).finally(() => setLoading(false)); }
  }, [id]);

  const compat = profile ? computeCompatibility(profile) : null;
  if (loading) return (<Layout><main className="max-w-5xl mx-auto px-6 py-10"><div className="aspect-[3/4] rounded-2xl skeleton" style={{ maxWidth: '340px' }} /></main></Layout>);
  if (error || !profile) return (<Layout><main className="max-w-4xl mx-auto px-6 py-10"><div className="empty-state"><div className="empty-state-icon"><Users className="w-16 h-16" /></div><h1 className="empty-state-title">{error || 'Profile not found'}</h1><p className="empty-state-text">The profile you're looking for doesn't exist or may be private.</p><Link to="/profiles" className="button primary mt-4 inline-flex">Browse Profiles</Link></div></main></Layout>);

  const verificationLabel = profile.verificationLevel === 'premium' ? 'ID verified' : profile.is_verified ? 'Verified' : null;
  const isGuardianManaged = profile.managementMode === 'guardian' || profile.guardian;

  return (
    <Layout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/profiles" className="inline-flex items-center gap-2 text-sm mb-5 group" style={{ color: 'var(--color-ink-secondary)' }}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8">
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
              <div className="aspect-[3/4] relative" style={{ background: 'var(--color-surface)' }}>
                 <img src={profile.gallery[activePhoto]} alt={profile.displayName} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                {verificationLabel && (<div className="float-card-badge-match"><ShieldCheck className="w-3 h-3" /> {verificationLabel}</div>)}
                {profile.photosVisibility === 'private' && (<div className="float-card-lock"><div className="float-card-lock-inner"><Lock className="w-4 h-4" /> Private</div></div>)}
              </div>
              {profile.gallery.length > 1 && (
                <div className="flex gap-2 p-3">
                   {profile.gallery.map((photo, i) => (<button key={i} onClick={() => setActivePhoto(i)} aria-label={`View photo ${i + 1} of ${profile.displayName}`} className="flex-1 aspect-square rounded-lg overflow-hidden" style={{ outline: i === activePhoto ? '2px solid var(--color-primary)' : 'none', opacity: i === activePhoto ? 1 : 0.6 }}><img src={photo} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} /></button>))}
                </div>
              )}
            </div>
            <button onClick={() => setShortlisted(!shortlisted)} className="w-full button flex items-center justify-center gap-2 py-2.5 font-semibold text-sm" style={{ background: shortlisted ? 'var(--color-primary)' : 'var(--color-elevated)', color: shortlisted ? '#fff' : 'var(--color-ink)', border: '1px solid var(--color-border)' }}>
              <Bookmark className="w-4 h-4" style={{ fill: shortlisted ? '#fff' : 'none' }} /> {shortlisted ? 'Shortlisted' : 'Shortlist'}
            </button>
            <a
              href={`mailto:support@shiarishta.com?subject=${encodeURIComponent('Report profile: ' + (profile.displayName || id))}&body=${encodeURIComponent(`Reporting profile: ${profile.displayName || id}\nProfile URL: ${window.location.href}\n\nReason (please describe):\n\n`)}`}
              onClick={() => analytics.track('profile_reported', { id, channel: 'mailto' })}
              className="flex items-center justify-center gap-1.5 text-xs py-2 hover:underline"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              <Flag className="w-3.5 h-3.5" /> Report this profile
            </a>
            <p className="text-[11px] text-center" style={{ color: 'var(--color-ink-faint)' }}>
              Opens your email app addressed to our safety team. Reports are reviewed by a person.
            </p>
          </div>
          <div className="space-y-5">
            <div className="p-5 rounded-2xl" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                    {profile.displayName}, {profile.age}
                    {profile.is_verified && <BadgeCheck className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />}
                  </h1>
                  <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--color-ink-secondary)' }}>
                    <MapPin className="w-3.5 h-3.5" /> {profile.location || 'Location not set'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setInterestSent(!interestSent); if (!interestSent) analytics.track('interest_sent', { id }); }} className="button primary px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                    <Heart className="w-4 h-4" style={{ fill: interestSent ? '#fff' : 'none' }} /> {interestSent ? 'Interest sent' : 'Send interest'}
                  </button>
                  <button className="button px-4 py-2 text-sm font-semibold flex items-center gap-1.5" style={{ background: 'var(--color-elevated)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>
                    <MessageCircle className="w-4 h-4" /> Message
                  </button>
                </div>
              </div>
            </div>
            {profile.bio && (
              <div className="p-5 rounded-2xl" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> About
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>{profile.bio}</p>
              </div>
            )}

            <div className="p-5 rounded-2xl" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> Profile at a glance
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Religiosity', value: profile.religiosity },
                  { label: 'Prayer', value: profile.prayer },
                  { label: 'Sect', value: profile.sect },
                  { label: 'Lifestyle', value: profile.halalLifestyle },
                  { label: 'Education', value: profile.educationLevel },
                  { label: 'Ethnicity', value: profile.ethnicity },
                  { label: 'Marital status', value: profile.maritalStatus },
                  { label: 'Children', value: profile.children },
                  { label: 'Intentions', value: profile.intentions },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <p className="text-[11px] uppercase tracking-wider font-bold mb-0.5" style={{ color: 'var(--color-ink-faint)' }}>{item.label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {profile.lookingFor && (
              <div className="p-5 rounded-2xl" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--color-warning)' }} /> Looking for
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>{profile.lookingFor}</p>
              </div>
            )}

            {compat && (
              <div className="p-5 rounded-2xl" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                  <Heart className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Compatibility
                </h2>
                <CompatibilityIndex profile={profile} />
              </div>
            )}

            {isGuardianManaged && (
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Wali / guardian managed</p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-secondary)' }}>Family-involved matchmaking with chaperone support</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)' }}>
              <Award className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <p className="text-xs" style={{ color: 'var(--color-ink-secondary)' }}>
                <strong style={{ color: 'var(--color-ink)' }}>Verified & intentional:</strong> Complete profiles get 4× more meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

