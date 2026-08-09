// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import StudySection from './pages/StudySection';
import StudyRoom from './pages/StudyRoom';
import SummaryView from './pages/SummaryView';
import CardsView from './pages/CardsView';
import ExamDashboard from './pages/ExamDashboard';
import ExamRoom from './pages/ExamRoom';
import AiChat from './pages/AiChat';
import PresentationStudio from './pages/PresentationStudio';
import BottomNav from './components/BottomNav'; 

import { getPendingExamResults, removePendingExamResult } from './lib/offlineDb';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const syncPendingResults = async () => {
      try {
        const pending = await getPendingExamResults();
        if (pending && pending.length > 0) {
          for (const item of pending) {
            const { error } = await supabase.from('exams').update({
              status: item.status,
              user_answers: item.user_answers,
              score: item.score,
              total_score: item.total_score,
              ai_feedback: item.ai_feedback,
              final_analysis: item.final_analysis
            }).eq('id', item.id);

            if (!error) {
              await removePendingExamResult(item.id);
            }
          }
          toast.success("تم مزامنة نتائج الاختبارات المحفوظة أوفلاين مع السيرفر بنجاح!");
        }
      } catch (err) {
        console.error("Auto sync failed:", err);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      syncPendingResults();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    if (navigator.onLine) {
      syncPendingResults();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300 relative selection:bg-blue-200 dark:selection:bg-blue-900" dir="rtl">
        
        {/* إعدادات الإشعارات (Hot Toast) */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '16px',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 'bold',
            },
            success: {
              style: { background: '#10B981', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#10B981' },
            },
            error: {
              style: { background: '#EF4444', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#EF4444' },
            },
          }}
        />

        {isOffline && (
          <div className="bg-red-500 text-white text-xs md:text-sm font-bold text-center py-2 flex items-center justify-center gap-2 sticky top-0 z-[200]">
            <WifiOff size={16} /> أنت غير متصل بالإنترنت. يمكنك تصفح سجلاتك القديمة فقط.
          </div>
        )}

        <div className="pb-24 md:pb-0"> 
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <Dashboard /> : <Landing />} />
            <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/study" element={session ? <StudySection /> : <Navigate to="/auth" />} />
            <Route path="/study-room" element={session ? <StudyRoom /> : <Navigate to="/auth" />} />
            <Route path="/summary" element={session ? <SummaryView /> : <Navigate to="/auth" />} />
            <Route path="/cards" element={session ? <CardsView /> : <Navigate to="/auth" />} />
            <Route path="/exams" element={session ? <ExamDashboard /> : <Navigate to="/auth" />} />
            <Route path="/exam-room/:examId" element={session ? <ExamRoom /> : <Navigate to="/auth" />} />
            <Route path="/ai-chat" element={session ? <AiChat /> : <Navigate to="/auth" />} />
            <Route path="/presentations" element={session ? <PresentationStudio /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {session && <BottomNav />}
      </div>
    </Router>
  );
}

export default App;