import type { HttpMethod } from '@/types/openapi';

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function MethodBadge({ method, size = 'md' }: MethodBadgeProps) {
  return (
    <span className={`method-badge method-${method} ${sizeClasses[size]}`}>
      {method}
    </span>
  );
}
