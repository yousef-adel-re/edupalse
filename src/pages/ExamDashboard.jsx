// src/pages/ExamDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, ChevronRight, Loader2, History, PlusCircle, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast'; // الإشعارات
import { supabase } from '../lib/supabase';
import { callAzureAI, extractTextWithVisionModel } from '../lib/ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export default function ExamDashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const[uploadStatus, setUploadStatus] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [pastExams, setPastExams] = useState([]);
  const [generatingExam, setGeneratingExam] = useState(false);
  
  const [examConfig, setExamConfig] = useState({
    isFullSyllabus: false, 
    count: 10,
    types: { mcq: true, tf: true, essay: false },
    lang: 'ar',
    instructions: ''
  });

  useEffect(() => { fetchFiles(); },[]);

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }

      const { data, error } = await supabase.from('user_files').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFiles(data ||[]);
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchPastExams = async (fileId) => {
    const { data } = await supabase.from('exams').select('id, score, total_score, created_at, status').eq('file_id', fileId).order('created_at', { ascending: false });
    setPastExams(data ||[]);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    fetchPastExams(file.id);
  };

  const fileToBase64 = (file) => new Promise((res) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
  });

  const extractTextLocally = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
      }
      return fullText.trim();
    } catch (e) { return ""; }
  };

  // الحل الجذري هنا أيضاً
  const convertPdfToImages = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableFontFace: true }).promise;
    let base64Images =[];
    const maxPages = Math.min(pdf.numPages, 5); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height; canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: 'print'
      };
      
      await page.render(renderContext).promise;
      base64Images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    return base64Images;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    let extractedText = '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (file.type.startsWith('image/')) {
        setUploadStatus('جاري استخراج النص من الصورة...');
        const base64Img = await fileToBase64(file);
        extractedText = await extractTextWithVisionModel([base64Img]);
      } else if (file.type === 'application/pdf') {
        setUploadStatus('جاري قراءة ملف الـ PDF...');
        extractedText = await extractTextLocally(file);
        if (extractedText.length < 50) {
            setUploadStatus('هذا الـ PDF مصور.. جاري القراءة بذكاء (OCR)...');
            const pdfImages = await convertPdfToImages(file);
            extractedText = await extractTextWithVisionModel(pdfImages);
        }
      } else {
        toast.error("يرجى رفع ملفات PDF أو صور فقط.");
        setIsUploading(false); return;
      }

      if (!extractedText || extractedText.length < 10) throw new Error("فشل القراءة");

      setUploadStatus('تحديد اسم للملف...');
      const aiName = await callAzureAI("استنتج اسماً قصيراً للملف (4 كلمات).", [{role:'user', content: extractedText.substring(0, 500)}], "", false);
      
      const { data, error } = await supabase.from('user_files').insert([{ user_id: user.id, file_name: aiName.replace(/["']/g, ''), file_content: extractedText }]).select().single();
      
      if (data) {
        setFiles([data, ...files]);
        handleFileClick(data);
        toast.success("تم رفع الملف وتجهيزه للامتحان.");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الرفع.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      e.target.value = '';
    }
  };

  const generateExam = async () => {
    const activeTypes = Object.keys(examConfig.types).filter(k => examConfig.types[k]);
    if (activeTypes.length === 0) return toast.error("اختر نوع أسئلة واحد على الأقل.");

    setGeneratingExam(true);
    const isEn = examConfig.lang === 'en';

    const typesDesc = activeTypes.map(t => {
      if(t === 'mcq') return isEn 
        ? "- mcq: Multiple Choice Question (Force model to put exactly 4 options in options array)."
        : "- mcq: أسئلة اختيار من متعدد (أجبر النموذج على وضع 4 اختيارات في مصفوفة options).";
      if(t === 'tf') return isEn
        ? "- tf: True/False Question (Force model to put [\"True\", \"False\"] inside options array)."
        : "- tf: أسئلة صح وخطأ (أجبر النموذج على وضع [\"صح\", \"خطأ\"] داخل مصفوفة options دائماً وبلا استثناء).";
      if(t === 'essay') return isEn
        ? "- essay: Essay Question (options array MUST be empty [])."
        : "- essay: أسئلة مقالية (يجب أن تكون مصفوفة options فارغة[]).";
      return "";
    }).join('\n');

    const quantityLogic = examConfig.isFullSyllabus
      ? (isEn 
        ? `CRITICAL: Generate a comprehensive full-syllabus exam. Generate as many questions as possible to cover every single section and concept. Do not limit the count.` 
        : `هام جداً: قم بإنشاء امتحان (شامل لكامل المنهج). قم بتوليد أكبر عدد ممكن من الأسئلة لتغطية كل جزء وكل مفهوم وكل تفصيلة في الملف بلا استثناء. لا تتقيد بعدد.`)
      : (isEn ? `Total questions count: ${examConfig.count}` : `العدد الإجمالي: ${examConfig.count} سؤال.`);

    const langInstruction = isEn
      ? `STRICT REQUIREMENT: Generate ALL question text, options, correctAnswer, and explanation STRICTLY IN ENGLISH.`
      : `شرط صارم: قم بصياغة جميع أسئلة الـ JSON والاختيارات والتفسيرات والإجابات باللغة العربية حصراً.`;

    const systemPrompt = `You are a Professor. Create a JSON exam strictly following this schema:
    { "timer_seconds": ${examConfig.isFullSyllabus ? 3600 : 1800}, "questions":[{ "id": 1, "type": "type", "text": "Question text", "options": ["opt1", "opt2"], "correctAnswer": "Exact Correct Answer", "explanation": "Detailed Explanation" }] }
    Language rule: ${langInstruction}
    Required types and rules:
    ${typesDesc}
    ${quantityLogic}`;

    try {
      const result = await callAzureAI(systemPrompt,[{role: 'user', content: selectedFile.file_content}], examConfig.instructions, true, true);
      const parsed = JSON.parse(result);
      
      parsed.is_full_syllabus = examConfig.isFullSyllabus;

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('exams').insert([{ 
        file_id: selectedFile.id, 
        user_id: user.id, 
        exam_data: parsed, 
        status: 'pending' 
      }]).select('id').single();

      if (error) throw error;

      if (data) {
        toast.success(isEn ? "Exam generated successfully!" : "تم بناء الامتحان بنجاح!");
        navigate(`/exam-room/${data.id}`);
      }
    } catch (e) {
      toast.error(isEn ? "Failed to generate exam, try again." : "فشل بناء الامتحان، حاول مجدداً.");
      setGeneratingExam(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 md:p-12 transition-colors duration-300 pb-24 md:pb-12" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><ChevronRight className="dark:text-white"/></button>
          <h1 className="text-2xl md:text-3xl font-black dark:text-white">مركز الامتحانات</h1>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-blue-200 dark:border-gray-800 rounded-[2rem] p-10 text-center relative cursor-pointer group transition-all hover:border-blue-500">
          {!isUploading && <input type="file" accept=".pdf, image/png, image/jpeg" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
          {isUploading ? (
            <div className="flex flex-col items-center"><Loader2 size={40} className="animate-spin text-blue-600 mb-4" /><h2 className="font-bold dark:text-white mb-2">جاري التجهيز...</h2><p className="text-blue-600 text-sm">{uploadStatus}</p></div>
          ) : (
            <div className="flex flex-col items-center"><UploadCloud size={48} className="text-blue-600 mb-4" /><h2 className="text-xl md:text-2xl font-bold dark:text-white mb-2">ارفع ملف PDF أو صورة للامتحان</h2><p className="text-gray-400 text-sm md:text-base mt-2">الذكاء الاصطناعي سيقرأ النصوص والصور بذكاء.</p></div>
          )}
        </div>

        {loadingFiles ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map(f => (
               <div key={f.id} onClick={() => handleFileClick(f)} className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all flex items-center gap-4 shadow-sm group">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl group-hover:scale-110 transition-transform"><FileText className="text-blue-600" size={24}/></div>
                <h4 className="font-bold dark:text-white truncate">{f.file_name}</h4>
              </div>
            ))}
            {files.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">لا توجد ملفات مرفوعة حالياً.</p>}
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-4xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl border dark:border-gray-800 max-h-[90vh]">
            
            <button onClick={() => setSelectedFile(null)} className="absolute top-4 left-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full z-10 md:hidden">
              <X size={20}/>
            </button>

            <div className="md:w-1/3 bg-gray-50 dark:bg-[#121212] border-b md:border-b-0 md:border-l dark:border-gray-800 p-6 overflow-y-auto max-h-[35vh] md:max-h-full shrink-0">
              <h3 className="font-bold text-lg dark:text-white mb-4 md:mb-6 flex items-center gap-2"><History size={20} className="text-blue-600"/> سجل الاختبارات</h3>
              <div className="space-y-3">
                {pastExams.map(ex => (
                  <div key={ex.id} onClick={() => navigate(`/exam-room/${ex.id}`)} className="bg-white dark:bg-[#1E1E1E] border dark:border-gray-800 p-4 rounded-2xl cursor-pointer hover:border-blue-500 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ex.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ex.status === 'completed' ? 'مكتمل' : 'قيد الحل'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(ex.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    {ex.status === 'completed' && <p className="text-sm font-black dark:text-white">النتيجة: {ex.score} / {ex.total_score}</p>}
                  </div>
                ))}
                {pastExams.length === 0 && <p className="text-sm text-gray-400">لا يوجد سجل لهذا الملف.</p>}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white dark:bg-[#1E1E1E]">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black dark:text-white pr-8 md:pr-0">إعداد اختبار: {selectedFile.file_name}</h2>
                <button onClick={() => setSelectedFile(null)} className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
              </div>

              {generatingExam ? (
                <div className="text-center py-10 md:py-20"><Loader2 size={60} className="animate-spin text-blue-600 mb-4 mx-auto"/><h3 className="text-lg md:text-xl font-bold dark:text-white">جاري بناء الاختبار بذكاء...</h3></div>
              ) : (
                <div className="space-y-6">
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-sm md:text-base text-blue-800 dark:text-blue-300 flex items-center gap-2"><Sparkles size={18}/> امتحان شامل للمنهج</h4>
                      <p className="text-[11px] md:text-sm text-blue-600 dark:text-blue-400 mt-1">يستخرج الـ AI أسئلة لتقييم جميع الأجزاء وإنشاء تقرير بمستواك.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={examConfig.isFullSyllabus} onChange={e => setExamConfig({...examConfig, isFullSyllabus: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className={`transition-all ${examConfig.isFullSyllabus ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2">عدد الأسئلة المخصص:</label>
                    <input type="number" disabled={examConfig.isFullSyllabus} value={examConfig.count} onChange={e => setExamConfig({...examConfig, count: e.target.value})} className="w-full bg-gray-50 dark:bg-[#121212] border-2 dark:border-gray-700 rounded-xl p-3 dark:text-white font-bold outline-none focus:border-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-500 mb-3">نوع الأسئلة:</label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {['mcq', 'tf', 'essay'].map(t => (
                        <label key={t} className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl border-2 cursor-pointer transition-all text-xs md:text-sm font-bold ${examConfig.types[t] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-gray-800 dark:text-white'}`}>
                          <input type="checkbox" checked={examConfig.types[t]} onChange={e => setExamConfig({...examConfig, types: {...examConfig.types, [t]: e.target.checked}})} className="hidden" />
                          <span className="uppercase">{t === 'tf' ? 'صح/خطأ' : t === 'mcq' ? 'اختيارات' : 'مقالي'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2">لغة الاختبار (Exam Language):</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setExamConfig({...examConfig, lang: 'ar'})}
                        className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          examConfig.lang === 'ar' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30' 
                            : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <span>🇸🇦 اللغة العربية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamConfig({...examConfig, lang: 'en'})}
                        className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          examConfig.lang === 'en' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30' 
                            : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <span>🇬🇧 English</span>
                      </button>
                    </div>
                  </div>
                  
                  <button onClick={generateExam} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95">بدء الاختبار الآن</button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}