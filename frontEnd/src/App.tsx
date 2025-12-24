import { useEffect } from 'react';
import { ToastProvider } from './shared/ui/ToastProvider';
import { authApi } from './features/auth/api/authApi';
import { authStore } from './features/auth/store/authStore';
import AppRoutes from './app/Routes';
import { BrowserRouter } from 'react-router-dom';
import './styles/globals.css';
import 'react-easy-crop/react-easy-crop.css';
import { ModalProvider } from './shared/ui/ModalProvider';

function App() {
  useEffect(() => {
    authApi
      .refresh()
      .then((res) => {
        authStore.getState().setAccessToken(res.accessToken);
      })
      .catch(() => {
        authStore.getState().logout();
      })
      .finally(() => {
        authStore.getState().setAuthInitialized();
      });
  }, []);

  return (
    <>
      <BrowserRouter>
        <ModalProvider />
        <ToastProvider />
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;
