import { useState, useEffect } from 'react';
import Login from './components/Login.js';
import Dashboard from './components/Dashboard.js';
import AdminDashboard from './components/AdminDashboard.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token validity and get user info
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            localStorage.removeItem('token');
            return null;
          }
        })
        .then((data) => {
          if (data) {
            setIsAuthenticated(true);
            setIsAdmin(data.isAdmin);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    // Fetch user info to check admin status
    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setShowAdmin(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wallpaper">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-wallpaper">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <div className="bg-wallpaper">
        <AdminDashboard onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="bg-wallpaper">
      <Dashboard
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onShowAdmin={() => setShowAdmin(true)}
      />
    </div>
  );
}

export default App;
