// apps/web/src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ApiClientProvider } from '@servicienta/query-hooks'
import { routeTree } from './routeTree.gen' // ← se auto-genera
import { getBrowserApiClient } from './lib/api-client'
import './styles/global.css'

const router = createRouter({ routeTree })
const queryClient = new QueryClient()
const apiClient = getBrowserApiClient()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <RouterProvider router={router} />
      </ApiClientProvider>
    </QueryClientProvider>
  </StrictMode>
)
