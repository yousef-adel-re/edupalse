// src/components/Navbar.jsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-darkCard border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* اللوجو */}
          <div className="flex-shrink-0 flex items-center cursor-pointer">
            <Logo size="35" showText={true} />
          </div>

          {/* زرار الوضع الليلي */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-gray-600" />}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}