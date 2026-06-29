import { Link } from '@tanstack/react-router';

export function ViewClientProfileActionLink({
  clientProfileId,
  label = 'Ver client profile',
}: {
  clientProfileId: string;
  label?: string;
}) {
  return (
    <Link
      className="users-table__action users-table__action--icon"
      to="/client-profiles/$clientProfileId"
      params={{ clientProfileId }}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="users-table__action-icon"
      >
        <path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </Link>
  );
}
