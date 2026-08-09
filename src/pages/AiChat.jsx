// src/pages/AiChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Image as ImageIcon, FileText, ChevronRight, 
  MessageSquarePlus, Trash2, Pencil, X, Loader2, Menu, 
  Copy, Check, Bot, Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import toast from 'react-hot-toast'; 
import { detectTextDirection, extractTextWithVisionModel, streamAzureAI } from '../lib/ai';
import { formatMathExpressions } from '../lib/mathUtils';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

// -----------------------------------------------------------
// مكون نافذة تشغيل الكود المباشر (HTML Live Preview)
// -----------------------------------------------------------
const CodePreviewModal = ({ code, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-2 md:p-6 backdrop-blur-sm">
      <div className="bg-white w-full h-[95vh] md:h-full max-w-6xl rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-300 relative">
        <div className="bg-gray-100 p-3 border-b flex justify-between items-center shrink-0">
          <div className="flex gap-2 items-center">
             <div className="flex gap-1.5 mr-4">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
             </div>
             <span className="text-gray-600 font-bold text-sm font-mono tracking-widest hidden md:block">LIVE PREVIEW</span>
          </div>
          <button onClick={onClose} className="bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs font-bold px-3">
             إغلاق <X size={16}/>
          </button>
        </div>
        <iframe 
          title="Code Preview"
          srcDoc={code} 
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </div>
    </div>
  );
};

