export function SkeletonLine({ className = '' }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
      <SkeletonLine className="h-3 w-24 mb-3" />
      <SkeletonLine className="h-8 w-32 mb-2" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-white/5">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-40" />
        <SkeletonLine className="h-3 w-24" />
      </div>
      <SkeletonLine className="h-6 w-16 rounded-full" />
    </div>
  );
}

export default function Skeleton({ count = 3, type = 'row' }) {
  const Component = type === 'card' ? SkeletonCard : SkeletonRow;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
