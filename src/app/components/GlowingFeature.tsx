import { ReactNode, useEffect, useState } from 'react';

interface GlowingFeatureProps {
  children: ReactNode;
  isNew?: boolean;
  featureId: string;
}

export default function GlowingFeature({ children, isNew = true, featureId }: GlowingFeatureProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  useEffect(() => {
    const clicked = localStorage.getItem(`feature-${featureId}-clicked`);
    if (clicked) {
      setHasBeenClicked(true);
    }
  }, [featureId]);

  if (!isNew || hasBeenClicked) return <>{children}</>;
  
  return (
    <div 
      className="relative group"
      onClick={() => {
        localStorage.setItem(`feature-${featureId}-clicked`, 'true');
        setHasBeenClicked(true);
      }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 animate-pulse" />
      {children}
    </div>
  );
} 