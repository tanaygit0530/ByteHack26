-- Create Enum for Status
CREATE TYPE agreement_status AS ENUM (
  'PENDING_ACCEPTANCE',
  'FUNDED_AND_LOCKED',
  'REVIEW_PENDING',
  'APPROVED',
  'SETTLED',
  'DISPUTED'
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  role TEXT CHECK (role IN ('client', 'contractor')),
  wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  deadline DATE,
  client_id UUID REFERENCES public.profiles(id),
  contractor_id UUID REFERENCES public.profiles(id),
  status agreement_status DEFAULT 'PENDING_ACCEPTANCE',
  deliverable_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (true);

CREATE POLICY "Agreements are viewable by participants" ON public.agreements
  FOR SELECT USING (true);

CREATE POLICY "Clients can create agreements" ON public.agreements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update agreements" ON public.agreements
  FOR UPDATE USING (true);

