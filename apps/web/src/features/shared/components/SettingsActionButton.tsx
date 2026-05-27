export function SettingsActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="users-table__action users-table__action--icon"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="users-table__action-icon"
      >
        <path
          d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.2-2-3.5-2.3 1a8 8 0 0 0-2.6-1.5L14.2 3h-4.4l-.3 2.3a8 8 0 0 0-2.6 1.5l-2.3-1-2 3.5 2 1.2a7.9 7.9 0 0 0 0 3l-2 1.2 2 3.5 2.3-1a8 8 0 0 0 2.6 1.5l.3 2.3h4.4l.3-2.3a8 8 0 0 0 2.6-1.5l2.3 1 2-3.5-2-1.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  );
}
