// src/pages/PresentationStudio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Plus, Download, Play, X, Loader2, 
  Send, Sparkles, Tv, Layers, Palette, History,
  Minimize2, Wand2, Quote, FileText, Image as ImageIcon
} from 'lucide-react';
import pptxgen from 'pptxgenjs';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { callAzureAI } from '../lib/ai';
import { generateSlideGraphic, fetchImageAsBase64 } from '../lib/presentationGraphics';

// Professional Modern Theme Presets
const THEMES = {
  'ocean-blue': {
    name: 'أزرق احترافي',
    bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    cardBg: 'bg-blue-950/70 border-blue-500/40 backdrop-blur-md shadow-2xl',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200',
    accentGradient: 'from-blue-600 to-cyan-500',
    textColor: 'text-slate-100',
    subtextColor: 'text-blue-200/90',
    badgeBg: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
    pptxBg: '0F172A',
    pptxTitle: '38BDF8',
    pptxText: 'F8FAFC',
    pptxCard: '1E293B',
    pptxAccent: '0284C7'
  },
  'dark-emerald': {
    name: 'زمردي راقي',
    bg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
    cardBg: 'bg-emerald-950/70 border-emerald-500/40 backdrop-blur-md shadow-2xl',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-200',
    accentGradient: 'from-emerald-600 to-teal-500',
    textColor: 'text-slate-100',
    subtextColor: 'text-emerald-200/90',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
    pptxBg: '022C22',
    pptxTitle: '34D399',
    pptxText: 'F0FDF4',
    pptxCard: '064E3B',
    pptxAccent: '059669'
  },
  'sunset-orange': {
    name: 'غروب ذهبي',
    bg: 'bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950',
    cardBg: 'bg-orange-950/70 border-orange-500/40 backdrop-blur-md shadow-2xl',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-200',
    accentGradient: 'from-amber-500 to-orange-600',
    textColor: 'text-slate-100',
    subtextColor: 'text-amber-200/90',
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
    pptxBg: '1C1917',
    pptxTitle: 'FB923C',
    pptxText: 'FFF7ED',
    pptxCard: '44403C',
    pptxAccent: 'EA580C'
  },
  'cyber-purple': {
    name: 'سيبراني ملكي',
    bg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900',
    cardBg: 'bg-purple-950/70 border-purple-500/40 backdrop-blur-md shadow-2xl',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-fuchsia-200',
    accentGradient: 'from-purple-600 to-pink-600',
    textColor: 'text-slate-100',
    subtextColor: 'text-purple-200/90',
    badgeBg: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
    pptxBg: '1A102F',
    pptxTitle: 'C084FC',
    pptxText: 'FAF5FF',
    pptxCard: '2E1065',
    pptxAccent: '9333EA'
  },
  'glass-light': {
    name: 'زجاجي حديث',
    bg: 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100',
    cardBg: 'bg-white/85 border-slate-200 backdrop-blur-md shadow-2xl',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700',
    accentGradient: 'from-blue-600 to-indigo-600',
    textColor: 'text-slate-900',
    subtextColor: 'text-slate-600',
    badgeBg: 'bg-blue-100 border-blue-300 text-blue-800',
    pptxBg: 'F8FAFC',
    pptxTitle: '1D4ED8',
    pptxText: '0F172A',
    pptxCard: 'FFFFFF',
    pptxAccent: '2563EB'
  }
};