// -----------------------------------------------------------
// مكون صندوق الكود (Code Block)
// -----------------------------------------------------------
const CodeBlock = ({ inline, className, children, onPreview }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1].toLowerCase() : '';
  const codeString = String(children).replace(/\n$/, '');

  const isWebCode = lang === 'html' || lang === 'xml' || codeString.trim().startsWith('<!DOCTYPE html>') || codeString.trim().startsWith('<html');

  if (inline) {
    return <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-sm font-mono text-pink-600 dark:text-pink-400" dir="ltr">{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    toast.success("تم نسخ الكود!", { duration: 1500 }); 
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#1e1e1e] shadow-lg" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-300 text-xs font-sans border-b border-gray-700">
        <span className="uppercase font-bold tracking-wider">{lang || 'CODE'}</span>
        
        <div className="flex gap-2">
          {isWebCode && (
             <button onClick={() => onPreview(codeString)} className="flex items-center gap-1 hover:text-white transition-colors bg-blue-600/80 hover:bg-blue-600 text-white px-2 py-1 rounded-md">
               <Play size={14} className="fill-white"/> تشغيل
             </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-md">
            {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed">
        <pre><code>{children}</code></pre>
      </div>
    </div>
  );
};


export default function AiChat() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedPdfText, setExtractedPdfText] = useState(null); 
  const [fileName, setFileName] = useState('');

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  
  const [previewCode, setPreviewCode] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          setProfile(data);
          fetchChatSessions(user.id);
        });
      } else navigate('/auth');
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isTyping]);

  const fetchChatSessions = async (userId) => {
    const { data } = await supabase.from('ai_chats').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setChats(data);
      loadMessages(data[0].id);
    }
  };

  const loadMessages = async (chatId) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
    const { data } = await supabase.from('ai_chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const createNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    await supabase.from('ai_chats').delete().eq('id', id);
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    if (activeChatId === id) createNewChat();
    toast.success("تم حذف المحادثة.");
  };

  const extractPdfTextLocally = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
    }
    return fullText.trim();
  };

  const convertPdfToImages = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableFontFace: true }).promise;
    let base64Images = [];
    const maxPages = Math.min(pdf.numPages, 5); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height; canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport, intent: 'print' }).promise;
      base64Images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    return base64Images;
  };

  const handleFilePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setSelectedImage(null);
    setExtractedPdfText(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setIsExtractingFile(true);
      try {
        let text = await extractPdfTextLocally(file);
        if (text.length < 50) {
            const pdfImages = await convertPdfToImages(file);
            text = await extractTextWithVisionModel(pdfImages);
        }
        if (text && text.length > 10) {
          setExtractedPdfText(text);
          toast.success("تم قراءة الملف بنجاح.");
        } else {
          toast.error("تعذر استخراج النص. تأكد من جودة الملف.");
          setFileName('');
        }
      } catch (err) {
        toast.error("حدث خطأ أثناء قراءة الملف.");
        setFileName('');
      } finally {
        setIsExtractingFile(false);
        e.target.value = ''; 
      }
    } else {
      toast.error('يرجى رفع صور أو PDF فقط.');
      setFileName('');
    }
  };

  const handleSend = async (forcedInput = null, editMsgIndex = null) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() && !selectedImage && !extractedPdfText) return;

    let currentChatId = activeChatId;
    let newMessagesList = [...messages];

    if (editMsgIndex !== null) {
      newMessagesList = messages.slice(0, editMsgIndex);
      const msgToDeleteFromTime = messages[editMsgIndex].created_at;
      await supabase.from('ai_chat_messages').delete().eq('chat_id', currentChatId).gte('created_at', msgToDeleteFromTime);
    }

    let userMessageContent = textToSend;
    let displayMessage = textToSend;

    if (extractedPdfText) {
      userMessageContent = `[المستخدم أرفق PDF:]\n${extractedPdfText}\n\n[السؤال]: ${textToSend}`;
      displayMessage = `📁 مرفق: ${fileName}\n\n${textToSend}`;
    }

    const userMsgObj = { role: 'user', content: displayMessage, image_url: selectedImage };
    newMessagesList.push(userMsgObj);
    setMessages([...newMessagesList]);
    setInput('');
    setEditingMessageId(null);
    setIsTyping(true);

    if (!currentChatId) {
      const title = textToSend.split(' ').slice(0, 4).join(' ') || fileName || 'محادثة جديدة';
      const { data: newChat } = await supabase.from('ai_chats').insert([{ user_id: profile.id, title }]).select('id').single();
      currentChatId = newChat.id;
      setActiveChatId(currentChatId);
      setChats([{ id: currentChatId, title, created_at: new Date() }, ...chats]);
    }

    let contentToSave = displayMessage;
    if (selectedImage) contentToSave = `🖼️ [صورة]\n${displayMessage}`;
    await supabase.from('ai_chat_messages').insert([{ chat_id: currentChatId, role: 'user', content: contentToSave }]);

    // التعديل الأول: منع الموديل من استخدام بلوكات الأكواد للكلام العادي
    const systemPrompt = `أنت المساعد الذكي لـ EduPulse. اسم المستخدم: "${profile?.full_name}".
    - تحدث معه بصيغة طبيعية وودودة.
    - هام جداً: لا تستخدم كتل الأكواد (Code Blocks) إلا إذا كنت تكتب كوداً برمجياً فعلياً (مثل HTML, JS, Python). الكلام العادي اكتبه كنص عادي بدون كتل.
    - إذا طلب المستخدم برمجة لعبة أو صفحة ويب، قم بكتابة الكود بداخل block اسمه html.
    - استخدم LaTeX للمعادلات: \$\$ منفصلة و \$ مدمجة.`;

    const apiMessagesHistory = newMessagesList.map(m => {
      if (m.role === 'user' && m.image_url) return { role: 'user', content: [{ type: "text", text: m.content }, { type: "image_url", image_url: { url: m.image_url } }] };
      if (m.role === 'user' && m.content.includes(fileName) && extractedPdfText) return { role: 'user', content: userMessageContent };
      return { role: m.role, content: m.content };
    });

    clearAttachment();

    try {
      setMessages([...newMessagesList, { role: 'assistant', content: '' }]);

      const aiResponseText = await streamAzureAI(
        systemPrompt,
        apiMessagesHistory,
        "",
        true,
        (currentText) => {
          setMessages([...newMessagesList, { role: 'assistant', content: currentText }]);
        }
      );

      await supabase.from('ai_chat_messages').insert([{ chat_id: currentChatId, role: 'assistant', content: aiResponseText }]);
    } catch (e) {
      toast.error('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.');
      setMessages([...newMessagesList, { role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditClick = (msgContent, msgId, index) => {
    setInput(msgContent.replace(/📁 مرفق:.*?\n\n/g, '').replace(/🖼️ \[صورة\]\n/g, ''));
    setEditingMessageId(index);
    document.getElementById('chat-input').focus();
  };

  const clearAttachment = () => {
    setSelectedImage(null);
    setExtractedPdfText(null);
    setFileName('');
    if(fileInputRef.current) fileInputRef.current.value = '';
  };


  return (
    <div className="fixed inset-0 z-50 flex w-full bg-white dark:bg-[#121212] overflow-hidden font-sans" dir="rtl">
      
      {previewCode && <CodePreviewModal code={previewCode} onClose={() => setPreviewCode(null)} />}

      <div className={`${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 right-0 z-[100] w-72 md:w-64 bg-gray-50 dark:bg-[#1A1A1A] border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-100 dark:bg-[#1A1A1A] shrink-0">
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 rounded-full md:hidden hover:bg-gray-200"><X size={20}/></button>
          <button onClick={() => navigate('/')} className="hidden md:flex p-2 text-gray-500 hover:text-blue-600"><ChevronRight size={20}/></button>
          <button onClick={createNewChat} className="flex-1 flex justify-center items-center gap-1.5 bg-white dark:bg-[#2A2A2A] text-gray-800 dark:text-gray-200 py-2 px-3 rounded-lg font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ml-2 md:ml-0 text-sm shadow-sm transition-all">
            <MessageSquarePlus size={16} /> محادثة جديدة
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <div key={chat.id} onClick={() => loadMessages(chat.id)} className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors ${activeChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <span className="text-sm truncate pr-1">{chat.title}</span>
              <button onClick={(e) => deleteChat(chat.id, e)} className="text-gray-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/50 z-[90]"></div>}

      <div className="flex-1 flex flex-col h-full w-full relative min-w-0">
        
        <header className="shrink-0 md:hidden flex items-center justify-between p-2 px-3 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b dark:border-gray-800 z-30 shadow-sm w-full h-[60px]">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Menu size={20} className="dark:text-white" /></button>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">EduPulse AI</h2>
          </div>
          <button onClick={() => navigate('/')} className="p-2 text-gray-500 bg-gray-100 rounded-full"><ChevronRight size={18}/></button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-70 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3"><Bot size={40} className="text-gray-600 dark:text-gray-300"/></div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-200 mb-2">أهلاً {profile?.full_name?.split(' ')[0]}</h2>
              <p className="text-sm text-gray-500 text-center">أنا جاهز للمساعدة في البرمجة، كتابة الأكواد، وحل المعادلات.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] flex flex-col items-end gap-1">
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-2xl rounded-tr-sm shadow-sm border border-gray-200 dark:border-gray-700">
                      {msg.image_url && <img src={msg.image_url} alt="مرفق" className="w-full max-w-[200px] rounded-lg mb-2" />}
                      <div className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap" dir={detectTextDirection(msg.content)}>
                        {msg.content}
                      </div>
                    </div>
                    <button onClick={() => handleEditClick(msg.content, msg.id, index)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors ml-1 mt-1">
                      <Pencil size={12}/> تعديل وإعادة إرسال
                    </button>
                  </div>
                ) : (
                  <div className="max-w-[100%] md:max-w-[90%] flex gap-3 md:gap-4 w-full">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 mt-1">
                      <Bot size={20} className="text-blue-600 dark:text-blue-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose dark:prose-invert max-w-none text-[15px] md:text-base font-medium leading-relaxed" dir={detectTextDirection(msg.content)}>
                        
                        {/* التعديل الثاني: منع المربع الأسود إلا للأكواد الحقيقية */}
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '')
                              // المربع الأسود يظهر فقط لو فيه لغة برمجة حقيقية
                              if (!inline && match) {
                                return (
                                  <CodeBlock inline={false} className={className} onPreview={(c) => setPreviewCode(c)}>
                                    {children}
                                  </CodeBlock>
                                )
                              }
                              // لو كود عادي أو كلام فيه مسافات، يظهر بشكل نص عادي أو Inline Code
                              return (
                                <code className={inline ? "bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-sm font-mono text-pink-600 dark:text-pink-400" : "whitespace-pre-wrap"} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {formatMathExpressions(msg.content)}
                        </ReactMarkdown>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))
          )}
          {isTyping && (
             <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                 <Bot size={20} className="text-blue-600 dark:text-blue-400"/>
               </div>
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                 <Loader2 className="animate-spin" size={16} /> جاري التفكير...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} className="h-4"/>
        </main>

        <footer className="shrink-0 p-3 md:p-5 bg-white dark:bg-[#121212] w-full z-20 pb-safe">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            
            {(selectedImage || extractedPdfText || isExtractingFile) && (
              <div className="flex gap-2 items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-xl w-fit relative border border-gray-200 dark:border-gray-700 mx-1">
                {isExtractingFile ? <span className="text-xs text-blue-600 flex gap-1"><Loader2 className="animate-spin" size={14}/> قراءة...</span> : selectedImage ? <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-md" /> : <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-xs font-bold"><FileText size={14}/> {fileName}</div>}
                <button onClick={clearAttachment} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
              </div>
            )}

            {editingMessageId !== null && (
              <div className="text-xs font-bold text-orange-600 flex justify-between items-center bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-900 mx-1">
                <span>تعديل رسالة (سيتم حذف الردود اللاحقة)</span>
                <button onClick={() => {setEditingMessageId(null); setInput('');}} className="bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm hover:bg-gray-50">إلغاء</button>
              </div>
            )}

            <div className="flex items-end gap-1.5 bg-gray-100 dark:bg-[#1A1A1A] p-2 rounded-[1.5rem] border border-gray-200 dark:border-gray-800 focus-within:border-blue-400 dark:focus-within:border-blue-700 transition-colors shadow-sm">
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400 rounded-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFilePick} accept="image/*, application/pdf" className="hidden" />
              
              <textarea 
                id="chat-input"
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(null, editingMessageId); } }} 
                placeholder="اسأل المساعد الذكي..." 
                className="flex-1 bg-transparent border-none px-2 py-2.5 dark:text-white outline-none resize-none min-h-[44px] max-h-[150px] text-[15px]"
                rows="1"
              />
              <button onClick={() => handleSend(null, editingMessageId)} disabled={isTyping || (!input.trim() && !selectedImage && !extractedPdfText) || isExtractingFile} className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-full disabled:opacity-50 hover:scale-105 shrink-0 transition-transform">
                <Send size={20} className={document.dir === 'rtl' ? 'rotate-180' : ''}/>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-1">الذكاء الاصطناعي يمكن أن يخطئ. يرجى مراجعة المعلومات.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}