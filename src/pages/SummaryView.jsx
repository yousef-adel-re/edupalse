// src/pages/SummaryView.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, ChevronRight, Loader2, PlusCircle, History, Trash2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { callAzureAI, detectTextDirection } from '../lib/ai';
import { supabase } from '../lib/supabase';

export default function SummaryView() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileData = location.state?.fileData;
  const fileContent = fileData?.file_content || '';
  
  const [summaries, setSummaries] = useState([]); 
  const [currentSummary, setCurrentSummary] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    if (fileData) fetchSummaries();
  }, [fileData]);

  const fetchSummaries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('file_id', fileData.id)
      .order('created_at', { ascending: false });
      
    if (data && data.length > 0) {
      setSummaries(data);
      setCurrentSummary(data[0]);
    } else {
      setShowLangModal(true); 
    }
    setLoading(false);
  };

  const handleDeleteSummary = async (id, e) => {
    e.stopPropagation(); 
    await supabase.from('summaries').delete().eq('id', id);
    const updated = summaries.filter(s => s.id !== id);
    setSummaries(updated);
    if (currentSummary?.id === id) {
      setCurrentSummary(updated.length > 0 ? updated[0] : null);
    }
  };

  const generateNewSummary = async (lang) => {
    setShowLangModal(false);
    setLoading(true);
    setCurrentSummary(null);

    const langText = lang === 'ar' ? 'باللغة العربية' : 'in English';
    
    // تأكيد صارم للنموذج باستخدام الكلاسات اللي تمنع انقطاع النص
    const systemPrompt = `أنت مصمم ملازم تعليمية محترف. 
    قم بتلخيص المحتوى التالي بدقة عالية ${langText}. 
    يجب أن يكون الرد عبارة عن كود HTML فقط ويحتوي على الكلاسات التالية للتصميم:
    - استخدم <div class="avoid-break bg-blue-50 border-r-4 border-blue-500 p-4 my-4 rounded-lg"> للملاحظات الهامة.
    - استخدم <table class="avoid-break w-full border-collapse border border-gray-300 my-4"><th class="bg-gray-100 p-2 border"> للجدول والمقارنات.
    - استخدم <h1 class="text-3xl font-bold text-blue-700 mb-4 avoid-break"> للعنوان الرئيسي.
    - استخدم <h2 class="text-xl font-bold text-gray-800 mt-6 mb-2 avoid-break"> للعناوين الفرعية.
    - استخدم <ul class="list-disc pl-5 my-2"> للقوائم.
    اكتب القوانين الرياضية بنص واضح ومفهوم بدون رموز برمجية معقدة.
    لا تكتب أي شيء خارج كود الـ HTML، ولا تكتب كلمة html في البداية.`;
    
    const userPrompt = `قم بتلخيص هذا الملف:\n\n${fileContent}`;
    
    const resultHtml = await callAzureAI(systemPrompt, [{ role: 'user', content: userPrompt }], "", true);
    
    const { data } = await supabase
      .from('summaries')
      .insert([{ file_id: fileData.id, language: lang, html_content: resultHtml }])
      .select().single();

    if (data) {
      setSummaries([data, ...summaries]);
      setCurrentSummary(data);
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-content');
    
    // هذا الكود السحري الذي قمت بمسحه بالخطأ لإجبار الـ PDF على عدم قص الجداول والعناوين
    const style = document.createElement('style');
    style.innerHTML = `
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
      h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
      table, tr, td, th { page-break-inside: avoid; break-inside: avoid; }
      ul, li { page-break-inside: avoid; }
    `;
    element.appendChild(style);

    html2pdf().set({
      margin: 15,
      filename: `تلخيص_${fileData?.file_name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save().then(() => style.remove());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 md:p-6 font-sans transition-colors" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        <div className="w-full md:w-1/4 bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 h-fit">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6 hover:text-blue-600 transition-colors">
            <ChevronRight size={20} /> العودة للمذاكرة
          </button>
          
          <button onClick={() => setShowLangModal(true)} className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold mb-6 hover:bg-blue-100 transition-colors">
            <PlusCircle size={18} /> تلخيص جديد
          </button>

          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><History size={18}/> سجل التلخيصات</h3>
          <div className="space-y-3">
            {summaries.map(s => (
              <div 
                key={s.id} 
                onClick={() => setCurrentSummary(s)}
                className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${currentSummary?.id === s.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}
              >
                <div>
                  <p className="font-bold text-sm dark:text-white">تلخيص ({s.language === 'ar' ? 'عربي' : 'إنجليزي'})</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <button onClick={(e) => handleDeleteSummary(s.id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto pb-10">
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 text-center md:text-right">
            <h1 className="text-xl md:text-2xl font-bold dark:text-white">تلخيص: {fileData?.file_name}</h1>
            {currentSummary && (
              <button onClick={handleDownloadPDF} className="w-full md:w-auto bg-blue-600 text-white flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">
                <Download size={18} /> طباعة الملزمة
              </button>
            )}
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] md:h-96 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="text-gray-500 font-bold px-4 text-center">جاري تصميم الملخص (عناوين، جداول، ملاحظات)...</p>
            </div>
          ) : currentSummary ? (
            <div 
              id="pdf-content" 
              className="bg-white p-6 md:p-14 rounded-2xl shadow-lg text-gray-900 border border-gray-100 mx-auto" 
              style={{ minHeight: '800px', maxWidth: '800px' }} // تحديد العرض مهم لتنسيق الـ PDF
              dir={detectTextDirection(currentSummary.html_content)}
            >
              {/* نفس أكواد الـ page-break الخاصة بك للـ Render العادي */}
              <style dangerouslySetInnerHTML={{__html: `
                .avoid-break { page-break-inside: avoid; break-inside: avoid; }
                h1, h2, h3 { page-break-after: avoid; break-after: avoid; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; page-break-inside: avoid; font-size: 14px; }
                th, td { border: 1px solid #e5e7eb; padding: 0.5rem md:padding: 0.75rem; text-align: ${currentSummary.language === 'ar' ? 'right' : 'left'}; }
                th { background-color: #f9fafb; font-weight: bold; }
                .prose ul { list-style-type: disc; margin-left: 1.5rem; margin-right: 1.5rem; }
                li { margin-bottom: 0.5rem; page-break-inside: avoid; }
              `}} />
              <div className="prose max-w-none text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: currentSummary.html_content }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[50vh] md:h-96 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500">لا يوجد تلخيصات. قم بإنشاء واحد جديد.</p>
            </div>
          )}
        </div>
      </div>

      {showLangModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl w-full max-w-sm text-center">
            <h3 className="font-bold text-xl mb-6 dark:text-white">اختر لغة التلخيص</h3>
            <div className="flex flex-col gap-4">
              <button onClick={() => generateNewSummary('ar')} className="bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-sm">اللغة العربية</button>
              <button onClick={() => generateNewSummary('en')} className="bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors text-lg shadow-sm">English</button>
            </div>
            <button onClick={() => setShowLangModal(false)} className="mt-6 text-gray-500 font-bold hover:underline">إلغاء</button>
          </div>
        </div>
      )}

    </div>
  );
}