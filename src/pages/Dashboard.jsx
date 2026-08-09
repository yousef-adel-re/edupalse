// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Trash2, 
  X, 
  CheckCircle, 
  BookOpen, 
  FileSignature, 
  ChevronLeft,
  MessageSquarePlus,
  Moon,
  Sun,
  Sparkles,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setNewName(data.full_name);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', user.id);
    
    if (error) {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء تغيير الاسم' });
    } else {
      setProfile({ ...profile, full_name: newName });
      setMsg({ type: 'success', text: 'تم تغيير الاسم بنجاح' });
    }
    setLoading(false);
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'تم تغيير كلمة السر بنجاح' });
      setNewPassword('');
    }
    setLoading(false);
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleDeleteAllData = async () => {
    const confirm = window.confirm("هل أنت متأكد من حذف جميع ملفاتك وامتحاناتك؟ لا يمكن التراجع عن هذه الخطوة.");
    if (confirm) {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('user_files').delete().eq('user_id', user.id);
      
      if (error) {
        alert("حدث خطأ أثناء الحذف");
      } else {
        alert("تم مسح جميع بياناتك بنجاح.");
        window.location.reload();
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] font-sans transition-colors duration-300 pb-20" dir="rtl">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="36" showText={true} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/landing')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <Globe size={16} /> الصفحة التعريفية
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Welcome Hero */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 pt-10">
        
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden mb-12">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20">
              <Sparkles size={14} className="text-yellow-300" /> لوحة التحكم الذكية
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              مرحباً بعودتك، <span className="underline decoration-yellow-400 decoration-wavy">{profile?.full_name?.split(' ')[0] || 'طالبنا العزيز'}</span> 👋
            </h1>
            <p className="text-blue-100 text-base md:text-xl mt-3 font-medium max-w-2xl">
              جاهز لرحلة تعلّم استثنائية اليوم؟ اختر القسم الذي تريد الاستمرار فيه وتفوق بسهولة.
            </p>
          </div>
        </div>

        {/* Feature Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          
          {/* 1. قسم المذاكرة */}
          <button 
            onClick={() => navigate('/study')}
            className="group relative bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 text-right transition-all hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 transition-all group-hover:w-3" />
              <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">قسم المذاكرة الذكية</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                ارفع ملفاتك الـ PDF، تفاعل مع الخريطة الذهنية التفاعلية، واحصل على تلخيصات منسقة وكروت 3D.
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-base">
              ابدأ المذاكرة الآن <ChevronLeft size={18} />
            </div>
          </button>

          {/* 2. مركز الامتحانات */}
          <button 
            onClick={() => navigate('/exams')}
            className="group relative bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 text-right transition-all hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 transition-all group-hover:w-3" />
              <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSignature size={32} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">مركز الامتحانات</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                اختبر نفسك بأسئلة (MCQ ومقالي) مع تصحيح صارم بالذكاء الاصطناعي وتقرير تحليل مستوى كامل.
              </p>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-base">
              دخول مركز التقييم <ChevronLeft size={18} />
            </div>
          </button>

          {/* 3. الشات الذكي */}
          <button 
            onClick={() => navigate('/ai-chat')}
            className="group relative bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 text-right transition-all hover:shadow-2xl hover:border-teal-500 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-0 left-0 w-2 h-full bg-teal-600 transition-all group-hover:w-3" />
              <div className="bg-teal-50 dark:bg-teal-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquarePlus size={32} className="text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">المساعد الذكي (AI Chat)</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                مساعدك الشخصي للدردشة الحرة، كتابة وتجربة الأكواد البرمجية مباشرة، وحل المعضلات والمعادلات.
              </p>
            </div>
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-base">
              ابدأ المحادثة الآن <ChevronLeft size={18} />
            </div>
          </button>

          {/* 4. صانع العروض التقديمية (PowerPoint Generator) */}
          <button 
            onClick={() => navigate('/presentations')}
            className="group relative bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 text-right transition-all hover:shadow-2xl hover:border-purple-500 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-600 transition-all group-hover:w-3" />
              <div className="bg-purple-50 dark:bg-purple-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe size={32} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">صانع الباوربوينت الاحترافي</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                أنشئ عروضاً تقديمية كاملة مع تعديل ذكي موجه بالشات، معاينة تفاعلية حية، وتصدير مباشر بـ PPTX.
              </p>
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-base">
              إنشاء عرض تقديم الان <ChevronLeft size={18} />
            </div>
          </button>

        </div>

      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border dark:border-gray-800">
            
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Settings className="text-blue-600" size={28} /> الإعدادات العامة
              </h2>

              {msg.text && (
                <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-2 animate-bounce ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {msg.type === 'success' ? <CheckCircle size={20}/> : <X size={20}/>}
                  {msg.text}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">الاسم الكامل:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold text-sm"
                    />
                    <button onClick={handleUpdateName} disabled={loading} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all text-sm">
                      حفظ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">تغيير كلمة المرور:</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="كلمة المرور الجديدة"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button onClick={handleUpdatePassword} disabled={loading || !newPassword} className="bg-gray-900 dark:bg-gray-700 text-white px-5 py-3 rounded-2xl font-black hover:bg-black transition-all text-sm disabled:opacity-30">
                      تحديث
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                  <button 
                    onClick={handleDeleteAllData}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-black text-sm rounded-2xl transition-colors border border-red-100 dark:border-red-900/30"
                  >
                    <Trash2 size={18} /> مسح جميع الملفات والبيانات
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#121212] dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-black text-sm rounded-2xl transition-colors"
                  >
                    <LogOut size={18} /> تسجيل الخروج من الحساب
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}