export default function PresentationStudio() {
  const navigate = useNavigate();

  const [presentationsHistory, setPresentationsHistory] = useState([]);
  const [currentPresId, setCurrentPresId] = useState(null);

  const [title, setTitle] = useState('');
  const [themeKey, setThemeKey] = useState('ocean-blue');
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingWithAi, setEditingWithAi] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [slideCountInput, setSlideCountInput] = useState(6);
  const [selectedThemeInput, setSelectedThemeInput] = useState('ocean-blue');

  const [aiCommandInput, setAiCommandInput] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [transitionEffect, setTransitionEffect] = useState('slide');
  const [animating, setAnimating] = useState(false);

  const pdfContainerRef = useRef(null);

  useEffect(() => {
    fetchPresentations();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullScreen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, activeSlideIdx, slides]);

  const changeSlideWithAnimation = (newIdx) => {
    setAnimating(true);
    setActiveSlideIdx(newIdx);
    setTimeout(() => setAnimating(false), 400);
  };

  const nextSlide = () => {
    if (activeSlideIdx < slides.length - 1) {
      changeSlideWithAnimation(activeSlideIdx + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlideIdx > 0) {
      changeSlideWithAnimation(activeSlideIdx - 1);
    }
  };

  const fetchPresentations = async () => {
    // تحميل التخزين الكاش السريع للعرض التقديمي الأخير لمنع التأخير
    const cachedActive = localStorage.getItem('last_active_presentation');
    if (cachedActive) {
      try {
        const parsed = JSON.parse(cachedActive);
        setCurrentPresId(parsed.id);
        setTitle(parsed.title);
        setThemeKey(parsed.theme_config?.theme || 'ocean-blue');
        setSlides(parsed.slides_data || []);
        setActiveSlideIdx(0);
        setLoading(false);
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/auth'); return; }

    // جلب البيانات الخفيفة فقط (العناوين والمواعيد دون سلاسل الصورة الثقيلة) لسرعة فاقة
    const { data } = await supabase
      .from('presentations')
      .select('id, title, theme_config, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      setPresentationsHistory(data);
      // جلب السلايدات كاملة لأحدث عرض فقط
      await loadPresentation(data[0].id, data[0]);
    } else if (!cachedActive) {
      setShowCreateModal(true);
    }
    setLoading(false);
  };

  const loadPresentation = async (presId, presMeta = null) => {
    setCurrentPresId(presId);
    if (presMeta) {
      setTitle(presMeta.title);
      setThemeKey(presMeta.theme_config?.theme || 'ocean-blue');
    }

    // جلب بيانات العرض المحدد فقط من Supabase بسرعة ودقة
    const { data } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', presId)
      .single();

    if (data) {
      setTitle(data.title);
      setThemeKey(data.theme_config?.theme || 'ocean-blue');
      setSlides(data.slides_data || []);
      setActiveSlideIdx(0);
      localStorage.setItem('last_active_presentation', JSON.stringify(data));
    }
  };

  const saveToSupabase = async (presTitle, presTheme, presSlides, existingId = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: presTitle,
      theme_config: { theme: presTheme, font: 'Cairo' },
      slides_data: presSlides,
      updated_at: new Date()
    };

    if (existingId) {
      const { error } = await supabase.from('presentations').update(payload).eq('id', existingId);
      if (!error) {
        setPresentationsHistory(prev => prev.map(p => p.id === existingId ? { ...p, ...payload } : p));
        localStorage.setItem('last_active_presentation', JSON.stringify({ id: existingId, ...payload }));
      }
    } else {
      const { data } = await supabase.from('presentations').insert([payload]).select().single();
      if (data) {
        setCurrentPresId(data.id);
        setPresentationsHistory([data, ...presentationsHistory]);
        localStorage.setItem('last_active_presentation', JSON.stringify(data));
      }
    }
  };

  const handleGeneratePresentation = async () => {
    if (!topicInput.trim()) return toast.error("يرجى كتابة موضوع العرض التقديمي.");
    setGenerating(true);
    setShowCreateModal(false);

    const systemPrompt = `أنت خبير ومصمم عروض تقديمية (PowerPoint) محترف.
أنشئ عرضاً تقديمياً زاهياً ومبهراً بصرياً ومقسماً إلى شرائح تفاعلية متنوعة التخطيطات.
أعد الرد بصيغة JSON حصراً بدون أي كتابة خارج الكائن:
{
  "title": "العنوان الرئيسي للعرض",
  "theme": "${selectedThemeInput}",
  "slides": [
    {
      "id": 1,
      "slide_title": "عنوان الشريحة الرئيسية",
      "subtitle": "عنوان فرعي أو وصف جذاب مختصر",
      "layout": "hero_split", // اختر بين: hero_split, cards_2col, grid_3col, stat_highlight, quote_banner, conclusion_callout
      "content": ["نقطة رئيسية أولى ممتازة", "نقطة رئيسية ثانية واضحة", "نقطة ثالثة تكميلية"],
      "image_query": "كلمة إنجليزية معبرة للبحث عن الرسم التوضيحي مثل solar, energy, tech, ai, medical, business",
      "key_stat": "99.4%"
    }
  ]
}
شروط صارمة:
1- أنشئ بالضبط ${slideCountInput} شرائح متنوعة التخطيطات.
2- اكتب كل شريحة باللغة العربية الفصحى الراقية والجذابة.`;

    const userPrompt = `موضوع العرض التقديمي المطلوب: ${topicInput}`;

    try {
      const resultString = await callAzureAI(systemPrompt, [{ role: 'user', content: userPrompt }], "", true, true);
      const parsed = JSON.parse(resultString);

      if (parsed.slides && Array.isArray(parsed.slides)) {
        const processedSlides = await Promise.all(parsed.slides.map(async (s, idx) => {
          const graphicBase64 = await fetchImageAsBase64(null, s.slide_title, s.image_query || topicInput, selectedThemeInput, idx);
          return {
            ...s,
            id: idx + 1,
            layout: s.layout || (idx === 0 ? 'hero_split' : idx === parsed.slides.length - 1 ? 'conclusion_callout' : 'cards_2col'),
            image_url: graphicBase64
          };
        }));

        setTitle(parsed.title || topicInput);
        setThemeKey(selectedThemeInput);
        setSlides(processedSlides);
        setActiveSlideIdx(0);

        await saveToSupabase(parsed.title || topicInput, selectedThemeInput, processedSlides, null);
        toast.success("تم إنشاء العرض التقديمي بنجاح!");
      } else {
        throw new Error("تنسيق غير صالح");
      }
    } catch (err) {
      console.error("فشل التوليد:", err);
      toast.error("حدث خطأ أثناء إنشاء العرض، حاول مرة أخرى.");
    } finally {
      setGenerating(false);
      setTopicInput('');
    }
  };

  const handleAiEditCommand = async () => {
    if (!aiCommandInput.trim()) return;
    const commandText = aiCommandInput;
    setAiCommandInput('');
    setEditingWithAi(true);

    const activeSlide = slides[activeSlideIdx];

    const systemPrompt = `أنت مساعد EduPulse الذكي المخصص لتعديل العروض التقديمية.
إليك العرض التقديمي الحالي بتنسيق JSON:
${JSON.stringify({ title, theme: themeKey, slides })}

الشريحة المعروضة أمام المستخدم حالياً هي رقم ${activeSlideIdx + 1}:
${JSON.stringify(activeSlide)}

طلب المستخدِم: "${commandText}"

قواعد صارمة:
1- إذا طلب المستخدِم تعديل شريحة معينة (مثال: عدل العنوان في الشريحة 2)، قم بتعديل تلك الشريحة فقط أو الجزء المطلوب وحافظ على بقية جميع الشرائح دون تغيير أو مسح.
2- إذا طلب المستخدِم تغيير التنسيق أو النمط العام (Theme)، قم بتغيير "theme" إلى أحد الثيمات (ocean-blue, dark-emerald, sunset-orange, cyber-purple, glass-light) والحفاظ على المحتوى والملاحظات.
3- أعد النتيجة بنفس هيكل الـ JSON الأصلي حصراً.`;

    try {
      const resultString = await callAzureAI(systemPrompt, [{ role: 'user', content: commandText }], "", true, true);
      const parsed = JSON.parse(resultString);

      if (parsed.slides && Array.isArray(parsed.slides)) {
        const processedTheme = (parsed.theme && THEMES[parsed.theme]) ? parsed.theme : themeKey;
        const processedSlides = await Promise.all(parsed.slides.map(async (s, idx) => ({
          ...s,
          id: idx + 1,
          image_url: await fetchImageAsBase64(s.image_url, s.slide_title, s.image_query || title, processedTheme, idx)
        })));

        setTitle(parsed.title || title);
        setThemeKey(processedTheme);
        setSlides(processedSlides);
        await saveToSupabase(parsed.title || title, processedTheme, processedSlides, currentPresId);
        toast.success("تم تطبيق التعديل بنجاح!");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تنفيذ التعديل الذكي.");
    } finally {
      setEditingWithAi(false);
    }
  };

  // Export Native PPTX with Base64 Images
  const exportNativePPTX = async () => {
    if (slides.length === 0) return;

    try {
      toast.loading("جاري تحضير وتنسيق ملف PowerPoint الأصلي بجميع الشرائح...", { id: 'pptx-toast' });
      const pptx = new pptxgen();
      const currentTheme = THEMES[themeKey] || THEMES['ocean-blue'];

      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'مساعد EduPulse';
      pptx.company = 'EduPulse Studio';
      pptx.title = title;

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const slide = pptx.addSlide();
        slide.background = { color: currentTheme.pptxBg };

        // Title
        slide.addText(s.slide_title || 'شريحة', {
          x: 0.5,
          y: 0.4,
          w: '90%',
          h: 0.8,
          fontSize: 26,
          bold: true,
          color: currentTheme.pptxTitle,
          align: 'right',
          rtl: true
        });

        // Subtitle
        if (s.subtitle) {
          slide.addText(s.subtitle, {
            x: 0.5,
            y: 1.1,
            w: '90%',
            h: 0.4,
            fontSize: 15,
            color: currentTheme.pptxText,
            align: 'right',
            rtl: true
          });
        }

        // Base64 Graphic Data URL
        const base64Data = await fetchImageAsBase64(s.image_url, s.slide_title, s.image_query, themeKey, i);

        slide.addImage({
          data: base64Data,
          x: 0.5,
          y: 1.6,
          w: 4.5,
          h: 4.3
        });

        // Content Column Cards
        const contentX = 5.2;
        const contentW = 4.3;

        if (s.content && Array.isArray(s.content)) {
          s.content.forEach((point, pIdx) => {
            const cardY = 1.6 + (pIdx * 1.1);
            if (cardY < 6.2) {
              slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
                x: contentX,
                y: cardY,
                w: contentW,
                h: 0.95,
                fill: { color: currentTheme.pptxCard },
                line: { color: currentTheme.pptxAccent, width: 1 }
              });

              slide.addText(point, {
                x: contentX + 0.2,
                y: cardY + 0.15,
                w: contentW - 0.4,
                h: 0.65,
                fontSize: 14,
                bold: true,
                color: currentTheme.pptxText,
                align: 'right',
                rtl: true
              });
            }
          });
        }

        if (s.key_stat) {
          slide.addText(`الإحصائية: ${s.key_stat}`, {
            x: contentX,
            y: 5.6,
            w: contentW,
            h: 0.6,
            fontSize: 20,
            bold: true,
            color: currentTheme.pptxAccent,
            align: 'center',
            rtl: true
          });
        }
      }

      await pptx.writeFile({ fileName: `عرض_${title.replace(/\s+/g, '_')}.pptx` });
      toast.success("تم تحميل ملف الباوربوينت الأصلي بنجاح!", { id: 'pptx-toast' });
    } catch (err) {
      console.error("PPTX Export error:", err);
      toast.error("حدث خطأ أثناء التصدير لباوربوينت.", { id: 'pptx-toast' });
    }
  };

  // Multi-Page Full Presentation PDF Export
  const exportPixelPerfectPDF = async () => {
    const container = pdfContainerRef.current;
    if (!container || slides.length === 0) return;

    container.classList.remove('hidden');

    toast.loading(`جاري تصدير كافة شرائح العرض التقديمي (${slides.length} شرائح) إلى PDF...`, { id: 'pdf-toast' });

    const opt = {
      margin: 0,
      filename: `عرض_${title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'px', format: [1280, 720], orientation: 'landscape' }
    };

    try {
      await html2pdf().set(opt).from(container).save();
      toast.success(`تم تصدير ملف PDF بنجاح لكل الشرائح الـ ${slides.length}!`, { id: 'pdf-toast' });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("حدث خطأ أثناء تصدير ملف PDF.");
    } finally {
      container.classList.add('hidden');
    }
  };

  const activeTheme = THEMES[themeKey] || THEMES['ocean-blue'];
  const currentSlide = slides[activeSlideIdx] || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] font-sans transition-colors duration-300 pb-20 md:pb-0" dir="rtl">
      
      {/* ------------------------------------------------------------- */}
      {/* Full-Screen Presentation Mode */}
      {/* ------------------------------------------------------------- */}
      {isFullScreen && currentSlide && (
        <div className={`fixed inset-0 z-[500] ${activeTheme.bg} flex flex-col justify-between p-6 md:p-12 animate-fade-in text-white overflow-hidden`}>
          <div className="flex justify-between items-center z-10">
            <span className="text-xs md:text-sm font-bold opacity-70 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
              عرض تقديمي مباشر • مساعد EduPulse
            </span>
            <button onClick={() => setIsFullScreen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <Minimize2 size={22} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full my-auto z-10 py-6">
            <h1 className={`text-3xl md:text-6xl font-black mb-3 leading-tight ${activeTheme.titleColor}`}>
              {currentSlide.slide_title}
            </h1>
            {currentSlide.subtitle && (
              <h2 className={`text-lg md:text-2xl font-bold mb-6 ${activeTheme.subtextColor}`}>
                {currentSlide.subtitle}
              </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-auto items-center">
              <div className={`${currentSlide.image_url ? 'md:col-span-7' : 'md:col-span-12'} space-y-4`}>
                {currentSlide.content && currentSlide.content.map((item, idx) => (
                  <div key={idx} className={`${activeTheme.cardBg} p-5 md:p-6 rounded-3xl border flex items-start gap-4 shadow-2xl`}>
                    <span className="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 mt-0.5">{idx + 1}</span>
                    <p className="text-base md:text-xl font-bold leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              {currentSlide.image_url && (
                <div className="md:col-span-5 flex justify-center">
                  <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl max-h-[380px] w-full group">
                    <img src={currentSlide.image_url} alt={currentSlide.slide_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                </div>
              )}
            </div>

            {currentSlide.key_stat && (
              <div className="mt-6 text-2xl md:text-4xl font-black text-amber-400 text-center bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                الإحصائية: {currentSlide.key_stat}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center z-10">
            <button onClick={prevSlide} disabled={activeSlideIdx === 0} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 disabled:opacity-30 transition-all">
              <ChevronRight size={24} />
            </button>
            <span className="font-black text-sm bg-white/10 px-6 py-2 rounded-full border border-white/20">
              الشريحة {activeSlideIdx + 1} من {slides.length}
            </span>
            <button onClick={nextSlide} disabled={activeSlideIdx === slides.length - 1} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 disabled:opacity-30 transition-all">
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main App Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200">
              <ChevronRight size={20} className="dark:text-white" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-md">
                <Tv size={22} />
              </div>
              <div>
                <h1 className="font-black text-gray-900 dark:text-white text-base md:text-lg truncate max-w-[180px] md:max-w-xs">{title || 'صانع العروض التقديمية'}</h1>
                <p className="text-[11px] text-gray-400 font-bold">مساعد EduPulse</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-2xl text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> عرض جديد
            </button>

            <button 
              onClick={() => setIsFullScreen(true)}
              disabled={slides.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-40"
            >
              <Play size={16} /> تقديم العرض
            </button>

            <button 
              onClick={exportPixelPerfectPDF}
              disabled={slides.length === 0}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-40"
            >
              <FileText size={16} /> تحميل PDF (كامل)
            </button>

            <button 
              onClick={exportNativePPTX}
              disabled={slides.length === 0}
              className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all disabled:opacity-40"
            >
              <Download size={16} /> تحميل PPTX
            </button>
          </div>

        </div>
      </header>


      {/* ------------------------------------------------------------- */}
      {/* Studio Workspace Layout */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar: History & Themes */}
        <div className="w-full md:w-1/4 bg-white dark:bg-[#1E1E1E] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm shrink-0 flex flex-col h-fit">
          
          <h3 className="font-bold dark:text-white text-sm mb-4 flex items-center gap-2">
            <History size={18} className="text-blue-600" /> سجل العروض المحفوظة
          </h3>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 mb-6">
            {presentationsHistory.map(pres => (
              <div 
                key={pres.id}
                onClick={() => loadPresentation(pres.id, pres)}
                className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex justify-between items-center ${currentPresId === pres.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 font-bold' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}
              >
                <div className="truncate pr-1">
                  <p className="text-xs dark:text-white truncate font-bold">{pres.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(pres.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))}
            {presentationsHistory.length === 0 && <p className="text-xs text-gray-400">لا توجد عروض محفوظة.</p>}
          </div>

          <h3 className="font-bold dark:text-white text-sm mb-3 flex items-center gap-2 border-t dark:border-gray-800 pt-4">
            <Palette size={18} className="text-indigo-600" /> خيارات النمط والألوان
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {Object.keys(THEMES).map(k => (
              <button
                key={k}
                onClick={async () => {
                  setThemeKey(k);
                  await saveToSupabase(title, k, slides, currentPresId);
                }}
                className={`p-2.5 rounded-2xl border text-right text-xs font-bold transition-all flex items-center justify-between ${themeKey === k ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200 dark:border-gray-800'}`}
              >
                <span className="dark:text-white">{THEMES[k].name}</span>
                <div className={`w-4 h-4 rounded-full ${THEMES[k].bg}`} />
              </button>
            ))}
          </div>

          <div className="border-t dark:border-gray-800 pt-4 mt-4">
            <label className="block text-xs font-bold text-gray-500 mb-2">تأثير الانتقالات:</label>
            <select 
              value={transitionEffect} 
              onChange={e => setTransitionEffect(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs font-bold dark:text-white outline-none"
            >
              <option value="slide">انزلاق انسيابي (Slide)</option>
              <option value="fade">تلاشي ناعم (Fade)</option>
              <option value="zoom">تراكم البؤرة (Zoom)</option>
            </select>
          </div>

        </div>

        {/* Center Workspace: Live Slide Preview & Editor */}
        <div className="flex-1 flex flex-col items-center">
          
          {generating ? (
            <div className="w-full h-[480px] bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center shadow-sm">
              <Loader2 size={50} className="animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-bold dark:text-white">جاري تصميم العرض التقديمي بذكاء EduPulse...</h2>
              <p className="text-sm text-gray-400 mt-2">يتم تجهيز الشرائح والصور التوضيحية والتنسيقات.</p>
            </div>
          ) : currentSlide ? (
            <div className="w-full flex flex-col items-center">
              
              {/* Slide Viewport Frame */}
              <div 
                className={`w-full aspect-[16/9] rounded-[2.5rem] p-6 md:p-10 shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between ${activeTheme.bg} ${activeTheme.textColor} ${animating ? (transitionEffect === 'fade' ? 'opacity-0 scale-98' : transitionEffect === 'zoom' ? 'scale-90 opacity-50' : 'translate-x-6 opacity-40') : 'opacity-100 scale-100 translate-x-0'}`}
              >
                
                {/* Header Title */}
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className={`text-2xl md:text-4xl font-black leading-tight ${activeTheme.titleColor}`}>
                        {currentSlide.slide_title}
                      </h2>
                      {currentSlide.subtitle && (
                        <p className={`text-xs md:text-sm font-bold mt-1.5 ${activeTheme.subtextColor}`}>
                          {currentSlide.subtitle}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-3.5 py-1 rounded-full border border-white/20 shrink-0 ${activeTheme.badgeBg}`}>
                      الشريحة {activeSlideIdx + 1} / {slides.length}
                    </span>
                  </div>
                </div>

                {/* Content Layout Dynamic Render */}
                <div className="my-auto py-2">
                  
                  {/* Hero Split Layout / Graphic Image Side-by-Side */}
                  {currentSlide.layout === 'hero_split' || currentSlide.image_url ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-7 space-y-3">
                        {currentSlide.content && currentSlide.content.map((point, idx) => (
                          <div key={idx} className={`${activeTheme.cardBg} p-4 rounded-2xl border backdrop-blur-md shadow-md flex items-start gap-3`}>
                            <span className="bg-white/20 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{idx + 1}</span>
                            <p className="text-xs md:text-sm font-bold leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>

                      {currentSlide.image_url && (
                        <div className="md:col-span-5 flex justify-center">
                          <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl max-h-[220px] w-full group">
                            <img src={currentSlide.image_url} alt={currentSlide.slide_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentSlide.layout === 'grid_3col' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentSlide.content && currentSlide.content.map((point, idx) => (
                        <div key={idx} className={`${activeTheme.cardBg} p-5 rounded-2xl border flex flex-col justify-between h-full`}>
                          <span className="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-3">{idx + 1}</span>
                          <p className="text-xs md:text-sm font-bold leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  ) : currentSlide.layout === 'quote_banner' ? (
                    <div className={`${activeTheme.cardBg} p-8 rounded-3xl text-center relative border shadow-2xl my-4`}>
                      <Quote className="mx-auto text-blue-400/30 mb-2" size={40} />
                      <p className="text-lg md:text-2xl font-black leading-relaxed italic">{currentSlide.subtitle || currentSlide.content?.[0]}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSlide.content && currentSlide.content.map((point, idx) => (
                        <div key={idx} className={`${activeTheme.cardBg} p-4 md:p-5 rounded-2xl border shadow-md flex items-start gap-3`}>
                          <span className="bg-white/20 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{idx + 1}</span>
                          <p className="text-xs md:text-sm font-bold leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentSlide.key_stat && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xl md:text-2xl text-center">
                      النسبة: {currentSlide.key_stat}
                    </div>
                  )}
                </div>

                {/* Footer Brand */}
                <div className="flex justify-between items-center text-[10px] opacity-40 border-t border-white/10 pt-2">
                  <span>EduPulse Presentation Studio</span>
                  <span>مساعد EduPulse</span>
                </div>
              </div>

              {/* Thumbnails Navigation Carousel */}
              <div className="w-full flex items-center justify-between gap-3 mt-6 bg-white dark:bg-[#1E1E1E] p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
                <button onClick={prevSlide} disabled={activeSlideIdx === 0} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 disabled:opacity-30">
                  <ChevronRight size={18} className="dark:text-white" />
                </button>

                <div className="flex gap-2 overflow-x-auto py-1">
                  {slides.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => changeSlideWithAnimation(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${activeSlideIdx === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                    >
                      شريحة {idx + 1}
                    </button>
                  ))}
                </div>

                <button onClick={nextSlide} disabled={activeSlideIdx === slides.length - 1} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 disabled:opacity-30">
                  <ChevronLeft size={18} className="dark:text-white" />
                </button>
              </div>

            </div>
          ) : (
            <div className="w-full h-[400px] bg-white dark:bg-[#1E1E1E] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
              <Tv size={48} className="text-gray-400 mb-3" />
              <p className="text-gray-500 font-bold">لا يوجد عرض تقديمي حالياً. قم بإنشاء واحد جديد.</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                إنشاء عرض الآن
              </button>
            </div>
          )}

          {/* Targeted AI Command Box */}
          {currentSlide && (
            <div className="w-full bg-white dark:bg-[#1E1E1E] p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
              <h4 className="font-bold text-xs dark:text-white mb-1.5 flex items-center gap-1.5 text-blue-600">
                <Wand2 size={16} /> تعديل موجه بالشات (مساعد EduPulse)
              </h4>
              <p className="text-[11px] text-gray-400 mb-3">
                اكتب ما تريد تعديله فقط (مثال: "عدل العنوان في الشريحة الحالية"، "غير النمط للون الزجاجي").
              </p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={aiCommandInput}
                  onChange={(e) => setAiCommandInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiEditCommand()}
                  placeholder="مثال: عدل في الشريحة 2 العنوان واجعله..."
                  className="flex-1 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs dark:text-white outline-none focus:border-blue-500 font-medium"
                />
                <button 
                  onClick={handleAiEditCommand}
                  disabled={editingWithAi || !aiCommandInput.trim()}
                  className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs flex items-center gap-1 disabled:opacity-50 hover:bg-blue-700"
                >
                  {editingWithAi ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                  <span>تطبيق</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Hidden Container for Full Presentation Multi-Page PDF Export */}
      {/* ------------------------------------------------------------- */}
      <div ref={pdfContainerRef} className="hidden">
        {slides.map((sItem, sIdx) => (
          <div 
            key={sIdx} 
            className={`w-[1280px] h-[720px] p-12 relative flex flex-col justify-between ${activeTheme.bg} ${activeTheme.textColor}`}
            style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
          >
            <div>
              <h2 className={`text-4xl font-black ${activeTheme.titleColor}`}>{sItem.slide_title}</h2>
              {sItem.subtitle && <p className={`text-lg font-bold mt-2 ${activeTheme.subtextColor}`}>{sItem.subtitle}</p>}
            </div>

            <div className="grid grid-cols-12 gap-6 my-auto items-center">
              <div className="col-span-7 space-y-4">
                {sItem.content && sItem.content.map((pt, pIdx) => (
                  <div key={pIdx} className={`${activeTheme.cardBg} p-5 rounded-2xl border flex items-start gap-4 shadow-xl`}>
                    <span className="bg-white/20 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{pIdx + 1}</span>
                    <p className="text-base font-bold leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
              {sItem.image_url && (
                <div className="col-span-5 flex justify-center">
                  <img src={sItem.image_url} alt="Slide Graphic" className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[280px] w-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs opacity-50 border-t border-white/10 pt-3">
              <span>EduPulse Presentation Studio</span>
              <span>الشريحة {sIdx + 1} من {slides.length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* New Presentation Creation Modal */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl w-full max-w-lg relative border dark:border-gray-800 shadow-2xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 left-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 text-white p-3 rounded-2xl">
                <Tv size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl dark:text-white">إنشاء عرض تقديمي جديد</h3>
                <p className="text-xs text-gray-400 mt-1">مساعد EduPulse سيتولى كتابة وتنسيق الشرائح.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">موضوع العرض التقديمي:</label>
                <input 
                  type="text" 
                  value={topicInput} 
                  onChange={(e) => setTopicInput(e.target.value)} 
                  placeholder="مثال: الطاقة المتجددة والمستدامة" 
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-blue-500 font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عدد الشرائح المطلوب:</label>
                <input 
                  type="number" 
                  min="3" 
                  max="15" 
                  value={slideCountInput} 
                  onChange={(e) => setSlideCountInput(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-blue-500 font-bold text-center" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">اختر النمط البصري (Theme):</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(THEMES).map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedThemeInput(k)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-right flex justify-between items-center ${selectedThemeInput === k ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <span className="dark:text-white">{THEMES[k].name}</span>
                      <div className={`w-3 h-3 rounded-full ${THEMES[k].bg}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGeneratePresentation} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm mt-4"
              >
                توليد العرض بذكاء EduPulse
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
