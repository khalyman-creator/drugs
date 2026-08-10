export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-lg text-gray-900">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-outline mt-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
