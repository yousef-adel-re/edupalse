// src/pages/ExamRoom.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, MessageCircle, ChevronRight, Send, 
  Loader2, Award, Zap, X, Camera, BrainCircuit, BookMarked, Maximize2, Minimize2, Printer, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { supabase } from '../lib/supabase';
import { callAzureAI, detectTextDirection, extractTextWithVisionModel } from '../lib/ai';
import { getExamLocally, saveExamLocally, savePendingExamResult } from '../lib/offlineDb';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { formatMathExpressions } from '../lib/mathUtils';

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  const [isProctored, setIsProctored] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [essayEvaluations, setEssayEvaluations] = useState({}); 
  const [finalAnalysisReport, setFinalAnalysisReport] = useState('');

  const [activeChatQuestion, setActiveChatQuestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState(null);

  useEffect(() => {
    if (examId && examId !== "undefined") fetchExamData();
    else navigate('/exams');
  }, [examId]);

  useEffect(() => {
    if (!isSubmitted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted && exam) {
      handleSubmit(); 
    }
  }, [timeLeft, isSubmitted, exam]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (isProctored && !document.fullscreenElement && !isSubmitted) {
        setFullscreenWarning(true);
        toast.error("تنبيه: خرجت من وضع محاكاة الامتحان!");
      } else if (document.fullscreenElement) {
        setFullscreenWarning(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isProctored, isSubmitted]);

  const toggleProctoredMode = () => {
    if (!isProctored) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsProctored(true);
      toast.success("تم تفعيل وضع المحاكاة والتركيز الصارم!");
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsProctored(false);
    }
  };

  const exportPrintablePDF = () => {
    const element = document.getElementById('printable-exam-area');
    if (!element) return;
    toast.success("جاري إعداد ملف الـ PDF للطباعة...");
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Exam_${exam?.user_files?.file_name || 'EduPulse'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const fetchExamData = async () => {
    try {
      if (!navigator.onLine) {
        const localExam = await getExamLocally(examId);
        if (localExam) {
          setExam(localExam);
          const qs = localExam.exam_data.questions || [];
          setQuestions(qs);
          setTotalScore(qs.length);
          if (localExam.status === 'completed') {
            setAnswers(localExam.user_answers || {});
            setScore(localExam.score || 0);
            setEssayEvaluations(localExam.ai_feedback || {});
            setFinalAnalysisReport(localExam.final_analysis || '');
            setIsSubmitted(true);
          } else {
            setTimeLeft(localExam.exam_data.timer_seconds || 1800);
          }
          return;
        }
      }

      const { data } = await supabase.from('exams').select('*, user_files(file_name, file_content)').eq('id', examId).maybeSingle();
      if (data) {
        setExam(data);
        saveExamLocally(data);
        const qs = data.exam_data.questions || [];
        setQuestions(qs);
        setTotalScore(qs.length);
        
        if (data.status === 'completed') {
          setAnswers(data.user_answers || {});
          setScore(data.score || 0);
          setEssayEvaluations(data.ai_feedback || {}); 
          setFinalAnalysisReport(data.final_analysis || '');
          setIsSubmitted(true);
        } else {
          setTimeLeft(data.exam_data.timer_seconds || 1800);
        }
      }
    } catch (err) {
      console.error(err);
      const localExam = await getExamLocally(examId);
      if (localExam) {
        setExam(localExam);
        const qs = localExam.exam_data.questions || [];
        setQuestions(qs);
        setTotalScore(qs.length);
        setIsSubmitted(localExam.status === 'completed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qId]: option });
  };

  const fileToBase64 = (file) => new Promise((res) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
  });

  const handleEssayImageUpload = async (qId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('يرجى رفع صورة صالحة.');
      return;
    }
    setUploadingImageId(qId);
    try {
      const base64Img = await fileToBase64(file);
      const extractedText = await extractTextWithVisionModel([base64Img]);
      if (extractedText) {
        const currentAnswer = answers[qId] || '';
        const newAnswer = currentAnswer ? `${currentAnswer}\n\n${extractedText}` : extractedText;
        setAnswers(prev => ({ ...prev, [qId]: newAnswer }));
      } else {
        alert("لم يتمكن الذكاء الاصطناعي من قراءة خط اليد في هذه الصورة.");
      }
    } catch (err) {
      alert("حدث خطأ أثناء قراءة الصورة.");
    } finally {
      setUploadingImageId(null);
      e.target.value = ''; 
    }
  };

  const handleSubmit = async () => {
    setGrading(true);
    let currentScore = 0;
    const evaluations = {};

    try {
      // 1. تصحيح الأسئلة وحساب النتيجة
      for (const q of questions) {
        if (q.type !== 'essay') {
          if (answers[q.id] === q.correctAnswer) currentScore++;
        } else {
          const systemPrompt = `أنت دكتور جامعي صارم جداً. صحح إجابة الطالب. ابدأ بـ "الدرجة: X/10" ثم اذكر الأخطاء بدقة.`;
          const userPrompt = `السؤال: ${q.text}\nإجابة الطالب: ${answers[q.id] || 'لم يجب'}\nالإجابة النموذجية: ${q.correctAnswer}`;
          const evaluation = await callAzureAI(systemPrompt,[{role: 'user', content: userPrompt}], "", true);
          evaluations[q.id] = evaluation;
          const match = evaluation.match(/(\d+)\/10/);
          if (match && parseInt(match[1]) >= 5) currentScore++; 
        }
      }

      // 2. بناء التقرير فقط إذا كان الامتحان "شامل للمنهج"
      let aiAnalysis = '';
      if (questions.length > 0 && exam?.exam_data?.is_full_syllabus === true) {
        const analysisSystemPrompt = `أنت الآن مستشار أكاديمي تحلل أداء طالب في امتحان لتقييم مستواه العام.
        إليك الأسئلة وإجابات الطالب. 
        بناءً على الأخطاء والصح، اكتب تقريراً بصيغة Markdown يحتوي على:
        - 🟢 نقاط القوة (الأجزاء التي يبدو أن الطالب أتقنها).
        - 🔴 نقاط الضعف (الأجزاء والمواضيع التي أخطأ فيها وتحتاج لإعادة مذاكرة).
        - 💡 خطة تركيز سريعة (نصيحة لما يجب فعله الآن).
        
        اجعل التقرير ودوداً ومحفزاً ومقسماً وواضحاً جداً.`;

        const studentData = questions.map(q => 
          `السؤال: ${q.text}\nإجابة الطالب كانت: ${answers[q.id] === q.correctAnswer ? 'صحيحة' : 'خاطئة (يحتاج لتقوية هنا)'}`
        ).join('\n\n');

        aiAnalysis = await callAzureAI(analysisSystemPrompt, [{role: 'user', content: studentData}], "", false);
        setFinalAnalysisReport(aiAnalysis);
      }

      // 3. الحفظ (أوفلاين أو أونلاين)
      if (!navigator.onLine) {
        await savePendingExamResult({
          id: examId,
          user_answers: answers,
          score: currentScore,
          total_score: questions.length,
          ai_feedback: evaluations,
          final_analysis: aiAnalysis,
          status: 'completed',
          updated_at: new Date().toISOString()
        });
        toast.success("تم حفظ النتيجة محلياً (أوفلاين). ستتزامن تلقائياً عند عودة الاتصال.");
      } else {
        const { error } = await supabase.from('exams').update({ 
          status: 'completed', 
          user_answers: answers, 
          score: currentScore, 
          total_score: questions.length, 
          ai_feedback: evaluations,
          final_analysis: aiAnalysis
        }).eq('id', examId);

        if (error) {
          alert("حدث خطأ أثناء حفظ النتيجة.");
          setGrading(false); return; 
        }
      }

      setScore(currentScore);
      setEssayEvaluations(evaluations);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      alert("حدث خطأ غير متوقع أثناء التصحيح.");
    } finally {
      setGrading(false);
    }
  };

  const openJustificationChat = async (q) => {
    setActiveChatQuestion(q);
    const explanationText = q.explanation ? `\n\nشرح مبدئي من النموذج: ${q.explanation}` : '';
    setChatMessages([{ 
      role: 'assistant', 
      content: `أهلاً بك! إجابتك "${answers[q.id] || 'فارغة'}" للأسف خاطئة، الإجابة الصحيحة هي: **${q.correctAnswer}**. ${explanationText}\n\nاسألني وسأقوم بشرح السبب لك بالتفصيل.` 
    }]);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const newMsgs =[...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMsgs); setChatInput(''); setChatLoading(true);

    const q = activeChatQuestion;
    const contextualSystemPrompt = `أنت أستاذ ومعلم خبير جداً وصبور.
    نص السؤال: "${q.text}"
    الإجابة الصحيحة: "${q.correctAnswer}"
    إجابة الطالب الخاطئة: "${answers[q.id] || 'لم يجب'}"
    
    اشرح له سبب الخطأ بأسلوب علمي ومبسط.`;

    const response = await callAzureAI(contextualSystemPrompt, newMsgs, "", false);
    setChatMessages([...newMsgs, { role: 'assistant', content: response }]);
    setChatLoading(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-[#121212]"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-20 font-sans transition-colors" dir="rtl">
      
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-wrap justify-between items-center px-6 gap-3">
        <button onClick={() => navigate('/exams')} className="text-gray-500 font-bold hover:text-blue-600 flex items-center gap-1 transition-colors"><ChevronRight size={20}/> خروج</button>
        
        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono text-xl md:text-2xl font-bold border-2 ${timeLeft < 300 ? 'text-red-600 border-red-200 animate-pulse bg-red-50' : 'text-blue-600 border-blue-100 dark:border-gray-700'}`}>
              <Clock size={22}/> {formatTime(timeLeft)}
            </div>
          ) : (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-xl font-bold flex items-center gap-2 border border-green-200 dark:border-green-800 text-sm">
              <Award size={18}/> تم التصحيح
            </div>
          )}

          <button 
            onClick={toggleProctoredMode} 
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 border transition-all ${isProctored ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-purple-400'}`}
            title="وضع المحاكاة ملء الشاشة لمنع التشتت"
          >
            {isProctored ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
            <span className="hidden sm:inline">{isProctored ? 'إنهاء المحاكاة' : 'وضع المحاكاة'}</span>
          </button>

          <button 
            onClick={exportPrintablePDF} 
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all"
            title="تصدير كـ PDF جاهز للطباعة"
          >
            <Printer size={16}/>
            <span className="hidden sm:inline">طباعة PDF</span>
          </button>
        </div>

        <h2 className="dark:text-white font-black truncate max-w-[200px]">{exam?.user_files?.file_name}</h2>
      </div>

      {fullscreenWarning && !isSubmitted && (
        <div className="bg-red-500 text-white px-6 py-3 text-center font-bold text-sm md:text-base flex items-center justify-center gap-2 sticky top-16 z-40 shadow-lg animate-bounce">
          <ShieldAlert size={20}/> تنبيه صارم: خرجت من الشاشة الكاملة لوضع المحاكاة! الرجاء التركيز في الامتحان.
        </div>
      )}

      <div id="printable-exam-area" className="max-w-4xl mx-auto p-4 mt-6 space-y-8">
        
        {isSubmitted && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-blue-500 rounded-[2rem] p-10 text-center shadow-2xl">
              <h2 className="text-3xl font-black dark:text-white">النتيجة النهائية للاختبار</h2>
              <div className="text-7xl font-black text-blue-600 my-6">{score} <span className="text-3xl text-gray-400">/ {totalScore}</span></div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-5 border dark:border-gray-700 overflow-hidden">
                 <div className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${(score/totalScore)*100}%` }}></div>
              </div>
            </div>

            {/* تقرير الذكاء الاصطناعي (يظهر فقط إذا كان الامتحان شامل) */}
            {exam?.exam_data?.is_full_syllabus && finalAnalysisReport && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl"><BrainCircuit size={28}/></div>
                  <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-300">تحليل الذكاء الاصطناعي لمستواك الشامل</h3>
                </div>
                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 font-medium leading-relaxed" dir={detectTextDirection(finalAnalysisReport)}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMathExpressions(finalAnalysisReport)}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-8">
          {questions.map((q, idx) => {
            const isCorrect = isSubmitted && q.type !== 'essay' && answers[q.id] === q.correctAnswer;
            const isWrong = isSubmitted && q.type !== 'essay' && answers[q.id] && answers[q.id] !== q.correctAnswer;
            const currentOptions = (q.options && q.options.length > 0) ? q.options : (q.type === 'tf' ? ['صح', 'خطأ'] :[]);

            return (
              <div key={q.id} className={`bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-8 border-2 transition-all duration-500 ${isCorrect ? 'border-green-500 shadow-green-50/20' : isWrong ? 'border-red-500 shadow-red-50/20' : 'border-transparent shadow-xl dark:border-gray-800'}`}>
                <div className="flex gap-4 mb-8">
                  <span className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-2xl font-black shadow-lg flex-shrink-0">{idx + 1}</span>
                  <div className="text-xl md:text-2xl font-bold dark:text-white leading-relaxed prose dark:prose-invert max-w-none" dir={detectTextDirection(q.text)}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {formatMathExpressions(q.text)}
                    </ReactMarkdown>
                  </div>
                </div>

                {q.type !== 'essay' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentOptions.map(opt => {
                      let btnStyle = "border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:text-white bg-gray-50 dark:bg-[#121212]";
                      if (answers[q.id] === opt) btnStyle = "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white ring-2 ring-blue-500/50";
                      
                      if (isSubmitted) {
                        if (opt === q.correctAnswer) btnStyle = "border-green-500 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-black";
                        else if (answers[q.id] === opt) btnStyle = "border-red-500 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300";
                        else btnStyle = "border-gray-50 dark:border-gray-800 text-gray-400 opacity-40";
                      }

                      return (
                        <button key={opt} onClick={() => handleOptionSelect(q.id, opt)} className={`p-5 rounded-2xl border-2 text-right transition-all flex justify-between items-center ${btnStyle}`}>
                          <div className="prose dark:prose-invert text-right inline-block text-sm md:text-base font-bold">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {formatMathExpressions(opt)}
                            </ReactMarkdown>
                          </div>
                          {isSubmitted && opt === q.correctAnswer && <CheckCircle size={20} className="text-green-500" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!isSubmitted ? (
                      <>
                        <div className="relative">
                          <textarea 
                            disabled={uploadingImageId === q.id} 
                            value={answers[q.id] || ''} 
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} 
                            dir={detectTextDirection(answers[q.id] || 'أ')} 
                            placeholder="اكتب إجابتك هنا، أو استخدم زر رفع الصورة بالأسفل..." 
                            className={`w-full h-52 bg-gray-50 dark:bg-[#121212] border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-6 pb-14 dark:text-white outline-none focus:border-blue-500 transition-all font-medium leading-relaxed resize-none shadow-inner ${uploadingImageId === q.id ? 'opacity-70' : ''}`} 
                          />
                          <div className="absolute bottom-4 right-4 z-10">
                            {uploadingImageId === q.id ? (
                              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-xl font-bold text-sm">
                                <Loader2 className="animate-spin" size={16} /> جاري قراءة خط اليد...
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm">
                                <Camera size={18} /> تصوير الإجابة
                                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleEssayImageUpload(q.id, e)} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* المعاينة الفورية لتنسيق المعادلة أثناء الكتابة أو التصوير */}
                        {answers[q.id] && answers[q.id].trim().length > 0 && (
                          <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl">
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                              <span>✨ معاينة منسقة للإجابة والمعادلات (Live Math Preview):</span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed text-gray-900 dark:text-gray-100">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {formatMathExpressions(answers[q.id])}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* عرض الإجابة المقدمة بـ KaTeX منسق بعد التسليم */
                      <div className="p-6 bg-gray-50 dark:bg-[#121212] border-2 border-gray-100 dark:border-gray-800 rounded-2xl">
                        <div className="text-xs font-bold text-gray-400 mb-2">إجابتك المرفوعة:</div>
                        <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed dark:text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {formatMathExpressions(answers[q.id] || 'لم يتم تقديم إجابة.')}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {isSubmitted && essayEvaluations[q.id] && (
                      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-r-4 border-indigo-500 rounded-l-3xl shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300 font-black"><Zap size={20} className="fill-indigo-500" /> تقييم المصحح الجامعي:</div>
                        <div className="prose dark:prose-invert text-sm md:text-base leading-relaxed" dir={detectTextDirection(essayEvaluations[q.id])}>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMathExpressions(essayEvaluations[q.id])}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ربط الإجابات الخاطئة بالمرجع في المستند الأصلي (Remediation Link) */}
                {isWrong && q.source_excerpt && (
                  <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-950/40 border-r-4 border-amber-500 rounded-l-2xl shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                      <BookMarked size={20} className="text-amber-600"/> 📌 المرجع المباشر من المستند الأصلي (Remediation Link):
                    </div>
                    <p className="text-sm md:text-base leading-relaxed text-amber-950 dark:text-amber-100 font-medium italic">
                      "{q.source_excerpt}"
                    </p>
                  </div>
                )}

                {isWrong && (
                  <button onClick={() => openJustificationChat(q)} className="mt-8 flex items-center gap-2 text-blue-600 font-black bg-blue-50 dark:bg-blue-900/40 px-6 py-3 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-sm">
                    <MessageCircle size={20}/> لماذا إجابتي خاطئة؟
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isSubmitted && (
          <button onClick={handleSubmit} disabled={grading || uploadingImageId !== null} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl py-8 rounded-[2rem] shadow-2xl disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-4">
            {grading ? <><Loader2 className="animate-spin" size={30}/> جاري التصحيح وكتابة التقرير (قد يستغرق بعض الوقت)...</> : "إنهاء وتسليم الاختبار"}
          </button>
        )}
      </div>

      {activeChatQuestion && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E1E1E] h-full shadow-2xl flex flex-col animate-slide-left">
            <header className="p-8 border-b dark:border-gray-800 flex justify-between items-center bg-blue-600 text-white">
              <div><h3 className="font-black text-xl">مساعد تصحيح الأخطاء</h3><p className="text-sm opacity-80 mt-1 font-medium">مناقشة السؤال رقم {activeChatQuestion.id}</p></div>
              <button onClick={() => setActiveChatQuestion(null)} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors"><X size={24}/></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50 dark:bg-[#121212]">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[90%] p-5 rounded-[1.5rem] shadow-md ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#1E1E1E] dark:text-white border dark:border-gray-800 rounded-tl-none font-medium'}`}>
                    <div className="prose dark:prose-invert text-sm leading-relaxed" dir={detectTextDirection(m.content)}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMathExpressions(m.content)}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-end"><Loader2 className="animate-spin text-blue-500" size={30}/></div>}
            </div>
            <div className="p-6 border-t dark:border-gray-800 bg-white dark:bg-[#1E1E1E]">
              <div className="flex gap-3 bg-gray-100 dark:bg-[#121212] p-3 rounded-[1.5rem] border dark:border-gray-700 shadow-inner">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSend()} placeholder="اسأل لماذا..." className="flex-1 bg-transparent border-none outline-none dark:text-white px-3 font-medium" />
                <button onClick={handleChatSend} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all"><Send size={20}/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}