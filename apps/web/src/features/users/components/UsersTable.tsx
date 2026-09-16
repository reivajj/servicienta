import type { User } from '@servicienta/types';
import { SettingsActionButton } from '../../shared/components/SettingsActionButton';
import { formatUserRole } from '../../shared/utils/user-role';

function formatUserName(name: string | null, surname: string | null) {
  return `${name ?? ''} ${surname ?? ''}`.trim() || 'Sin nombre';
}

export function UsersTable({ users, onSelectUser }: { users: User[]; onSelectUser?: (userId: string) => void }) {
  return <section className="users-table-wrapper"><table className="users-table"><thead><tr>{onSelectUser ? <th>Acción</th> : null}<th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>User ID</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}>{onSelectUser ? <td><SettingsActionButton label="Ver y editar usuario" onClick={() => onSelectUser(user.id)} /></td> : null}<td>{formatUserName(user.name, user.surname)}</td><td>{user.email}</td><td>{formatUserRole(user.role)}</td><td><span className={user.status === 'ACTIVE' ? 'user-badge user-badge--active' : 'user-badge user-badge--deleted'}>{user.status}</span></td><td className="users-table__id">{user.id}</td></tr>)}</tbody></table></section>;
}
