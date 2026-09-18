import Tooltip from './Tooltip.jsx';

export default function VerifiedBadge({ verified, level = 'basic', className = '' }) {
  if (!verified) return null;

  const verificationInfo = {
    basic: {
      label: 'Verified',
      content: 'Identity verified',
      color: 'bg-sage-dark',
      icon: '✓'
    },
    identity: {
      label: 'ID Verified',
      content: 'Government-issued ID verified',
      color: 'bg-primary',
      icon: '🆔'
    },
    marriage: {
      label: 'Marriage Ready',
      content: 'Marriage intention verified',
      color: 'bg-rose-dark',
      icon: '💍'
    },
    background: {
      label: 'Background Checked',
      content: 'Background verification completed',
      color: 'bg-amber-dark',
      icon: '🔍'
    },
    family: {
      label: 'Family Approved',
      content: 'Family/wali involvement verified',
      color: 'bg-emerald-dark',
      icon: '👨‍👩‍👧‍👦'
    },
    premium: {
      label: 'Verified Member',
      content: 'All verifications completed',
      color: 'bg-purple-dark',
      icon: '🌟'
    }
  };

  const info = verificationInfo[level] || verificationInfo.basic;

  return (
    <Tooltip
      content={info.content}
      className={`${className} inline-flex items-center justify-center ${info.color} text-white rounded-full h-9 w-9 text-xs font-medium shadow-lg ring-2 ring-white`}
    >
      <span className="text-xs font-medium">{info.icon} {info.label}</span>
    </Tooltip>
  );
}