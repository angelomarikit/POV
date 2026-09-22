import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AdminAuthProvider } from './components/admin/AdminAuth'
import { router } from './app/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
})

function App() {
  return <QueryClientProvider client={queryClient}><AdminAuthProvider><RouterProvider router={router} /></AdminAuthProvider></QueryClientProvider>
}

export default App
