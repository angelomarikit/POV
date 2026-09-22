import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AdminLayout } from '../components/admin/AdminLayout'
import { ProtectedAdminRoute } from '../components/admin/AdminAuth'

const HomePage = lazy(() => import('../pages/HomePage'))
const CommunityPage = lazy(() => import('../pages/CommunityPage'))
const FoundersPage = lazy(() => import('../pages/FoundersPage'))
const MemberProfilePage = lazy(() => import('../pages/MemberProfilePage'))
const EventsPage = lazy(() => import('../pages/EventsPage'))
const EventDetailsPage = lazy(() => import('../pages/EventDetailsPage'))
const NewsPage = lazy(() => import('../pages/NewsPage'))
const PartnershipPage = lazy(() => import('../pages/PartnershipPage'))
const NewsDetailsPage = lazy(() => import('../pages/NewsDetailsPage'))
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
      { path: 'founders', element: <Load><FoundersPage /></Load> },
      { path: 'events', element: <Load><EventsPage /></Load> },
      { path: 'events/:slug', element: <Load><EventDetailsPage /></Load> },
      { path: 'videos', element: <Navigate to="/events#videos" replace /> },
      { path: 'news', element: <Load><NewsPage /></Load> },
      { path: 'news/:slug', element: <Load><NewsDetailsPage /></Load> },
      { path: 'partnership', element: <Load><PartnershipPage /></Load> },
      { path: 'about', element: <Navigate to="/#about" replace /> },
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
        { path: 'founders', element: <Load><AdminContentPage kind="founders" /></Load> },
        { path: 'categories', element: <Load><AdminContentPage kind="categories" /></Load> },
        { path: 'events', element: <Load><AdminContentPage kind="events" /></Load> },
        { path: 'videos', element: <Load><AdminContentPage kind="videos" /></Load> },
        { path: 'news', element: <Load><AdminContentPage kind="news" /></Load> },
        { path: 'gallery', element: <Load><AdminContentPage kind="gallery" /></Load> },
        { path: 'social', element: <Load><AdminContentPage kind="social" /></Load> },
        { path: 'contacts', element: <Load><AdminContentPage kind="contacts" /></Load> },
        { path: 'settings', element: <Load><AdminContentPage kind="settings" /></Load> },
        { path: 'media', element: <Load><AdminMediaPage /></Load> },
      ],
    }],
  },
])
