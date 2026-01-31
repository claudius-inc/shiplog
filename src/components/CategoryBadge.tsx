// ============================================================================
// Category Badge Component
// ============================================================================

import type { Category } from '@/lib/types';

const categoryConfig: Record<
  Category,
  { label: string; color: string; icon: string }
> = {
  feature: {
    label: 'Feature',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    icon: '✨',
  },
  fix: {
    label: 'Fix',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    icon: '🐛',
  },
  improvement: {
    label: 'Improvement',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: '💅',
  },
  breaking: {
    label: 'Breaking',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: '⚠️',
  },
};

interface CategoryBadgeProps {
  category: Category;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadge({
  category,
  showIcon = true,
  size = 'sm',
}: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses}`}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
