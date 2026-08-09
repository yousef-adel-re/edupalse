import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, FileSignature, MessageSquarePlus, Tv, Gamepad2 } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // إخفاء الشريط في شاشات المذاكرة العميقة، الامتحانات، *وصفحة الشات*
  const hideOnPaths = ['/exam-room', '/study-room', '/cards', '/summary', '/auth', '/ai-chat', '/presentations'];
  if (hideOnPaths.some(path => location.pathname.includes(path))) {
    return null;
  }

  const navItems = [
    { icon: <Home size={22} />, label: 'الرئيسية', path: '/' },
    { icon: <BookOpen size={22} />, label: 'المذاكرة', path: '/study' },
    { icon: <FileSignature size={22} />, label: 'الامتحانات', path: '/exams' },
    { icon: <Gamepad2 size={22} />, label: 'الترفيه', path: '/entertainment' },
    { icon: <Tv size={22} />, label: 'الباوربوينت', path: '/presentations' },
    { icon: <MessageSquarePlus size={22} />, label: 'الشات', path: '/ai-chat' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-[100]">
      {navItems.map((item, idx) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <button 
            key={idx} 
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center p-2 transition-all ${isActive ? 'text-blue-600 scale-110 -translate-y-1' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            {item.icon}
            <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-0'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}