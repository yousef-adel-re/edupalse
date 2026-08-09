// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// سحب المفاتيح من ملف الـ .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// إنشاء الاتصال بقاعدة البيانات
export const supabase = createClient(supabaseUrl, supabaseKey);