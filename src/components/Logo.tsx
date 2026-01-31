// ============================================================================
// ShipLog Logo
// ============================================================================

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const iconSizes = { sm: 'w-6 h-6 text-lg', md: 'w-8 h-8 text-xl', lg: 'w-12 h-12 text-3xl' };
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${iconSizes[size]} rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center`}
      >
        🚢
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight`}>
          Ship<span className="text-brand-400">Log</span>
        </span>
      )}
    </div>
  );
}
