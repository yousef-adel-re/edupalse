// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, BrainCircuit, Loader2, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showOtpStep) {
        // Verify 6-Digit OTP Code
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: otpToken.trim(),
          type: 'signup'
        });
        if (error) throw error;
        toast.success("تم تأكيد البريد الإلكتروني وتسجيل الدخول بنجاح!");
        navigate('/');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح!"); 
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.name, bit_rewards: 0 } }
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setShowOtpStep(true);
          toast.success("تم إرسال كود التحقق المكون من 6 أرقام إلى بريدك!");
        } else {
          toast.success("تم إنشاء حسابك بنجاح!");
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.message || "حدث خطأ أثناء عملية المصادقة"); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative" dir="rtl">
      
      {/* Back to Home Button */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 text-xs font-bold shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowRight size={16} /> الرئيسية
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="48" showText={true} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {isLogin ? 'مرحباً بعودتك إلى EduPulse' : 'أنشئ حسابك التعليمي المجاني'}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          {isLogin ? 'قم بتسجيل الدخول لمتابعة المذاكرة والامتحانات' : 'انضم لآلاف الطلاب وابدأ التعلم بالذكاء الاصطناعي'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1E1E1E] py-8 px-6 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-gray-100 dark:border-gray-800 relative z-10">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {showOtpStep ? (
              <div className="space-y-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    أدخل كود التحقق المكون من 6 أرقام المرسل إلى: <span className="underline">{formData.email}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">كود التحقق (OTP)</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    autoFocus 
                    value={otpToken} 
                    onChange={(e) => setOtpToken(e.target.value)} 
                    className="block w-full text-center tracking-[0.5em] text-2xl py-3.5 border-2 border-blue-500 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-black outline-none focus:ring-4 focus:ring-blue-500/20" 
                    placeholder="000000" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || otpToken.length < 6} 
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : 'تأكيد ودخول الحساب'}
                  {!loading && <ArrowRight size={18} className="rotate-180" />}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowOtpStep(false)} 
                  className="text-xs text-gray-400 hover:text-gray-600 underline font-bold mt-2"
                >
                  تغيير البريد الإلكتروني
                </button>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">الاسم الكامل</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="block w-full pr-10 pl-3 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium outline-none" 
                        placeholder="أحمد محمد" 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="block w-full pr-10 pl-3 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium outline-none" 
                      placeholder="name@example.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      className="block w-full pr-10 pl-3 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium outline-none" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
                  {!loading && <ArrowRight size={18} className="rotate-180" />}
                </button>
              </>
            )}
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
            >
              {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ قم بتسجيل الدخول'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}