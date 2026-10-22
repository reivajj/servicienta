export function PendingActionOverlay({ message }: { message: string }) {
  return (
    <div className="pending-action-overlay" role="status" aria-live="polite">
      <div className="pending-action-overlay__content">
        <span className="pending-action-overlay__spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
}
