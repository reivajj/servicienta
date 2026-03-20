import { createFileRoute } from '@tanstack/react-router'
import { TechniciansPage } from '../features/technicians/components/TechniciansPage'

export const Route = createFileRoute('/technicians')({
  component: TechniciansPage,
})
