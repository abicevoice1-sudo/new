import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAuth, RequireAdmin } from './layouts/Guards';

// Route-based code splitting — each page loads only when visited,
// keeping the first paint tiny and the app fast on every device.
const Home = lazy(() => import('./pages/Home'));
const Profiles = lazy(() => import('./pages/Profiles'));
const Profile = lazy(() => import('./pages/Profile'));
const Blog = lazy(() => import('./pages/Blog'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPost = lazy(() => import('./pages/CommunityPost'));
const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Messages = lazy(() => import('./pages/Messages'));
const Support = lazy(() => import('./pages/Support'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Agents = lazy(() => import('./pages/Agents'));
// Phase-2 exemplar: onboarding rebuilt as a feature module (features/onboarding/).
// Delete pages/Onboard.jsx once this is verified in all flows.
const Onboard = lazy(() => import('./pages/Onboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Guardians = lazy(() => import('./pages/Guardians'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const SuccessStories = lazy(() => import('./pages/SuccessStories'));
const About = lazy(() => import('./pages/About'));
const Safety = lazy(() => import('./pages/Safety'));
// Admin subpages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminGuardians = lazy(() => import('./pages/admin/AdminGuardians'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageSkeleton() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="skeleton rounded-xl" style={{ width: 64, height: 8, margin: '0 auto 0.9rem' }} />
        <div className="skeleton rounded-xl" style={{ width: 180, height: 10, margin: '0 auto' }} />
      </div>
    </div>
  );
}

function LazyRoute({ component: Component }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

// Each page renders its own layout (MainLayout/LandingLayout), so public routes
// stay flat to avoid double-wrapping. Member + admin routes nest under guards.
const router = createBrowserRouter([
  { path: '/', element: <LazyRoute component={Home} /> },
  { path: '/profiles', element: <LazyRoute component={Profiles} /> },
  { path: '/profiles/:id', element: <LazyRoute component={Profile} /> },
  { path: '/blog', element: <LazyRoute component={Blog} /> },
    { path: '/community', element: <LazyRoute component={Community} /> },
  { path: '/community/:slug', element: <LazyRoute component={Community} /> },
  { path: '/community/:slug/post/:postId', element: <LazyRoute component={CommunityPost} /> },
  { path: '/contact', element: <LazyRoute component={Contact} /> },
  { path: '/agents', element: <LazyRoute component={Agents} /> },
  { path: '/pricing', element: <LazyRoute component={Pricing} /> },
  { path: '/privacy', element: <LazyRoute component={Privacy} /> },
  { path: '/terms', element: <LazyRoute component={Terms} /> },
  { path: '/success-stories', element: <LazyRoute component={SuccessStories} /> },
  { path: '/about', element: <LazyRoute component={About} /> },
  { path: '/safety', element: <LazyRoute component={Safety} /> },
  { path: '/support', element: <LazyRoute component={Support} /> },
  { path: '/guardians', element: <LazyRoute component={Guardians} /> },
  { path: '/auth/login', element: <LazyRoute component={Login} /> },
  { path: '/auth/register', element: <LazyRoute component={Register} /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/dashboard', element: <LazyRoute component={Dashboard} /> },
      { path: '/messages', element: <LazyRoute component={Messages} /> },
      { path: '/onboard', element: <LazyRoute component={Onboard} /> },
      { path: '/profile', element: <LazyRoute component={Onboard} /> },
      { path: '/settings', element: <LazyRoute component={Settings} /> },
    ],
  },
  {
    path: '/admin',
    children: [
      { index: true, element: <LazyRoute component={AdminLogin} /> },
      { path: 'login', element: <LazyRoute component={AdminLogin} /> },
      {
        element: <RequireAdmin />,
        children: [
          { path: 'dashboard', element: <LazyRoute component={AdminDashboard} /> },
          { path: 'messages', element: <LazyRoute component={AdminMessages} /> },
          { path: 'support', element: <LazyRoute component={AdminSupport} /> },
          { path: 'guardians', element: <LazyRoute component={AdminGuardians} /> },
          { path: 'analytics', element: <LazyRoute component={AdminAnalytics} /> },
        ],
      },
    ],
  },
  { path: '*', element: <LazyRoute component={NotFound} /> },
]);

export default router;
