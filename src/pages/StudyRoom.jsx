// src/pages/StudyRoom.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Send, Layers, FileOutput, Loader2, Baby, SlidersHorizontal, X, Plus, Trash2, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { callAzureAI, detectTextDirection } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { formatMathExpressions } from '../lib/mathUtils';

export default function StudyRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileData = location.state?.fileData;
  const fileName = fileData?.file_name || 'ملف';
  const fileContent = fileData?.file_content || '';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [instructionsList, setInstructionsList] = useState([]);
  const [newInstruction, setNewInstruction] = useState('');

  const [mindMap, setMindMap] = useState([]);
  const [loadingMindMap, setLoadingMindMap] = useState(true);
  
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardCount, setCardCount] = useState(5);

  useEffect(() => {
    if (fileData) {
      fetchChatHistory();
      loadInstructions();
      generateMindMap();
    }
  }, [fileData]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isTyping]);

  const loadInstructions = () => {
    const saved = localStorage.getItem(`instructions_${fileData.id}`);
    if (saved) setInstructionsList(JSON.parse(saved));
  };

  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;
    const updated = [...instructionsList, newInstruction.trim()];
    setInstructionsList(updated);
    localStorage.setItem(`instructions_${fileData.id}`, JSON.stringify(updated));
    setNewInstruction('');
  };

  const handleRemoveInstruction = (index) => {
    const updated = instructionsList.filter((_, i) => i !== index);
    setInstructionsList(updated);
    localStorage.setItem(`instructions_${fileData.id}`, JSON.stringify(updated));
  };

  // دالة الحماية ضد انهيار React بسبب الـ Objects
  const safeText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    // لو الـ AI بعت كائن بالخطأ، نصطاد النص منه
    return val.topic || val.name || val.title || val.text || JSON.stringify(val);
  };

  const generateMindMap = async () => {
    // 1. التحقق أولاً من وجود الخريطة الذهنية في كائن الملف نفسه
    if (fileData?.mindmap_data && Array.isArray(fileData.mindmap_data) && fileData.mindmap_data.length > 0) {
      setMindMap(fileData.mindmap_data);
      setLoadingMindMap(false);
      return;
    }

    // 2. التحقق من التخزين المحلي (LocalStorage)
    const savedMap = localStorage.getItem(`mindmap_${fileData?.id}`);
    if (savedMap) {
      try {
        const parsed = JSON.parse(savedMap);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMindMap(parsed);
          setLoadingMindMap(false);
          return;
        }
      } catch (e) {}
    }

    // 3. التحقق مباشرة من قواعد بيانات Supabase
    if (fileData?.id) {
      const { data } = await supabase.from('user_files').select('mindmap_data').eq('id', fileData.id).single();
      if (data?.mindmap_data && Array.isArray(data.mindmap_data) && data.mindmap_data.length > 0) {
        setMindMap(data.mindmap_data);
        localStorage.setItem(`mindmap_${fileData.id}`, JSON.stringify(data.mindmap_data));
        setLoadingMindMap(false);
        return;
      }
    }

    // 4. في حالة عدم وجود خريطة سابقة فقط، يتم استدعاء الذكاء الاصطناعي لتوليدها مرة واحدة وحفظها دائمياً
    setLoadingMindMap(true);
    const systemPrompt = `أنت خبير تعليمي. استخرج المفاهيم الرئيسية والفرعية لبناء خريطة ذهنية.
    مهم جداً: أعد الرد بصيغة JSON حصراً، ويجب أن تتبع هذا الهيكل بدقة:
    {
      "mindmap": [
        {
          "topic": "اسم المفهوم هنا ويجب أن يكون نص (String)",
          "subtopics": ["عنصر 1 كنص", "عنصر 2 كنص"]
        }
      ]
    }
    يمنع منعاً باتاً وضع كائنات (Objects) بداخل المصفوفة، استخدم النصوص (Strings) فقط.`;

    try {
      const resultString = await callAzureAI(systemPrompt, [{role: 'user', content: fileContent}], "", true, true);
      const data = JSON.parse(resultString);
      
      if (data.mindmap && Array.isArray(data.mindmap)) {
        setMindMap(data.mindmap);
        localStorage.setItem(`mindmap_${fileData.id}`, JSON.stringify(data.mindmap));
        if (fileData?.id) {
          await supabase.from('user_files').update({ mindmap_data: data.mindmap }).eq('id', fileData.id);
        }
      } else {
         throw new Error("Invalid format");
      }
    } catch (e) {
      console.error("فشل الخريطة الذهنية بسبب تنسيق خاطئ", e);
      setMindMap([{ topic: "المفاهيم الرئيسية", subtopics: ["تعذر البناء الآلي للتقسيمات، يمكنك السؤال عن المنهج عامة."] }]);
    }
    setLoadingMindMap(false);
  };

  const fetchChatHistory = async () => {
    const { data } = await supabase.from('chat_history').select('*').eq('file_id', fileData.id).order('created_at', { ascending: true });
    if (data && data.length > 0) {
      setMessages(data);
    } else {
      setMessages([{ role: 'assistant', content: `أهلاً بك! تم تحميل "${fileName}". اضغط على أي جزء في الخريطة الذهنية لشرحه، أو اسألني مباشرة.` }]);
    }
  };

  const handleSendChat = async (isELI5 = false, overrideText = null) => {
    let userText = overrideText || input;
    if (isELI5) {
      const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant')?.content;
      userText = `اشرح هذه النقطة كأنني طفل بأسلوب مبسط جداً:\n\n"${lastAiMessage}"`;
    } else if (!userText.trim()) return;
    
    const uiMessages = [...messages, { role: 'user', content: userText }];
    setMessages(uiMessages);
    if(!overrideText) setInput('');
    setIsTyping(true);
    await supabase.from('chat_history').insert([{ file_id: fileData.id, role: 'user', content: userText }]);

    let apiUserText = userText;
    if (instructionsList.length > 0) {
      const rules = instructionsList.map((r, i) => `${i + 1}- ${r}`).join('\n');
      apiUserText += `\n\n---\n[توجيه صارم للنظام: التزم بالتالي:\n${rules}]`;
    }

    const apiMessagesHistory = [...messages, { role: 'user', content: apiUserText }];
    const systemPrompt = `أنت مساعد دراسي. أجب حصراً من محتوى هذا الملف:\n\n${fileContent}`;
    
    const responseText = await callAzureAI(systemPrompt, apiMessagesHistory, "", false, false);
    
    setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    setIsTyping(false);
    await supabase.from('chat_history').insert([{ file_id: fileData.id, role: 'assistant', content: responseText }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-[#121212] overflow-hidden" dir="rtl">
      
      <header className="shrink-0 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800 p-2 md:p-4 flex items-center justify-between shadow-sm w-full h-[60px] md:h-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/study')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200"><ChevronRight size={20} className="dark:text-white"/></button>
          <h2 className="font-bold text-gray-900 dark:text-white truncate max-w-[140px] text-sm md:text-base">{fileName}</h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowInstructionsModal(true)} className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-10 h-10 rounded-xl hover:bg-gray-200">
            <SlidersHorizontal size={18} />
            {instructionsList.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{instructionsList.length}</span>}
          </button>
          <button onClick={() => navigate('/summary', { state: { fileData } })} className="flex items-center justify-center bg-indigo-50 text-indigo-700 w-10 h-10 rounded-xl">
            <FileOutput size={18} />
          </button>
          <button onClick={() => setShowCardModal(true)} className="flex items-center justify-center bg-orange-50 text-orange-700 w-10 h-10 rounded-xl">
            <Layers size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden w-full relative">
        
        <div className="hidden md:flex flex-col w-1/3 bg-white dark:bg-[#1E1E1E] border-l border-gray-200 dark:border-gray-800 p-6 overflow-y-auto shrink-0">
          <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2"><Network className="text-blue-600" size={20} /> الخريطة الذهنية</h3>
          {loadingMindMap ? (
             <div className="flex items-center justify-center mt-10"><Loader2 className="animate-spin text-gray-400" size={30}/></div>
          ) : mindMap.map((node, index) => (
             <div key={index} className="mb-4">
                {/* تطبيق الـ safeText هنا لمنع الكراش نهائياً */}
                <button onClick={() => handleSendChat(false, `اشرح المفهوم التالي: ${safeText(node.topic)}`)} className="w-full text-right bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 font-bold p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                  {safeText(node.topic)}
                </button>
                {node.subtopics && Array.isArray(node.subtopics) && (
                  <div className="mt-2 pr-6 border-r-2 border-blue-100 dark:border-blue-900/50 space-y-2">
                    {node.subtopics.map((sub, i) => (
                      <button key={i} onClick={() => handleSendChat(false, `اشرح: ${safeText(sub)}`)} className="w-full text-right text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg relative before:absolute before:w-4 before:h-0.5 before:bg-blue-100 before:right-[-1.5rem] before:top-1/2">
                        {safeText(sub)}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col h-full w-full">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[92%] md:max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tr-sm' : 'bg-blue-600 text-white rounded-tl-sm'}`}>
                  <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed" dir={detectTextDirection(msg.content)}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {formatMathExpressions(msg.content)}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'assistant' && idx > 0 && (
                    <button onClick={() => handleSendChat(true)} className="mt-3 flex items-center gap-1 text-[11px] text-blue-200 hover:text-white bg-blue-700/50 px-2.5 py-1.5 rounded-lg w-fit">
                      <Baby size={14} /> اشرحلي كأني طفل
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-end"><div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} /> بكتبلك...</div></div>}
            <div ref={messagesEndRef} className="h-2" />
          </main>

          <footer className="shrink-0 p-3 bg-white dark:bg-[#1E1E1E] border-t dark:border-gray-800 w-full z-20 pb-safe">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#121212] p-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm w-full max-w-3xl mx-auto">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat(false)} 
                placeholder="اسأل عن الملف هنا..." 
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm dark:text-white outline-none" 
              />
              <button 
                onClick={() => handleSendChat(false)} 
                disabled={isTyping || !input.trim()} 
                className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-50"
              >
                <Send size={18} className={document.dir === 'rtl' ? 'rotate-180' : ''}/>
              </button>
            </div>
          </footer>
        </div>

      </div>

      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl w-full max-w-md relative flex flex-col max-h-[85vh]">
            <button onClick={() => setShowInstructionsModal(false)} className="absolute top-4 left-4 p-2 text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={20}/></button>
            <h3 className="font-bold text-lg mb-2 dark:text-white flex items-center gap-2"><SlidersHorizontal className="text-blue-600"/> تعليمات الذكاء</h3>
            
            <div className="flex gap-2 my-4 shrink-0">
              <input type="text" value={newInstruction} onChange={(e) => setNewInstruction(e.target.value)} placeholder="مثال: لخص في نقاط..." className="flex-1 bg-gray-50 dark:bg-[#121212] border dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none" />
              <button onClick={handleAddInstruction} className="bg-blue-600 text-white px-3 rounded-xl"><Plus size={18}/></button>
            </div>

            <div className="overflow-y-auto space-y-2 mb-4">
              {instructionsList.map((inst, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-[#121212] border dark:border-gray-700 p-2.5 rounded-lg text-sm dark:text-white">
                  <span>{inst}</span><button onClick={() => handleRemoveInstruction(idx)} className="text-red-400"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl w-full max-w-xs flex flex-col">
            <h3 className="font-bold text-lg mb-4 dark:text-white text-center">كم كارت تريد؟</h3>
            <input type="number" value={cardCount} onChange={(e) => setCardCount(e.target.value)} className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-4 outline-none text-center font-bold" />
            <button onClick={() => { setShowCardModal(false); navigate('/cards', { state: { fileData, cardCount } }); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-2">توليد {cardCount} كروت</button>
            <button onClick={() => setShowCardModal(false)} className="w-full text-gray-500 py-2 mt-2 font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}