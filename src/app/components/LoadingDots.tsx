interface LoadingDotsProps {
  size?: 'sm' | 'md';
}

export default function LoadingDots({ size = 'md' }: LoadingDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  
  return (
    <div className="flex space-x-1">
      <div className={`${dotSize} bg-white rounded-sm animate-[bounce_1s_ease-in-out_infinite]`} style={{ animationDelay: '0s' }} />
      <div className={`${dotSize} bg-white rounded-sm animate-[bounce_1s_ease-in-out_infinite]`} style={{ animationDelay: '0.2s' }} />
      <div className={`${dotSize} bg-white rounded-sm animate-[bounce_1s_ease-in-out_infinite]`} style={{ animationDelay: '0.4s' }} />
    </div>
  );
} 