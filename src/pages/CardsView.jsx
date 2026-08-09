// src/pages/CardsView.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Loader2, RotateCw, History, PlusCircle, Trash2 } from 'lucide-react';
import { callAzureAI, detectTextDirection } from '../lib/ai'; 
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { formatMathExpressions } from '../lib/mathUtils';

export default function CardsView() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileData = location.state?.fileData;
  const fileContent = fileData?.file_content || '';
  
  const [flashcardSets, setFlashcardSets] = useState([]); 
  const [currentSet, setCurrentSet] = useState(null); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [cardCount, setCardCount] = useState(5);

  useEffect(() => {
    if (fileData) fetchFlashcardSets();
  }, [fileData]);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('flashcards_sets')
      .select('*')
      .eq('file_id', fileData.id)
      .order('created_at', { ascending: false });
      
    if (data && data.length > 0) {
      setFlashcardSets(data);
      setCurrentSet(data[0]); 
    } else {
      setShowOptionsModal(true); 
    }
    setLoading(false);
  };

  const handleDeleteCards = async (id, e) => {
    e.stopPropagation();
    await supabase.from('flashcards_sets').delete().eq('id', id);
    const updated = flashcardSets.filter(s => s.id !== id);
    setFlashcardSets(updated);
    if (currentSet?.id === id) {
      setCurrentSet(updated.length > 0 ? updated[0] : null);
      setCurrentIndex(0);
    }
  };

  const generateNewCards = async (lang, count) => {
    setShowOptionsModal(false);
    setLoading(true);
    setCurrentSet(null);
    setCurrentIndex(0);
    setIsFlipped(false);

    const langText = lang === 'ar' ? 'باللغة العربية' : 'in English';
    const countText = count === 'all' ? 'تغطي كامل المنهج والمفاهيم' : `بالضبط ${count} كروت`;

    const systemPrompt = `أنت مصمم كروت تعليمية (Flashcards). استخرج المعلومات الهامة ${langText}.
    يجب أن يكون الرد بصيغة JSON حصراً يحتوي على 'cards' بداخلها 'q' للسؤال و 'a' للإجابة.
    اكتب القوانين الرياضية بنص واضح ومفهوم بدون رموز معقدة.
    حاول أن تكون الأسئلة والإجابات مختصرة قدر الإمكان لتناسب الكروت.`;
    
    const userPrompt = `قم بإنشاء كروت ذكية ${countText} من هذا النص:\n\n${fileContent}`;
    
    const resultString = await callAzureAI(systemPrompt, [{role: 'user', content: userPrompt}], "", true, true);
    
    try {
      const parsedData = JSON.parse(resultString);
      if (parsedData.cards) {
        const { data } = await supabase
          .from('flashcards_sets')
          .insert([{ file_id: fileData.id, language: lang, cards_data: parsedData }])
          .select().single();

        if (data) {
          setFlashcardSets([data, ...flashcardSets]);
          setCurrentSet(data);
        }
      }
    } catch (e) {
      console.error("Error parsing JSON", e);
      alert("فشل في توليد الكروت، يرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => Math.min(currentSet.cards_data.cards.length - 1, p + 1)), 150); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => Math.max(0, p - 1)), 150); };

  const cards = currentSet?.cards_data?.cards || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 md:p-6 font-sans transition-colors" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 pb-20 md:pb-0">
        
        <div className="w-full md:w-1/4 bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 h-fit">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6 hover:text-blue-600 transition-colors">
            <ChevronRight size={20} /> العودة للمذاكرة
          </button>
          
          <button onClick={() => setShowOptionsModal(true)} className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-700 py-3 rounded-xl font-bold mb-6 hover:bg-orange-100 transition-colors">
            <PlusCircle size={18} /> كروت جديدة
          </button>

          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><History size={18}/> مجموعات الكروت</h3>
          <div className="space-y-3">
            {flashcardSets.map(set => (
              <div 
                key={set.id} 
                onClick={() => { setCurrentSet(set); setCurrentIndex(0); setIsFlipped(false); }}
                className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${currentSet?.id === set.id ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}
              >
                <div>
                  <p className="font-bold text-sm dark:text-white">كروت ({set.language === 'ar' ? 'عربي' : 'إنجليزي'})</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(set.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <button onClick={(e) => handleDeleteCards(set.id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[550px] bg-white dark:bg-[#1E1E1E] p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <header className="flex flex-col md:flex-row items-center justify-between w-full mb-8 text-center md:text-right gap-4">
            <h1 className="text-xl md:text-2xl font-bold dark:text-white truncate max-w-[250px] md:max-w-md leading-relaxed">الكروت: {fileData?.file_name}</h1>
            {!loading && cards.length > 0 && (
              <span className="font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full text-sm shrink-0 shadow-inner">
                {currentIndex + 1} / {cards.length}
              </span>
            )}
          </header>

          {loading ? (
            <div className="text-center">
              <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={50} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">جاري صناعة الكروت بذكاء...</h2>
            </div>
          ) : currentSet && cards.length > 0 ? (
            <div className="w-full max-w-xl mx-auto relative perspective-1000">
              
              {/* تعديل جذري للكارت: aspect-ratio للحفاظ على الشكل المربع المستطيل، وحجم مطاطي */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full aspect-[4/5] md:aspect-video max-h-[60vh] relative cursor-pointer transition-transform duration-700 transform-style-3d shadow-xl rounded-3xl"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
              >
                {/* الوجه الأمامي (السؤال) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-gray-50 dark:bg-[#121212] rounded-3xl flex flex-col items-center justify-center p-6 md:p-12 border-2 border-gray-200 dark:border-gray-700" 
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  <RotateCw size={24} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 opacity-50" />
                  
                  {/* حاوية مرنة مع Scroll لو النص انفجر عن الحجم المسموح */}
                  <div className="w-full h-full flex items-center justify-center overflow-y-auto mt-4 mb-6 px-2 custom-scrollbar">
                    {/* استخدام clamp لحجم خط مرن جداً (بيصغر ويكبر حسب الشاشة) مع تحديد حد أدنى وأقصى */}
                    <div className="font-extrabold text-blue-600 dark:text-blue-400 text-center leading-snug w-full" 
                        style={{ fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', wordBreak: 'break-word' }}
                        dir={detectTextDirection(cards[currentIndex].q)}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMathExpressions(cards[currentIndex].q)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <p className="text-gray-400 text-[11px] md:text-sm font-bold shrink-0 mt-auto opacity-70">اضغط لرؤية الإجابة</p>
                </div>

                {/* الوجه الخلفي (الإجابة) */}
                <div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-3xl flex flex-col items-center justify-center p-6 md:p-12 text-white shadow-inner" 
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <RotateCw size={24} className="absolute top-4 right-4 md:top-6 md:right-6 text-white/40" />
                  
                  <div className="w-full h-full flex items-center justify-center overflow-y-auto mt-2 px-2 custom-scrollbar text-white">
                    {/* حجم خط أصغر للإجابات لضمان استيعاب النصوص الطويلة (clamp) */}
                    <div className="font-bold text-center leading-relaxed w-full drop-shadow-md" 
                        style={{ fontSize: 'clamp(1rem, 3.5vw, 1.8rem)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                        dir={detectTextDirection(cards[currentIndex].a)}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMathExpressions(cards[currentIndex].a)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار التنقل صلبة في الأسفل */}
              <div className="flex justify-between items-center mt-10 w-full px-2">
                <button onClick={nextCard} disabled={currentIndex === cards.length - 1} className="flex items-center gap-1 md:gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 md:px-8 md:py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all text-sm md:text-base shadow-lg">
                  التالي <ChevronLeft size={20} />
                </button>
                <button onClick={prevCard} disabled={currentIndex === 0} className="flex items-center gap-1 md:gap-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3.5 md:px-8 md:py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all text-sm md:text-base shadow-sm">
                  <ChevronRight size={20} /> السابق
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">لا يوجد كروت. قم بإنشاء مجموعة جديدة.</p>
          )}
        </div>
      </div>

      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl w-full max-w-md">
            <h3 className="font-bold text-xl mb-6 dark:text-white text-center">إنشاء مجموعة جديدة</h3>
            
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">عدد الكروت:</label>
            <input type="number" min="1" max="50" value={cardCount} onChange={(e) => setCardCount(e.target.value)} className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-6 dark:text-white outline-none focus:border-blue-500 text-center font-bold" />
            
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اختر اللغة:</label>
            <div className="flex gap-4 mb-6">
              <button onClick={() => generateNewCards('ar', cardCount)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-sm active:scale-95 transition-transform">عربي</button>
              <button onClick={() => generateNewCards('en', cardCount)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 shadow-sm active:scale-95 transition-transform">English</button>
            </div>

            <button onClick={() => generateNewCards('ar', 'all')} className="w-full bg-orange-50 text-orange-600 font-bold py-3 rounded-xl mb-3 hover:bg-orange-100 active:scale-95 transition-transform">كروت لكامل المنهج (عربي)</button>
            <button onClick={() => setShowOptionsModal(false)} className="w-full text-gray-500 font-bold py-3 hover:underline">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}