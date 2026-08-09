// src/pages/ExamCenter.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, MessageCircle, AlertCircle, Award, ChevronRight, Send } from 'lucide-react';

export default function ExamCenter() {
  const navigate = useNavigate();
  
  // بيانات الامتحان الوهمية (تولد بواسطة الذكاء الاصطناعي لاحقاً)
  const [questions] = useState([
    {
      id: 1,
      type: 'mcq',
      text: 'ما هي وحدة قياس القوة في النظام الدولي؟',
      options:['نيوتن', 'جول', 'باسكال', 'واط'],
      correctAnswer: 'نيوتن'
    },
    {
      id: 2,
      type: 'tf',
      text: 'السرعة هي كمية فيزيائية متجهة.',
      options: ['صح', 'خطأ'],
      correctAnswer: 'صح'
    },
    {
      id: 3,
      type: 'essay',
      text: 'اشرح باختصار قانون نيوتن الثالث مع ذكر مثال من الحياة اليومية.',
      correctAnswer: 'ينص على أن لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه.' // يستخدم للمرجعية في تصحيح الـ AI
    }
  ]);

  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 دقيقة
  const [score, setScore] = useState(0);
  const[essayFeedback, setEssayFeedback] = useState('');
  const [activeChatIndex, setActiveChatIndex] = useState(null); // للتحكم في الشات المنبثق

  // التايمر
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) handleSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  // تنسيق الوقت
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionChange = (questionId, val) => {
    if (!isSubmitted) setAnswers({ ...answers,[questionId]: val });
  };

  const handleSubmit = () => {
    let currentScore = 0;
    // تصحيح الـ MCQ والـ T/F
    questions.forEach(q => {
      if (q.type !== 'essay' && answers[q.id] === q.correctAnswer) {
        currentScore += 1;
      }
    });
    
    // محاكاة تصحيح الذكاء الاصطناعي للمقالي
    const essayAns = answers[3] || '';
    if (essayAns.length > 20) {
      currentScore += 1; // أخذ درجة المقالي
      setEssayFeedback('ممتاز 10/10: إجابة دقيقة، ذكرت القانون بشكل صحيح وقدمت مثالاً جيداً.');
    } else {
      setEssayFeedback('ضعيف 3/10: الإجابة مختصرة جداً ولم تذكر مثالاً واضحاً من الحياة اليومية.');
    }

    setScore(currentScore);
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      
      {/* الهيدر والتايمر */}
      <div className="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition-colors">
            <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">امتحان: فيزياء الفصل الأول</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">الذكاء الاصطناعي يراقب إجاباتك لتحديد نقاط ضعفك</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xl border-2 shadow-inner ${timeLeft < 180 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}>
          <Clock size={24} className={timeLeft < 180 ? 'animate-pulse' : ''} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* منطقة النتيجة (تظهر فقط بعد التسليم) */}
      {isSubmitted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-8 rounded-2xl text-center shadow-sm">
          <Award size={64} className="mx-auto text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">انتهى الامتحان</h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
            نتيجتك هي: <span className="font-extrabold text-blue-600 dark:text-blue-400">{score}</span> من {questions.length}
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/')} className="bg-white dark:bg-darkCard text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">عودة للرئيسية</button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">امتحان لعلاج الأخطاء</button>
          </div>
        </div>
      )}

      {/* الأسئلة */}
      <div className="space-y-6 pb-20">
        {questions.map((q, index) => {
          const userAnswer = answers[q.id];
          const isCorrect = isSubmitted && q.type !== 'essay' && userAnswer === q.correctAnswer;
          const isWrong = isSubmitted && q.type !== 'essay' && userAnswer && userAnswer !== q.correctAnswer;
          const isSkipped = isSubmitted && q.type !== 'essay' && !userAnswer;

          return (
            <div key={q.id} className={`bg-white dark:bg-darkCard rounded-2xl shadow-sm border p-6 transition-all ${
              isCorrect ? 'border-green-400 dark:border-green-600 bg-green-50/30 dark:bg-green-900/10' : 
              isWrong ? 'border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10' : 
              'border-gray-200 dark:border-gray-800'
            }`}>
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex gap-2">
                  <span className="bg-gray-100 dark:bg-gray-800 w-8 h-8 flex items-center justify-center rounded-lg text-sm text-blue-600 dark:text-blue-400">{index + 1}</span>
                  {q.text}
                </h3>
                
                {/* علامة الصح والغلط بعد التسليم */}
                {isSubmitted && q.type !== 'essay' && (
                  <div className="flex-shrink-0">
                    {isCorrect && <CheckCircle className="text-green-500" size={28} />}
                    {isWrong && <XCircle className="text-red-500" size={28} />}
                    {isSkipped && <AlertCircle className="text-yellow-500" size={28} />}
                  </div>
                )}
              </div>

              {/* الاختيارات */}
              {q.type !== 'essay' ? (
                <div className={`grid gap-3 ${q.type === 'tf' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {q.options.map(opt => {
                    let optionClass = "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 text-gray-700 dark:text-gray-300";
                    if (userAnswer === opt) optionClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold";
                    
                    // تلوين الإجابات بعد التسليم
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) {
                        optionClass = "border-green-500 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 font-bold"; // الإجابة الصحيحة دائماً خضراء
                      } else if (userAnswer === opt && opt !== q.correctAnswer) {
                        optionClass = "border-red-500 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 strike-through"; // إجابة الطالب الخاطئة حمراء
                      } else {
                        optionClass = "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 opacity-50"; // باقي الاختيارات
                      }
                    }

                    return (
                      <label key={opt} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${optionClass} ${isSubmitted ? 'pointer-events-none' : ''}`}>
                        <input type="radio" name={`question-${q.id}`} value={opt} checked={userAnswer === opt} onChange={() => handleOptionChange(q.id, opt)} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userAnswer === opt ? 'border-blue-500' : 'border-gray-400'}`}>
                           {userAnswer === opt && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                        </div>
                        {opt}
                      </label>
                    );
                  })}
                </div>
              ) : (
                // المقالي
                <div className="space-y-4">
                  <textarea
                    readOnly={isSubmitted}
                    placeholder="اكتب إجابتك هنا أو ارفع صورة لها..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleOptionChange(q.id, e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-0 resize-none h-32 transition-colors read-only:opacity-70"
                  />
                  {isSubmitted && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                      <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1">تقييم الذكاء الاصطناعي (AI Grader):</h4>
                      <p className="text-indigo-900 dark:text-indigo-200 text-sm leading-relaxed">{essayFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* زر الشات المنبثق لتبرير الإجابة الغلط */}
              {isWrong && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button 
                    onClick={() => setActiveChatIndex(activeChatIndex === index ? null : index)}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle size={20} />
                    لماذا إجابتي خاطئة؟ (شرح الذكاء الاصطناعي)
                  </button>

                  {/* الشات المنبثق نفسه */}
                  {activeChatIndex === index && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex gap-3 items-start mb-4">
                        <div className="bg-blue-600 text-white p-2 rounded-lg"><MessageCircle size={18} /></div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl rounded-tr-none text-gray-800 dark:text-gray-200 text-sm w-full">
                          <p>إجابتك "{userAnswer}" خاطئة لأن وحدة {userAnswer} تُستخدم لقياس الشغل وليس القوة. الإجابة الصحيحة هي <strong>{q.correctAnswer}</strong> حسب النظام الدولي. هل تحتاج لأمثلة أخرى؟</p>
                        </div>
                      </div>
                      <div className="flex gap-2 relative">
                        <input type="text" placeholder="اكتب سؤالك هنا..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        <button className="absolute left-2 top-1.5 text-blue-600 hover:text-blue-700"><Send size={18}/></button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* زر التسليم */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 z-50">
          <div className="max-w-4xl mx-auto flex justify-end">
            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-10 py-3 rounded-xl shadow-lg transition-transform hover:scale-105">
              تسليم الامتحان
            </button>
          </div>
        </div>
      )}

    </div>
  );
}