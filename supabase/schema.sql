-- Enable Row Level Security
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 1. public.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    plan TEXT DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. public.search_history
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rubro TEXT NOT NULL,
    ubicacion_nombre TEXT,
    centro_lat NUMERIC,
    centro_lng NUMERIC,
    radio_km NUMERIC,
    bbox TEXT,
    empresas_encontradas INTEGER DEFAULT 0,
    empresas_validas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. public.empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE,
    nombre TEXT NOT NULL,
    rubro TEXT,
    rubro_key TEXT,
    email TEXT,
    telefono TEXT,
    website TEXT,
    direccion TEXT,
    ciudad TEXT,
    pais TEXT,
    latitud NUMERIC,
    longitud NUMERIC,
    linkedin TEXT,
    facebook TEXT,
    validada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. public.email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. public.email_history
CREATE TABLE IF NOT EXISTS public.email_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    empresa_nombre TEXT,
    empresa_email TEXT,
    template_id INTEGER REFERENCES public.email_templates(id) ON DELETE SET NULL,
    status TEXT, -- 'sent', 'failed', 'delivered'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. public.user_oauth_tokens
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES

-- Users can only read/update their own profile
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Search History: Users can only see their own history
CREATE POLICY "Users can view their own search history" ON public.search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search history" ON public.search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Empresas: Everyone can read (or maybe restricted to authenticated?)
CREATE POLICY "Anyone can view empresas" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "Admins can insert/update empresas" ON public.empresas FOR ALL USING (auth.role() = 'service_role');

-- Email Templates: Authenticated users can read
CREATE POLICY "Authenticated users can view templates" ON public.email_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Email History: Users can view their own
CREATE POLICY "Users can view their own email history" ON public.email_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email history" ON public.email_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- OAuth Tokens: Users can only see/edit their own
CREATE POLICY "Users can manage their own oauth tokens" ON public.user_oauth_tokens FOR ALL USING (auth.uid() = user_id);
