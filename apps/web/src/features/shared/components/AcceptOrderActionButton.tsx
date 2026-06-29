export function AcceptOrderActionButton({
  onClick,
  disabled = false,
  label = 'Aceptar order',
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="users-table__action users-table__action--icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="users-table__action-icon"
      >
        <path
          d="M5.5 12.5 9.5 16.5 18.5 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
