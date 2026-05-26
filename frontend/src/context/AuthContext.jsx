import { createContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithEmail, logoutFirebase } from '../firebase/auth';

export const AuthContext = createContext(null);

const ROLE_DASHBOARD = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  employee: '/dashboard/employee',
};

async function fetchBackendUser(firebaseUser) {
  const token = await firebaseUser.getIdToken();
  localStorage.setItem('cs_token', token);

  const response = await axios.post(
    `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
    { firebase_token: token }
  );

  if (!response.data.success) {
    throw new Error('Login failed');
  }

  return { ...response.data.data, token };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const authRunId = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const runId = ++authRunId.current;

      if (!firebaseUser) {
        if (!isMounted || runId !== authRunId.current) return;
        setCurrentUser(null);
        localStorage.removeItem('cs_token');
        setInitializing(false);
        return;
      }

      try {
        const userData = await fetchBackendUser(firebaseUser);
        if (!isMounted || runId !== authRunId.current) return;
        setCurrentUser(userData);
      } catch {
        if (!isMounted || runId !== authRunId.current) return;
        setCurrentUser((prev) => (prev?.uid === firebaseUser.uid ? prev : null));
        localStorage.removeItem('cs_token');
      } finally {
        if (isMounted && runId === authRunId.current) {
          setInitializing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authRunId.current += 1;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setIsLoggingIn(true);
    try {
      const firebaseUser = await loginWithEmail(email, password);
      const userData = await fetchBackendUser(firebaseUser);
      setCurrentUser(userData);
      setInitializing(false);
      navigate(ROLE_DASHBOARD[userData.role] ?? '/login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    authRunId.current += 1;
    await logoutFirebase();
    setCurrentUser(null);
    localStorage.removeItem('cs_token');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        loading: initializing,
        isLoggingIn,
      }}
    >
      {initializing ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700"
            role="status"
            aria-label="Loading"
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
