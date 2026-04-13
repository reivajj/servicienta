import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { UsersListPage } from '../features/users/components/UsersListPage'

export const Route = createFileRoute('/users/')({
  component: UsersRoute,
})

function UsersRoute() {
  return (
    <RequireAuth>
      <UsersListPage />
    </RequireAuth>
  )
}
