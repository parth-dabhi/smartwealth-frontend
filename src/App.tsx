import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppRouter } from './router/AppRouter';
import { useAuthStore } from './store/authStore';
import { useAdminAuthStore } from './store/adminAuthStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const initializeAdmin = useAdminAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    initializeAdmin();
  }, [initialize, initializeAdmin]);

  return (
    <>
      <AppRouter />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
