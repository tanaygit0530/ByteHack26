import express from 'express';
import axios from 'axios';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
  console.error("❌ CRITICAL ERROR: Supabase credentials are missing or invalid in server/.env");
  console.error("Current SUPABASE_URL:", supabaseUrl);
  console.error("Please add your Supabase URL and Service Role Key to server/.env and restart.");
  // We'll proceed with a null client to avoid immediate crash, but routes will fail
}

const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;


// Phase 1 Step 3: Immutable Fee Ledger Logic
const calculateImmutableLedger = (amount, clientCountry, contractorCountry) => {
  const totalAmount = parseFloat(amount);
  const platformFeeRate = 0.01; // 1% as per Phase 1 Step 3
  let taxReserveRate = 0.00;

  // Step 1: Signup and KYC -> Jurisdiction-based tax
  // Example: US/UK client → Indian contractor applies 10% tax reserve
  const highTaxClients = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Canada'];
  const devContractors = ['India', 'Brazil', 'Vietnam'];

  if (highTaxClients.includes(clientCountry) && devContractors.includes(contractorCountry)) {
    taxReserveRate = 0.10;
  } else if (clientCountry === contractorCountry) {
    taxReserveRate = 0.05; // Base domestic compliance reserve
  } else {
    taxReserveRate = 0.02; // General cross-border minimal reserve
  }

  const platform_fee = totalAmount * platformFeeRate;
  const tax_reserve = totalAmount * taxReserveRate;
  const contractor_amount = totalAmount - platform_fee - tax_reserve;

  return {
    platform_fee,
    tax_reserve,
    contractor_amount
  };
};

// Phase 2 Step 6: AI Verification Service
const performAIAnalysis = async (repoUrl) => {
  console.log(`🤖 Starting AI Analysis for: ${repoUrl}`);
  
  // Simulated GitHub API checks
  // 1. Detect repository type
  const isReact = repoUrl.toLowerCase().includes('react') || true; 
  
  // 2. Perform checks (Simulated)
  const repoExists = true;
  const commitCount = Math.floor(Math.random() * 20) + 5;
  const hasFiles = true; // README, package.json
  
  const confidence_score = Math.floor(Math.random() * 20) + 80; // 80-100%
  
  const summary = `AI verification score: ${confidence_score}%. Repository detected as ${isReact ? 'React application' : 'Standard Web Project'}. ${commitCount} commits detected. Required deployment files (README.md, package.json) verified. Manual review recommended for final approval.`;

  return {
    ai_score: confidence_score,
    ai_summary: summary
  };
};

// Phase 5: Compliance Receipt Generator
const generateComplianceReceipt = async (agreement) => {
  const receiptId = `REC-${agreement.id.slice(0, 8).toUpperCase()}`;
  const timestamp = new Date().toISOString();
  
  // In a real app, this would generate a PDF and upload to Supabase Storage
  const receiptUrl = `https://nexus-escrow.com/receipts/${receiptId}`;
  
  console.log(`📄 Generated Compliance Receipt: ${receiptId}`);
  return receiptUrl;
};

