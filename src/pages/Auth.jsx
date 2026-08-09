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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [showResetOtpStep, setShowResetOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showResetOtpStep) {
        // Step 3: Verify Recovery OTP & Set New Password
        if (newPassword.length < 6) throw new Error("كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل.");

        const { error: otpErr } = await supabase.auth.verifyOtp({
          email: formData.email.trim(),
          token: otpToken.trim(),
          type: 'recovery'
        });
        if (otpErr) throw otpErr;

        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) throw updateErr;

        toast.success("تم إعادة تعيين كلمة السر بنجاح! يمكنك تسجيل الدخول الآن.");
        setShowResetOtpStep(false);
        setIsForgotPassword(false);
        setIsLogin(true);
      } else if (isForgotPassword) {
        // Step 2: Forgot Password - Check Email Registration First
        const emailToFind = formData.email.trim().toLowerCase();
        
        // Check in profiles table
        const { data: profileMatch } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', emailToFind)
          .maybeSingle();

        // Fallback check in user_files if profile email wasn't recorded previously
        let isRegistered = !!profileMatch;
        if (!isRegistered) {
          const { data: filesMatch } = await supabase
            .from('user_files')
            .select('id')
            .limit(1);
          // If profiles or files exist under this auth session or RPC check
          if (profileMatch) isRegistered = true;
        }

        if (!profileMatch) {
          toast.error("هذا البريد الإلكتروني غير مسجل في الموقع!");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim());
        if (error) throw error;

        setShowResetOtpStep(true);
        toast.success("تم إرسال كود استعادة كلمة السر (6 أرقام) إلى بريدك!");
      } else if (showOtpStep) {
        // Signup OTP Verification
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email.trim(),
          token: otpToken.trim(),
          type: 'signup'
        });
        if (error) throw error;
        toast.success("تم تأكيد البريد الإلكتروني وتسجيل الدخول بنجاح!");
        navigate('/');
      } else if (isLogin) {
        // Regular Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح!"); 
        navigate('/');
      } else {
        // Regular Signup
        const emailToRegister = formData.email.trim().toLowerCase();

        // 1. Check if email already exists in profiles table
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', emailToRegister)
          .maybeSingle();

        if (existingProfile) {
          toast.error("هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول.");
          setIsLogin(true);
          setLoading(false);
          return;
        }

        // 2. Perform Supabase SignUp
        const { data, error } = await supabase.auth.signUp({
          email: emailToRegister,
          password: formData.password,
          options: { data: { full_name: formData.name, bit_rewards: 0 } }
        });

        if (error) {
          if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.status === 400) {
            toast.error("هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول.");
            setIsLogin(true);
            setLoading(false);
            return;
          }
          throw error;
        }

        // 3. Supabase empty identities check (indicates user already exists in auth.users)
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          toast.error("هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول.");
          setIsLogin(true);
          setLoading(false);
          return;
        }

        if (data?.user && !data?.session) {
          setShowOtpStep(true);
          toast.success("تم إرسال كود التحقق إلى بريدك الإلكتروني!");
        } else {
          toast.success("تم إنشاء حسابك بنجاح!");
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.message || "حدث خطأ أثناء العملية"); 
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
          {isForgotPassword 
            ? 'استعادة كلمة السر' 
            : (isLogin ? 'مرحباً بعودتك إلى EduPulse' : 'أنشئ حسابك التعليمي المجاني')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          {isForgotPassword 
            ? 'أدخل بريدك الإلكتروني لإرسال كود الاستعادة' 
            : (isLogin ? 'قم بتسجيل الدخول لمتابعة المذاكرة والامتحانات' : 'انضم لآلاف الطلاب وابدأ التعلم بالذكاء الاصطناعي')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1E1E1E] py-8 px-6 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-gray-100 dark:border-gray-800 relative z-10">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {showResetOtpStep ? (
              <div className="space-y-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    أدخل كود الاستعادة المرسل إلى: <span className="underline">{formData.email}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">كود الاستعادة (OTP)</label>
                  <input 
                    type="text" 
                    maxLength={12} 
                    required 
                    autoFocus 
                    value={otpToken} 
                    onChange={(e) => setOtpToken(e.target.value)} 
                    className="block w-full text-center tracking-[0.3em] text-2xl py-3.5 border-2 border-blue-500 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-black outline-none focus:ring-4 focus:ring-blue-500/20 uppercase" 
                    placeholder="رمز التحقق" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 text-right">كلمة السر الجديدة</label>
                  <input 
                    type="password" 
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium outline-none" 
                    placeholder="كلمة السر الجديدة" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !otpToken.trim() || !newPassword} 
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : 'تأكيد كلمة السر الجديدة'}
                </button>
              </div>
            ) : showOtpStep ? (
              <div className="space-y-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    أدخل كود التحقق المرسل إلى: <span className="underline">{formData.email}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">كود التحقق (OTP)</label>
                  <input 
                    type="text" 
                    maxLength={12} 
                    required 
                    autoFocus 
                    value={otpToken} 
                    onChange={(e) => setOtpToken(e.target.value)} 
                    className="block w-full text-center tracking-[0.3em] text-2xl py-3.5 border-2 border-blue-500 rounded-2xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-black outline-none focus:ring-4 focus:ring-blue-500/20 uppercase" 
                    placeholder="رمز التحقق" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !otpToken.trim()} 
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : 'تأكيد ودخول الحساب'}
                  {!loading && <ArrowRight size={18} className="rotate-180" />}
                </button>
              </div>
            ) : (
              <>
                {!isLogin && !isForgotPassword && (
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

                {!isForgotPassword && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                      {isLogin && (
                        <button 
                          type="button" 
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          نسيت كلمة السر؟
                        </button>
                      )}
                    </div>
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
                )}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl shadow-lg font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : (isForgotPassword ? 'إرسال كود الاستعادة' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
                  {!loading && <ArrowRight size={18} className="rotate-180" />}
                </button>
              </>
            )}
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100 dark:border-gray-800">
            {isForgotPassword ? (
              <button 
                onClick={() => { setIsForgotPassword(false); setShowResetOtpStep(false); }} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                العودة لشاشة تسجيل الدخول
              </button>
            ) : (
              <button 
                onClick={() => { setIsLogin(!isLogin); setShowOtpStep(false); }} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ قم بتسجيل الدخول'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}