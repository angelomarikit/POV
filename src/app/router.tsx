import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AdminLayout } from '../components/admin/AdminLayout'
import { ProtectedAdminRoute } from '../components/admin/AdminAuth'

const HomePage = lazy(() => import('../pages/HomePage'))
const CommunityPage = lazy(() => import('../pages/CommunityPage'))
const MemberProfilePage = lazy(() => import('../pages/MemberProfilePage'))
const EventsPage = lazy(() => import('../pages/EventsPage'))
const EventDetailsPage = lazy(() => import('../pages/EventDetailsPage'))
const VideosPage = lazy(() => import('../pages/VideosPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage'))
const AdminContentPage = lazy(() => import('../pages/admin/AdminContentPage'))

function Load({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="grid min-h-[50svh] place-items-center"><div className="size-9 animate-spin rounded-full border-4 border-neutral-200 border-t-orange-500" /></div>}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Load><HomePage /></Load> },
      { path: 'community', element: <Load><CommunityPage /></Load> },
      { path: 'community/:slug', element: <Load><MemberProfilePage /></Load> },
      { path: 'events', element: <Load><EventsPage /></Load> },
      { path: 'events/:slug', element: <Load><EventDetailsPage /></Load> },
      { path: 'videos', element: <Load><VideosPage /></Load> },
      { path: 'about', element: <Load><AboutPage /></Load> },
      { path: '*', element: <Load><NotFoundPage /></Load> },
    ],
  },
  { path: '/admin/login', element: <Load><AdminLoginPage /></Load> },
  {
    path: '/admin',
    element: <ProtectedAdminRoute />,
    children: [{
      element: <AdminLayout />,
      children: [
        { index: true, element: <Load><AdminDashboardPage /></Load> },
        { path: 'homepage', element: <Load><AdminContentPage kind="homepage" /></Load> },
        { path: 'members', element: <Load><AdminContentPage kind="members" /></Load> },
        { path: 'categories', element: <Load><AdminContentPage kind="categories" /></Load> },
        { path: 'events', element: <Load><AdminContentPage kind="events" /></Load> },
        { path: 'videos', element: <Load><AdminContentPage kind="videos" /></Load> },
        { path: 'gallery', element: <Load><AdminContentPage kind="gallery" /></Load> },
        { path: 'social', element: <Load><AdminContentPage kind="social" /></Load> },
        { path: 'contacts', element: <Load><AdminContentPage kind="contacts" /></Load> },
        { path: 'settings', element: <Load><AdminContentPage kind="settings" /></Load> },
        { path: 'media', element: <Load><AdminMediaPage /></Load> },
      ],
    }],
  },
])
