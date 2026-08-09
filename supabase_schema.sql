-- ==============================================================================
-- EduPulse Supabase Complete Database Schema & RLS Setup
-- Copy and run this script directly in the Supabase SQL Editor.
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    bit_rewards INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- RPC Helper: Check if email exists in auth.users or profiles (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.check_email_exists(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(email_input))
    UNION
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(email_input))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Helper: Delete user account permanently from auth.users (Cascades to profiles, user_files, exams, chats, presentations)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic Profile Creation Trigger on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, bit_rewards)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'طالب جديد'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'bit_rewards')::INTEGER, 0)
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER FILES TABLE
CREATE TABLE IF NOT EXISTS public.user_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_content TEXT NOT NULL,
    mindmap_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS mindmap_data JSONB DEFAULT '[]'::jsonb;

-- 3. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_data JSONB NOT NULL,
    user_answers JSONB DEFAULT '{}'::jsonb,
    score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    ai_feedback JSONB DEFAULT '{}'::jsonb,
    final_analysis TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAT HISTORY TABLE (Study Room File Chats)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'ar',
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FLASHCARDS SETS TABLE
CREATE TABLE IF NOT EXISTS public.flashcards_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.user_files(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'ar',
    cards_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI CHATS TABLE (Freeform AI Assistant Sessions)
CREATE TABLE IF NOT EXISTS public.ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRESENTATIONS TABLE (AI PowerPoint Presentations)
CREATE TABLE IF NOT EXISTS public.presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    theme_config JSONB DEFAULT '{"theme": "ocean-blue", "font": "Cairo"}'::jsonb,
    slides_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_file_id ON public.exams(file_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_file_id ON public.chat_history(file_id);
CREATE INDEX IF NOT EXISTS idx_summaries_file_id ON public.summaries(file_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_sets_file_id ON public.flashcards_sets(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON public.ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_chat_id ON public.ai_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON public.presentations(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow user to manage own profile" ON public.profiles;
CREATE POLICY "Allow user to manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- User Files Policies
DROP POLICY IF EXISTS "Allow user to manage own files" ON public.user_files;
CREATE POLICY "Allow user to manage own files" ON public.user_files FOR ALL USING (auth.uid() = user_id);

-- Exams Policies
DROP POLICY IF EXISTS "Allow user to manage own exams" ON public.exams;
CREATE POLICY "Allow user to manage own exams" ON public.exams FOR ALL USING (auth.uid() = user_id);

-- Chat History Policies
DROP POLICY IF EXISTS "Allow user to manage chat history of own files" ON public.chat_history;
CREATE POLICY "Allow user to manage chat history of own files" ON public.chat_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_files
            WHERE user_files.id = chat_history.file_id
            AND user_files.user_id = auth.uid()
        )
    );

-- Summaries Policies
DROP POLICY IF EXISTS "Allow user to manage summaries of own files" ON public.summaries;
CREATE POLICY "Allow user to manage summaries of own files" ON public.summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_files
            WHERE user_files.id = summaries.file_id
            AND user_files.user_id = auth.uid()
        )
    );

-- Flashcards Sets Policies
DROP POLICY IF EXISTS "Allow user to manage flashcards of own files" ON public.flashcards_sets;
CREATE POLICY "Allow user to manage flashcards of own files" ON public.flashcards_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_files
            WHERE user_files.id = flashcards_sets.file_id
            AND user_files.user_id = auth.uid()
        )
    );

-- AI Chats Policies
DROP POLICY IF EXISTS "Allow user to manage own ai_chats" ON public.ai_chats;
CREATE POLICY "Allow user to manage own ai_chats" ON public.ai_chats FOR ALL USING (auth.uid() = user_id);

-- AI Chat Messages Policies
DROP POLICY IF EXISTS "Allow user to manage own ai_chat_messages" ON public.ai_chat_messages;
CREATE POLICY "Allow user to manage own ai_chat_messages" ON public.ai_chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_chats
            WHERE ai_chats.id = ai_chat_messages.chat_id
            AND ai_chats.user_id = auth.uid()
        )
    );

-- Presentations Policies
DROP POLICY IF EXISTS "Allow user to manage own presentations" ON public.presentations;
CREATE POLICY "Allow user to manage own presentations" ON public.presentations FOR ALL USING (auth.uid() = user_id);

-- 10. APP SECRETS TABLE (Secure API Keys & Configuration Storage)
CREATE TABLE IF NOT EXISTS public.app_secrets (
    key_name TEXT PRIMARY KEY,
    key_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_secrets" ON public.app_secrets;
CREATE POLICY "Allow authenticated read to app_secrets" ON public.app_secrets FOR SELECT TO authenticated USING (true);

-- Seed secrets template in Supabase (replace with your actual API keys in SQL editor or env)
INSERT INTO public.app_secrets (key_name, key_value) VALUES
  ('VITE_AZURE_OPENAI_ENDPOINT', 'YOUR_AZURE_ENDPOINT_HERE'),
  ('VITE_AZURE_OPENAI_KEY', 'YOUR_AZURE_KEY_HERE'),
  ('VITE_AZURE_DEPLOYMENT_NANO', 'gpt-5.4-nano'),
  ('VITE_AZURE_DEPLOYMENT_KIMI', 'Kimi-K2.6'),
  ('VITE_GEMINI_API_KEY', 'YOUR_GEMINI_KEY_HERE')
ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value, updated_at = NOW();
