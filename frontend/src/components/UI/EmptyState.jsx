export default function EmptyState({ icon = '◎', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl text-gray-300 dark:text-white/20 mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-white/50 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 dark:text-white/30 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
