import { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginWithEmail, logoutFirebase } from '../firebase/auth';

export const AuthContext = createContext(null);

const ROLE_DASHBOARD = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  employee: '/dashboard/employee',
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email, password) => {
    setLoading(true);
    try {
      const firebaseUser = await loginWithEmail(email, password);
      const token = await firebaseUser.getIdToken();

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        { firebase_token: token }
      );

      const userData = response.data.data;
      const user = {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        token,
      };

      setCurrentUser(user);
      localStorage.setItem('cs_token', token);
      navigate(ROLE_DASHBOARD[userData.role] ?? '/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
    localStorage.removeItem('cs_token');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
