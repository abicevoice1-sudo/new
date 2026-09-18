import { RouterProvider } from 'react-router-dom';
import router from './routes';
import ToastManager from './components/ToastManager.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './lib/auth/AuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastManager />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;