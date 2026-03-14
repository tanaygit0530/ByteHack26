-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  role TEXT CHECK (role IN ('client', 'contractor')),
  wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  deadline DATE,
  client_id UUID REFERENCES public.profiles(id),
  contractor_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'PENDING_ACCEPTANCE',
  deliverable_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Temporarily disable foreign key constraints from old auth.users if they exist
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. Insert our Dummy Profiles so they exist in the Database
INSERT INTO public.profiles (id, full_name, role, wallet_balance)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp (Client)', 'client', 50000.00),
  ('22222222-2222-2222-2222-222222222222', 'Jane Doe (Contractor)', 'contractor', 150.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Completely Relax RLS so Dummy Auth works cleanly (Hackathon mode)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Agreements are viewable by participants" ON public.agreements;
CREATE POLICY "Agreements are viewable by participants" ON public.agreements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can create agreements" ON public.agreements;
CREATE POLICY "Clients can create agreements" ON public.agreements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can update agreements" ON public.agreements;
CREATE POLICY "Participants can update agreements" ON public.agreements FOR UPDATE USING (true);

-- 6. ENABLE REAL-TIME TRACKING FOR THE FRONTEND
-- (This tells Supabase to send instant websocket updates to your React app)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;


