import { useState, useEffect } from 'react';

export default function Tooltip({ content, children, className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTimeout, setShowTimeout] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);

  useEffect(() => {
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [showTimeout, hideTimeout]);

  const handleMouseEnter = () => {
    if (showTimeout) clearTimeout(showTimeout);
    const timeout = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    const timeout = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
    setHideTimeout(timeout);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && (
        <div className={`absolute left-0 bottom-full mb-2 px-3 py-1 text-xs font-medium bg-charcoal text-white rounded-lg shadow-lg z-10 max-w-xs whitespace-nowrap ${className}`}>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mb-0.5 h-0.5 w-0.5 bg-charcoal rotate-45" />
        </div>
      )}
    </div>
  );
}
