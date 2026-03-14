-- ================================
-- CLEAN RESET (FOR HACKATHON DEV)
-- ================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.deliverables CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ================================
-- 1. PROFILES TABLE
-- ================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  country TEXT,
  company_type TEXT,
  kyc_status TEXT DEFAULT 'PENDING',
  jurisdiction_metadata JSONB DEFAULT '{}',
  
  -- Contractor Trust Metrics
  total_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  total_disputes INTEGER DEFAULT 0,
  resolved_disputes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 2. WALLETS (ESCROW BALANCES)
-- ================================

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id),
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 3. AGREEMENTS (ESCROW CONTRACTS)
-- ================================

CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  description TEXT,
  deliverables TEXT,

  amount DECIMAL(15,2) NOT NULL,
  deadline DATE,

  party_a_id UUID REFERENCES public.profiles(id),
  party_b_id UUID REFERENCES public.profiles(id),
  payer_id UUID REFERENCES public.profiles(id),
  receiver_id UUID REFERENCES public.profiles(id),

  status TEXT DEFAULT 'DRAFT',
  agreement_type TEXT DEFAULT 'ESCROW', -- 'ESCROW' or 'C2C'

  trigger_type TEXT DEFAULT 'manual_review',
  
  ai_score INTEGER,
  ai_summary TEXT,
  domain_match BOOLEAN,

  platform_fee DECIMAL(15,2),
  gst_amount DECIMAL(15,2),
  digital_service_tax DECIMAL(15,2),
  estimated_tax DECIMAL(15,2), -- Added for Phase 4
  receiver_amount DECIMAL(15,2),
  compliance_report JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 4. DELIVERABLE SUBMISSIONS
-- ================================

CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agreement_id UUID REFERENCES public.agreements(id),

  submission_url TEXT,
  repo_type TEXT,
  receipt_url TEXT,

  submitted_by UUID REFERENCES public.profiles(id),

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 5. AI VERIFICATION RESULTS
-- ================================

CREATE TABLE public.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agreement_id UUID REFERENCES public.agreements(id),
  
  repo_url TEXT,
  repo_owner TEXT,
  repo_name TEXT,

  ai_score INTEGER,
  ai_summary TEXT,

  domain_match BOOLEAN,

  ai_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 6. HUMAN REVIEW (HUMAN IN LOOP)
-- ================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agreement_id UUID REFERENCES public.agreements(id),

  reviewer UUID REFERENCES public.profiles(id),

  ai_score INTEGER,

  decision TEXT CHECK (decision IN ('APPROVED','REJECTED','NEEDS_REVISION')),

  reason TEXT,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 7. TRANSACTION LOGS
-- ================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_wallet UUID REFERENCES public.wallets(id),
  to_wallet UUID REFERENCES public.wallets(id),

  amount DECIMAL(15,2),

  type TEXT CHECK (type IN ('ESCROW_DEPOSIT','ESCROW_RELEASE','PLATFORM_FEE','REFUND')),

  agreement_id UUID REFERENCES public.agreements(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 8. ENABLE RLS (HACKATHON MODE)
-- ================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- OPEN POLICIES (HACKATHON DEMO)

CREATE POLICY "Public read profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Public insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update profiles"
ON public.profiles FOR UPDATE
USING (true);

CREATE POLICY "Public wallets access"
ON public.wallets FOR ALL
USING (true);

CREATE POLICY "Public agreements access"
ON public.agreements FOR ALL
USING (true);

CREATE POLICY "Public deliverables access"
ON public.deliverables FOR ALL
USING (true);

CREATE POLICY "Public ai reviews access"
ON public.ai_reviews FOR ALL
USING (true);

CREATE POLICY "Public audit logs access"
ON public.audit_logs FOR ALL
USING (true);

CREATE POLICY "Public transactions access"
ON public.transactions FOR ALL
USING (true);

-- ================================
-- 9. ENABLE REALTIME
-- ================================

BEGIN;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ================================
-- 10. DUMMY USERS FOR DEMO
-- ================================

INSERT INTO public.profiles (id, full_name, email, role, country, company_type, kyc_status, jurisdiction_metadata)
VALUES
(
'11111111-1111-1111-1111-111111111111',
'Acme Corp (Client)',
'client@nexus.com',
'client',
'USA',
'LLC',
'VERIFIED',
'{"tax_regime":"US-Resident"}'
),
(
'22222222-2222-2222-2222-222222222222',
'Jane Doe (Contractor)',
'contractor@nexus.com',
'contractor',
'India',
'Individual',
'VERIFIED',
'{"tax_regime":"IN-Resident"}'
);

-- ================================
-- 11. TAX RECORDS
-- ================================

CREATE TABLE public.tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id),
  total_amount DECIMAL(15,2),
  platform_fee DECIMAL(15,2),
  jurisdiction_client TEXT,
  jurisdiction_contractor TEXT,
  estimated_tax DECIMAL(15,2),
  net_payout DECIMAL(15,2),
  status TEXT DEFAULT 'liability_recorded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ================================
-- 12. DISPUTES
-- ================================

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id),
  raised_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  evidence_url TEXT,
  resolution TEXT,
  status TEXT DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED', 'CLOSED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ================================
-- 13. ENABLE RLS
-- ================================

ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.settlement_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id),
  tx_hash TEXT UNIQUE,
  certificate_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public tax records access" ON public.tax_records FOR ALL USING (true);
CREATE POLICY "Public disputes access" ON public.disputes FOR ALL USING (true);
CREATE POLICY "Public certificates access" ON public.settlement_certificates FOR ALL USING (true);

-- ================================
-- 14. ENABLE REALTIME
-- ================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tax_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;

-- CREATE DEMO WALLETS

INSERT INTO public.wallets (owner_id, balance)
VALUES
('11111111-1111-1111-1111-111111111111',50000),
('22222222-2222-2222-2222-222222222222',200);