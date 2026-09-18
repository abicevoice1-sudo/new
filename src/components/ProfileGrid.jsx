import ProfileCard from './ProfileCard.jsx';

export default function ProfileGrid({ profiles }) {
  if (!profiles?.length) {
    return (
      <div className="empty-state text-center py-16">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>No profiles yet</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Once members are added, their cards will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
    </div>
  );
}