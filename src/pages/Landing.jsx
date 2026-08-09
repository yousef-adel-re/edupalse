// src/pages/Landing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  Sparkles, 
  BookOpen, 
  FileSignature, 
  Layers, 
  FileOutput, 
  MessageSquarePlus, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Star, 
  Users, 
  Bot, 
  FileSearch,
  Moon,
  Sun,
  Tv
} from 'lucide-react';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900" dir="rtl">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Header / Navbar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <div onClick={() => navigate('/')} className="cursor-pointer">
              <Logo size="42" showText={true} />
            </div>

            {/* Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">المميزات</a>
              <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">كيف يعمل؟</a>
              <a href="#stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">الإحصائيات</a>
              <a href="#testimonials" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">الآراء</a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-2xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                تسجيل الدخول
              </button>

              {/* Major CTA Button: Try Now */}
              <button
                onClick={() => navigate('/auth')}
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-95 transition-all"
              >
                <span>Try Now</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg font-normal">ابدأ الآن</span>
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </header>


      {/* ------------------------------------------------------------- */}
      {/* 2. Hero Section */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        
        {/* Glow Effects Background */}
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-xs md:text-sm font-bold mb-8 animate-fade-in shadow-sm">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400 animate-spin-slow" />
            <span>المنصة التعليمية الأكثر تطوراً بالذكاء الاصطناعي</span>
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">جديد v2.5</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.15] max-w-5xl mx-auto mb-6 text-gray-900 dark:text-white">
            تعلم بذكاء، اختبر قدراتك، وضاعف تحصيلك الدراسي مع <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">EduPulse</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
            حَوّل كتبك وملفات الـ PDF وملاحظاتك إلى خرائط ذهنية تفاعلية، امتحانات تصحيح آلي بالذكاء الاصطناعي، كروت 3D وتلخيصات شائقة بنقرة زر واحدة.
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Zap size={22} className="fill-yellow-400 text-yellow-400" />
              <span>Try Now (ابدأ مجاناً)</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm transition-all text-center"
            >
              استكشف المميزات
            </a>
          </div>

          {/* Floating UI Feature Highlights Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-gray-200/60 dark:border-gray-800/60">
            <div className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl text-blue-600"><BookOpen size={20} /></div>
              <div className="text-right">
                <h4 className="font-extrabold text-sm dark:text-white">خرائط ذهنية</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">تفاعلية وتلقائية</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-xl text-indigo-600"><FileSignature size={20} /></div>
              <div className="text-right">
                <h4 className="font-extrabold text-sm dark:text-white">امتحانات ذكية</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">MCQ ومقالي بـ AI</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/40 p-2.5 rounded-xl text-orange-600"><Layers size={20} /></div>
              <div className="text-right">
                <h4 className="font-extrabold text-sm dark:text-white">كروت 3D</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">حفظ واسترجاع سريع</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
              <div className="bg-teal-100 dark:bg-teal-900/40 p-2.5 rounded-xl text-teal-600"><MessageSquarePlus size={20} /></div>
              <div className="text-right">
                <h4 className="font-extrabold text-sm dark:text-white">شات وحل أكواد</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">مع معاينة حية Live</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 3. Features Section */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 bg-white dark:bg-[#181818] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm tracking-wider uppercase">مميزات استثنائية</span>
            <h2 className="text-3xl sm:text-5xl font-black mt-2 text-gray-900 dark:text-white">كل ما تحتاجه للمذاكرة الفعالة في مكان واحد</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-base sm:text-lg font-medium">تم تصميم أدواتنا بعناية لتوفير الوقت والجهد ومساعدتك في تحقيق أعلى الدرجات العلمية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-blue-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">غرفة المذاكرة والخرائط الذهنية</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                ارفع أي ملف PDF أو صورة دراسية. يقوم النظام باستخراج الهيكل والمفاهيم الرئيسية والفرعية تلقائياً في خريطة ذهنية سريعة الفهم مع شات مخصص للتفاعل مع الملف.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-indigo-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <FileSignature size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">مركز الامتحانات والتقييم الشامل</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                أنشئ امتحانات اختيار من متعدد MCQ، صح/خطأ، وأسئلة مقالية مخصصة. احصل على تصحيح فوري بذكاء أستاذ جامعي مع تقرير كامل يحلل نقاط قوتك وضعفك.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-orange-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-orange-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Layers size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">كروت المذاكرة 3D (Flashcards)</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                استخرج أسئلة وإجابات مختصرة ومثالية للمراجعة على شكل كروت ثلاثية الأبعاد تنقلب بسهولة لتسهيل الحفظ والتذكر السريع قبل الاختبارات.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-teal-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-teal-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-teal-500/30 group-hover:scale-110 transition-transform">
                <FileOutput size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">التلخيص الذكي وتصدير PDF</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                صمّم ملزمات وتلخيصات احترافية تحتوي على عناوين وجداول مقارنات وملاحظات هامة، مع إمكانية تحويلها وتصديرها مباشرة لملف PDF جاهز للطباعة.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-purple-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-purple-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Tv size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">صانع الباوربوينت الذكي (PPTX)</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                أنشئ عروضاً تقديمية كاملة مع إمكانية التعديل الموجه بالـ AI لشريحة محددة، تغيير الثيمات والألوان، وتصدير مباشر بملف PPTX حقيقي يفتح في PowerPoint.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-[#10B981] transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-emerald-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Bot size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">المساعد الذكي (AI Chat & Live Code)</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                مساعد شخصي مفتوح للدردشة والمناقشة. يدعم كتابة الأكواد مع زر تشغيل وتعيينات حية HTML Live Preview، وتنسيق كافة القوانين الرياضية بـ KaTeX.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-rose-500 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="bg-rose-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
                <FileSearch size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">قراءة بخط اليد والصور OCR</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                النموذج مجهز بأحدث تقنيات الرؤية الحاسوبية لقراءة المذكرات المصورة والأوراق المكتوبة بخط اليد وحتى حلول الواجبات المصورة بالكاميرا.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 4. How It Works Section */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm tracking-wider uppercase">خطوات سهلة</span>
            <h2 className="text-3xl sm:text-5xl font-black mt-2 text-gray-900 dark:text-white">كيف يبدأ تعلّمك الذكي مع EduPulse؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative text-center flex flex-col items-center">
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 border border-blue-200 dark:border-blue-800">
                1
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">رفع الملفات والملاحظات</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                ارفع أي ملزمة PDF أو صور من هاتفك أو جهازك. يقوم الذكاء الاصطناعي بقراءتها وتوليد الاسم تلقائياً.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative text-center flex flex-col items-center">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 border border-indigo-200 dark:border-indigo-800">
                2
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">اختر النمط المناسب</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                تصفح الخريطة الذهنية، ولد ملزماً منسقاً، راجع الكروت أو اختبر نفسك في امتحان شامل أو جزئي.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative text-center flex flex-col items-center">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 border border-emerald-200 dark:border-emerald-800">
                3
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">تقييم وتحسين الأداء</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                احصل على تقارير تفصيلية بمستواك ونقاط قوتك وضعفك لتركز عليها في المذاكرة وتحقق العلامات الكاملة.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 5. Stats & Testimonials */}
      {/* ------------------------------------------------------------- */}
      <section id="stats" className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black mb-2">50,000+</div>
              <div className="text-blue-100 font-bold text-sm">ملف تم تحليله</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-2">100,000+</div>
              <div className="text-blue-100 font-bold text-sm">امتحان تم توليده</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-2">99.4%</div>
              <div className="text-blue-100 font-bold text-sm">نسبة الدقة والتصحيح</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-2">24/7</div>
              <div className="text-blue-100 font-bold text-sm">مساعد متاح دائماً</div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-white dark:bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm tracking-wider uppercase">آراء أبطالنا</span>
            <h2 className="text-3xl sm:text-5xl font-black mt-2 text-gray-900 dark:text-white">ماذا يقول الطلاب عن EduPulse؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="flex gap-1 text-yellow-400 mb-4"><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/></div>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed mb-6">"أفضل منصة استخدمتها للمذاكرة في حياتي الجامعية! الخرائط الذهنية والامتحانات الشاملة وفّرت عليّ ساعات طويلة من المذاكرة التقليدية."</p>
              <div className="font-extrabold dark:text-white text-sm">أحمد علي</div>
              <div className="text-xs text-gray-400">طالب بكلية الهندسة</div>
            </div>

            <div className="bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="flex gap-1 text-yellow-400 mb-4"><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/></div>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed mb-6">"خيار تصحيح الأسئلة المقالية وتصوير الإجابة بالكاميرا ممتاز بشكل غير عادي، المصحح الذكي يعطيك التقييم تماماً مثل أستاذ المادة."</p>
              <div className="font-extrabold dark:text-white text-sm">سارة محمود</div>
              <div className="text-xs text-gray-400">طالبة كلية الطب</div>
            </div>

            <div className="bg-gray-50 dark:bg-[#1E1E1E] p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="flex gap-1 text-yellow-400 mb-4"><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/></div>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed mb-6">"الكروت 3D والتلخيصات التي يتم طباعتها PDF خرافية، جعلت مراجعة ليلة الامتحان أسرع بـ 5 أضعاف!"</p>
              <div className="font-extrabold dark:text-white text-sm">عمر خالد</div>
              <div className="text-xs text-gray-400">طالب بكلية الحاسبات</div>
            </div>
          </div>
        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 6. Call To Action (CTA) Banner */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-[#121212] relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[3rem] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            
            {/* Background Ornaments */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-white/20">
                <BrainCircuit size={16} /> انضم لآلاف الطلاب المتفوقين
              </div>

              <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
                جاهز لتبدأ رحلتك التعليمية الذكية؟
              </h2>
              <p className="text-blue-100 text-base sm:text-xl max-w-2xl mx-auto font-medium mb-10">
                أنشئ حسابك المجاني خلال 30 ثانية وابدأ في تحويل طرق مذاكرتك فوراً مع EduPulse AI.
              </p>

              <button
                onClick={() => navigate('/auth')}
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-xl font-black text-blue-900 bg-white hover:bg-gray-50 shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                <span>Try Now - ابدأ الآن مجاناً</span>
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform text-blue-700" />
              </button>
            </div>

          </div>

        </div>
      </section>


      {/* ------------------------------------------------------------- */}
      {/* 7. Footer */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-white dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-gray-800 py-12 text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <Logo size="32" showText={true} />
            <span className="text-xs text-gray-400 border-r pr-3 border-gray-300 dark:border-gray-700">جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>

          <div className="flex gap-6 font-bold text-xs">
            <a href="#features" className="hover:text-blue-600 transition-colors">المميزات</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">كيف يعمل</a>
            <button onClick={() => navigate('/auth')} className="hover:text-blue-600 transition-colors">تسجيل الدخول</button>
          </div>

        </div>
      </footer>

    </div>
  );
}
