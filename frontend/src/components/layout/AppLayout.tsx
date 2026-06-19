import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/deployments': 'Deployments',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || ''

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
