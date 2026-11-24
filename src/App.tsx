import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

import Auth from './pages/Auth';
import LarasLayout from './components/layout/LarasLayout';
import AdminDashboard from './pages/AdminDashboard';
import SchoolProfile from './pages/SchoolProfile';
import TeacherDirectory from './pages/TeacherDirectory';
import Committees from './pages/Committees';
import CommitteeWorkspace from './pages/CommitteeWorkspace';
import WorkloadManager from './pages/WorkloadManager';
import DutyRoster from './pages/DutyRoster';
import Reports from './pages/Reports';
import BookBuilder from './pages/BookBuilder';
import Settings from './pages/Settings';
import AcceptInvitation from './pages/AcceptInvitation';
import WorkloadAnalytics from './pages/WorkloadAnalytics';

const TIMEOUT_MS = 30 * 60 * 1000;

const ProtectedRoute = ({ session, children }: { session: any; children: React.ReactNode }) => {
  const [isRegistrationComplete, setIsRegistrationComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyRegistration() {
      if (!session?.user) {
        if (active) setIsRegistrationComplete(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!active) return;
      setIsRegistrationComplete(!error && Boolean(data?.school_id && data?.role));
    }

    verifyRegistration();
    return () => { active = false; };
  }, [session?.user?.id]);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isRegistrationComplete === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-emerald-600">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm font-medium text-gray-500">Mengesahkan Keahlian Sekolah...</p>
      </div>
    );
  }

  if (!isRegistrationComplete) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setTimeoutMessage(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    // The client-side idle check remains for UX, but JWT expiration must be set in Supabase settings
    const updateActivity = () => localStorage.setItem('laras_last_activity', Date.now().toString());

    const checkInactivity = async () => {
      const lastActivityStr = localStorage.getItem('laras_last_activity');
      if (lastActivityStr) {
        if (Date.now() - parseInt(lastActivityStr, 10) > TIMEOUT_MS) {
          await supabase.auth.signOut();
          setTimeoutMessage('Sesi anda telah ditamatkan kerana tidak aktif. Sila log masuk semula.');
          setSession(null);
        }
      }
    };

    updateActivity();
    let throttleTimer: any = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 2000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    const intervalId = setInterval(checkInactivity, 10000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(intervalId);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-emerald-600">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm font-medium text-gray-500">Memuatkan Sistem LARAS...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={<Auth message={timeoutMessage} session={session} />} 
        />
        <Route path="/accept-invitation" element={<AcceptInvitation />}/>
        
        {/* APPLIED: Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute session={session}>
              <LarasLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="school-profile" element={<SchoolProfile />} />
          <Route path="teachers" element={<TeacherDirectory />} />
          <Route path="committees" element={<Committees />} />
          <Route path="committee-workspace" element={<CommitteeWorkspace />} />
          <Route path="workload" element={<WorkloadManager />} />
          <Route path="roster" element={<DutyRoster />} />
          <Route path="reports" element={<Reports />} />
          <Route path="book-builder" element={<BookBuilder />} />
          <Route path="analytics" element={<WorkloadAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}