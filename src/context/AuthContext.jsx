import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — verify stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (token === 'demo-mock-jwt-token-12345') {
      setUser({
        id: 'demo_user_123',
        name: 'Demo Student',
        email: 'demo@learnozi.com',
        isOnboarded: true,
        isVerified: true,
        academicProfile: { educationLevel: 'University', university: 'NUST', institution: 'NUST' },
      });
      setLoading(false);
      return;
    }

    axios
      .get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2500,
      })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Fallback user if server token is valid locally
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem('token');
          }
        } else {
          localStorage.removeItem('token');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.requiresVerification) {
        const customErr = new Error(resData.error || 'Email verification required');
        customErr.requiresVerification = true;
        customErr.email = resData.email || email;
        customErr.previewCode = resData.previewCode;
        throw customErr;
      }
      const errorMsg = resData?.error || resData?.message || 'Login failed. Check your credentials.';
      throw new Error(errorMsg);
    }
  };

  const register = async (payload) => {
    try {
      // payload can be an object or (name, email, password)
      const dataToSend = typeof payload === 'string'
        ? { name: payload, email: arguments[1], password: arguments[2] }
        : payload;

      const res = await axios.post('/api/auth/register', dataToSend);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Try again.';
      throw new Error(errorMsg);
    }
  };

  const verifyCode = async (email, code) => {
    try {
      const res = await axios.post('/api/auth/verify-code', { email, code });
      const { token, user: userData } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Verification failed. Please check the code.';
      throw new Error(errorMsg);
    }
  };

  const resendCode = async (email) => {
    try {
      const res = await axios.post('/api/auth/resend-code', { email });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to resend code.';
      throw new Error(errorMsg);
    }
  };

  const demoLogin = () => {
    const demoData = {
      id: 'demo_user_123',
      name: 'Demo Student',
      email: 'demo@learnozi.com',
      isOnboarded: true,
      isVerified: true,
      academicProfile: { educationLevel: 'University', university: 'NUST', institution: 'NUST' },
    };
    localStorage.setItem('token', 'demo-mock-jwt-token-12345');
    localStorage.setItem('user_data', JSON.stringify(demoData));
    setUser(demoData);
    return demoData;
  };

  const googleLogin = async (googleUserData) => {
    try {
      const res = await axios.post('/api/auth/google', googleUserData);
      const { token, user: userData } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
      }
      return userData;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Google sign-in failed.';
      throw new Error(errorMsg);
    }
  };

  const setAuthSession = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyCode,
        resendCode,
        googleLogin,
        setAuthSession,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
