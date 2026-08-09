// src/pages/StudySection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast'; // الإشعارات
import { supabase } from '../lib/supabase';
import { callAzureAI, extractTextWithVisionModel } from '../lib/ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function StudySection() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const[uploadStatus, setUploadStatus] = useState('');

  useEffect(() => { fetchFiles(); },[]);

  const fetchFiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_files').select('*').order('created_at', { ascending: false });
    if (data) setFiles(data);
    setLoadingFiles(false);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const extractTextLocally = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
    }
    return fullText.trim();
  };

  // الحل الجذري هنا لمشكلة getOrInsertComputed
  const convertPdfToImages = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    // تمرير إعدادات إضافية لتفادي أخطاء الـ Worker
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableFontFace: true }).promise;
    let base64Images =[];
    
    const maxPages = Math.min(pdf.numPages, 5); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        // هذه الخاصية تمنع بعض أخطاء التوافقية
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
        setUploadStatus('جاري إرسال الصورة للنموذج لقراءتها...');
        const base64Img = await fileToBase64(file);
        extractedText = await extractTextWithVisionModel([base64Img]);
      } 
      else if (file.type === 'application/pdf') {
        setUploadStatus('جاري قراءة ملف الـ PDF...');
        extractedText = await extractTextLocally(file);

        if (extractedText.length < 50) {
            setUploadStatus('الملف عبارة عن صور.. جاري القراءة بذكاء (OCR)...');
            const pdfImages = await convertPdfToImages(file);
            extractedText = await extractTextWithVisionModel(pdfImages);
        }
      } else {
        toast.error("يرجى رفع ملفات PDF أو صور فقط.");
        setIsUploading(false); return;
      }

      if (!extractedText || extractedText.length < 10) {
        toast.error("فشل النموذج في قراءة الملف، تأكد من جودة الصورة.");
        setIsUploading(false); return;
      }

      setUploadStatus('تحديد اسم للملف...');
      const systemPrompt = "استنتج اسماً قصيراً ومعبراً (لا يتجاوز 4 كلمات) للملف.";
      let aiGeneratedName = await callAzureAI(systemPrompt,[{role:'user', content: extractedText.substring(0, 1000)}], "", false);
      aiGeneratedName = aiGeneratedName.replace(/["']/g, '');

      setUploadStatus('جاري الحفظ في مساحتك...');
      const { data, error } = await supabase
        .from('user_files')
        .insert([{ user_id: user.id, file_name: aiGeneratedName, file_content: extractedText }])
        .select().single();

      if (error) throw error;

      setFiles([data, ...files]);
      toast.success("تم رفع الملف بنجاح!");
      navigate('/study-room', { state: { fileData: data } });

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("حدث خطأ أثناء رفع وتحليل الملف.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      e.target.value = ''; // تصفير الملف المرفوع
    }
  };

  const handleDeleteFile = async (id, e) => {
    e.stopPropagation();
    await supabase.from('user_files').delete().eq('id', id);
    setFiles(files.filter(f => f.id !== id));
    toast.success("تم الحذف.");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-6 md:p-12 font-sans transition-colors duration-300 pb-24 md:pb-12" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300">
            <ChevronRight size={24} className="dark:text-white" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white">قسم المذاكرة الذكية</h1>
        </div>

        <div className={`bg-white dark:bg-[#1E1E1E] border-2 border-dashed ${isUploading ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-blue-300 dark:border-gray-700 hover:border-blue-500'} rounded-3xl p-8 md:p-12 text-center transition-all relative cursor-pointer group`}>
          {!isUploading && (
            <input type="file" accept=".pdf, image/png, image/jpeg, image/jpg" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          )}
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
              <h2 className="text-lg md:text-xl font-bold dark:text-white mb-2">الرجاء الانتظار...</h2>
              <p className="text-blue-600 font-medium text-sm md:text-base">{uploadStatus}</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-gray-800 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} className="text-blue-600 md:w-10 md:h-10" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold dark:text-white mb-2">ارفع ملف PDF أو صورة</h2>
              <p className="text-gray-500 text-sm md:text-base">سيقوم النموذج بنفسه بقراءة أي نصوص داخل الصور أو المذكرات.</p>
            </>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 dark:text-white">الملفات السابقة</h3>
          {loadingFiles ? (
            <div className="flex gap-2 text-gray-500"><Loader2 className="animate-spin" size={20} /> جاري الجلب...</div>
          ) : files.length === 0 ? (
            <p className="text-gray-500 bg-white dark:bg-[#1E1E1E] p-8 text-center rounded-2xl">لا يوجد ملفات.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <div key={file.id} onClick={() => navigate('/study-room', { state: { fileData: file } })} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between cursor-pointer hover:shadow-md">
                  <div className="flex items-center gap-4 truncate">
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg shrink-0"><FileText className="text-red-500" size={20} /></div>
                    <div className="truncate pr-1">
                      <h4 className="font-bold dark:text-white truncate text-sm md:text-base">{file.file_name}</h4>
                    </div>
                  </div>
                  <button onClick={(e) => handleDeleteFile(file.id, e)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}