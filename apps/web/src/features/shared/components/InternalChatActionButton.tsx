export function InternalChatActionButton({
  label = 'Chat interno próximamente',
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="users-table__action users-table__action--icon users-table__action--chat"
      aria-label={label}
      title={label}
      disabled={!onClick}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="users-table__action-icon"
      >
        <path
          d="M7.5 5.5h9a3.5 3.5 0 0 1 3.5 3.5v4.9a3.5 3.5 0 0 1-3.5 3.5h-4.3l-3.7 3c-.5.4-1.3 0-1.3-.7v-2.3h-.7A3.5 3.5 0 0 1 3 13.9V9a3.5 3.5 0 0 1 3.5-3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M8.3 10.3h7.4M8.3 13.4h4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