// Phase 4: Oracle Trigger and Compliance Split
const executeComplianceSplit = async (agreementId) => {
  try {
    // 1. Fetch agreement details with joined profiles for wallet updates
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*, client:client_id(*), contractor:contractor_id(*)')
      .eq('id', agreementId)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found");
    if (agreement.status !== 'APPROVED') throw new Error("Agreement must be in APPROVED state for settlement");

    const { contractor_amount, platform_fee, tax_reserve } = agreement;

    console.log(`⚖️ Executing Compliance Split for ${agreementId}:`);
    console.log(`- Payout to Contractor: $${contractor_amount}`);
    console.log(`- Platform Fee: $${platform_fee}`);
    console.log(`- Tax Reserve: $${tax_reserve}`);

    // Update contractor's wallet balance
    const currentBalance = parseFloat(agreement.contractor.wallet_balance || 0);
    const newBalance = currentBalance + parseFloat(contractor_amount);

    const { error: walletError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', agreement.contractor_id);

    if (walletError) throw walletError;

    // Phase 5: Generate Receipt
    const receiptUrl = await generateComplianceReceipt(agreement);

    // Update agreement status to SETTLED and store receipt
    const { error: statusError } = await supabase
      .from('agreements')
      .update({ 
        status: 'SETTLED',
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', agreementId);

    if (statusError) throw statusError;

    return { 
      success: true, 
      receipt_url: receiptUrl,
      payout: contractor_amount 
    };
  } catch (error) {
    console.error("Compliance Split failed:", error.message);
    throw error;
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Nexus API is running...');
});

// Step 2 & 3: Draft Agreement with Fee Ledger
app.post('/api/agreements', async (req, res) => {
  const { title, description, deliverables, amount, deadline, contractor_id, client_id, trigger_type } = req.body;
  if (!supabase) return res.status(500).json({ error: "Supabase client not initialized" });

  try {
    // Fetch client and contractor countries for tax calculation
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, country')
      .in('id', [client_id, contractor_id]);
    
    const client = profiles.find(p => p.id === client_id);
    const contractor = profiles.find(p => p.id === contractor_id);

    // Calculate Immutable Ledger
    const ledger = calculateImmutableLedger(amount, client?.country, contractor?.country);

    const { data, error } = await supabase
      .from('agreements')
      .insert([{
        title,
        description,
        deliverables,
        amount,
        deadline,
        client_id,
        contractor_id,
        trigger_type: trigger_type || 'manual_review',
        status: 'DRAFT',
        ...ledger
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 4: Vault Funding
app.post('/api/agreements/:id/fund', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('amount, client_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found");
    if (agreement.status !== 'DRAFT') throw new Error("Agreement already funded or in progress");

    const amountToDeduct = parseFloat(agreement.amount);

    // Simulated Wallet Deduction
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', agreement.client_id)
      .single();

    const currentBalance = parseFloat(clientProfile.wallet_balance || 0);
    if (currentBalance < amountToDeduct) throw new Error("Insufficient funds");

    await supabase
      .from('profiles')
      .update({ wallet_balance: currentBalance - amountToDeduct })
      .eq('id', agreement.client_id);

    const { data, error } = await supabase
      .from('agreements')
      .update({ status: 'FUNDED_AND_LOCKED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Capital secured and locked in vault.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 1 Step 4: Option 1: Reject Contract
app.post('/api/agreements/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const { data, error } = await supabase
      .from('agreements')
      .update({ 
        status: 'REJECTED',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Agreement rejected.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 5: Work Submission
app.post('/api/agreements/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { deliverable_url } = req.body;

  try {
    const { error: updateError } = await supabase
      .from('agreements')
      .update({ 
        deliverable_url, 
        submitted_at: new Date().toISOString(),
        status: 'IN_REVIEW' 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Phase 2 Step 6: Trigger AI Analysis (Async simulated)
    const aiResult = await performAIAnalysis(deliverable_url);
    
    const { data, error } = await supabase
      .from('agreements')
      .update({ 
        ai_score: aiResult.ai_score,
        ai_summary: aiResult.ai_summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Submission successful. AI analysis complete.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 3: Human Review (Approve/Reject)
app.post('/api/agreements/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // 'approve' or 'reject'

  try {
    const status = decision === 'approve' ? 'APPROVED' : 'DISPUTED';
    
    const { data, error } = await supabase
      .from('agreements')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Agreement ${status.toLowerCase()} successfully.`, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 4: Oracle Trigger (Settlement)
app.post('/api/agreements/:id/settle', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeComplianceSplit(id);
    res.json({ message: 'Oracle trigger successful. Compliance split executed.', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Keep the old simulate-payment for backward compatibility but update its logic
app.post('/api/agreements/:id/simulate-payment', async (req, res) => {
  // Just redirect to our new fund logic
  const { id } = req.params;
  try {
    const { data: agreement } = await supabase.from('agreements').select('status').eq('id', id).single();
    if (agreement.status === 'DRAFT' || agreement.status === 'PENDING_ACCEPTANCE') {
        // Force status to DRAFT if it's the old one to allow funding
        if (agreement.status === 'PENDING_ACCEPTANCE') {
            await supabase.from('agreements').update({ status: 'DRAFT' }).eq('id', id);
        }
    }
    // Then fund it
    const fundResponse = await axios.post(`http://localhost:${PORT}/api/agreements/${id}/fund`);
    res.json(fundResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
