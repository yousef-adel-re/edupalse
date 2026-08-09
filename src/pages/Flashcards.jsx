// src/pages/ExamCenter.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, MessageCircle, ChevronRight } from 'lucide-react';

export default function ExamCenter() {
  const navigate = useNavigate();
  const [questions] = useState([
    { id: 1, type: 'mcq', text: 'وحدة قياس القوة هي؟', options: ['جول', 'نيوتن', 'واط'], correct: 'نيوتن' },
    { id: 2, type: 'essay', text: 'اشرح باختصار قانون نيوتن الثالث.', correct: 'لكل فعل رد فعل.' }
  ]);

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 دقيقة
  const [activeChatIndex, setActiveChatIndex] = useState(null);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) { if(timeLeft <= 0 && !isSubmitted) setIsSubmitted(true); return; }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in-up">
      
      {/* التايمر والهيدر */}
      <div className="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex justify-between items-center sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><ChevronRight size={20} /></button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">امتحان الفيزياء</h2>
        </div>
        <div className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xl ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'}`}>
          <Clock size={24} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* الأسئلة */}
      {questions.map((q, index) => {
        const isWrong = isSubmitted && q.type === 'mcq' && answers[q.id] !== q.correct;
        return (
          <div key={q.id} className="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center justify-between">
              <span>{index + 1}. {q.text}</span>
              {isSubmitted && q.type === 'mcq' && (answers[q.id] === q.correct ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />)}
            </h3>

            {q.type === 'mcq' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map(opt => (
                  <label key={opt} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name={`q-${q.id}`} value={opt} onChange={() => !isSubmitted && setAnswers({...answers, [q.id]: opt})} className="hidden" />
                    <span className={answers[q.id] === opt ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea readOnly={isSubmitted} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} placeholder="اكتب إجابتك المقالية أو ارفع صورة..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 h-32 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white" />
                {isSubmitted && (
                   <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border-r-4 border-indigo-500 rounded-l-xl">
                     <p className="font-bold text-indigo-700 dark:text-indigo-300">تقييم الـ AI: {answers[q.id]?.length > 10 ? 'ممتاز 9/10' : 'إجابة ضعيفة 3/10'}</p>
                   </div>
                )}
              </div>
            )}

            {/* شات تبرير الإجابة الغلط */}
            {isWrong && (
              <div className="mt-4">
                <button onClick={() => setActiveChatIndex(activeChatIndex === index ? null : index)} className="flex gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg font-bold text-sm">
                  <MessageCircle size={18} /> لماذا إجابتي خاطئة؟
                </button>
                {activeChatIndex === index && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200">
                    إجابتك خاطئة لأن "{answers[q.id]}" لا يعبر عن القوة. الإجابة الدقيقة حسب المنهج هي "{q.correct}".
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!isSubmitted && (
        <button onClick={() => setIsSubmitted(true)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors">تسليم الامتحان</button>
      )}
    </div>
  );
}