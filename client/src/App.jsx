import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dummy Auth check
    const storedUser = localStorage.getItem('dummy_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setSession({ user });
      setProfile(user);
      fetchLatestProfile(user.id);
    }
    setLoading(false);

    // If we have a stored user, subscribe to changes to their profile row
    let profileSubscription;
    if (storedUser) {
      const user = JSON.parse(storedUser);
      profileSubscription = supabase
        .channel('public:profiles_update')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          if (payload.new && payload.new.id === user.id) {
            setProfile(payload.new);
            localStorage.setItem('dummy_user', JSON.stringify(payload.new));
          }
        })
        .subscribe();
    }

    return () => {
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const fetchLatestProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setProfile(data);
        localStorage.setItem('dummy_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (user) => {
    localStorage.setItem('dummy_user', JSON.stringify(user));
    setSession({ user });
    setProfile(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('dummy_user');
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0B0F19] text-gray-100">
        {session && <Navbar profile={profile} onLogout={handleLogout} />}
        <main className={session ? "max-w-7xl mx-auto px-6 py-8" : ""}>
          <Routes>
            <Route 
              path="/" 
              element={session ? <Dashboard profile={profile} refreshProfile={() => fetchLatestProfile(profile?.id)} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/auth" 
              element={!session ? <Auth onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

