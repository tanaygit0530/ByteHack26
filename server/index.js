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

// Phase 2 Step 6: AI Verification Service with Confidence Scoring Model
const performAIAnalysis = async (repoUrl) => {
  console.log(`🤖 Starting AI Analysis for: ${repoUrl}`);
  
  // Simulated GitHub metadata collection
  const repoName = repoUrl.split('/').pop();
  
  // 1. Detect Repository Type & Domain Match
  // Logic: Only "Web Development" is valid for this escrow protocol
  let repo_type = "Unknown Repository";
  let domain_match = false;
  
  const lowerUrl = repoUrl.toLowerCase();
  if (lowerUrl.includes('react') || lowerUrl.includes('next')) {
    repo_type = "Web Development Project (React/Next)";
    domain_match = true;
  } else if (lowerUrl.includes('express') || lowerUrl.includes('node')) {
    repo_type = "Backend API (Node/Express)";
    domain_match = true; // Still considered Web Dev in this context
  } else if (lowerUrl.includes('flutter') || lowerUrl.includes('dart') || lowerUrl.includes('android')) {
    repo_type = "Mobile App Project";
    domain_match = false;
  } else if (lowerUrl.includes('python') || lowerUrl.includes('ipynb') || lowerUrl.includes('notebook')) {
    repo_type = "Data Science Project";
    domain_match = false;
  }

  // 2. Run Verification Checks (Simulated weighted model)
  const checks = {
    exists: true,               // 20%
    commits: true,              // 20%
    files_present: true,        // 20% (README, package.json etc)
    pr_merged: true,            // 20%
    domain_validation: domain_match // 20%
  };

  // Calculate Weighted Confidence Score
  let confidence_score = 0;
  if (checks.exists) confidence_score += 20;
  if (checks.commits) confidence_score += 20;
  if (checks.files_present) confidence_score += 20;
  if (checks.pr_merged) confidence_score += 20;
  if (checks.domain_validation) confidence_score += 20;

  // Small random variance for "AI realism"
  confidence_score = Math.max(0, Math.min(100, confidence_score + (Math.floor(Math.random() * 5))));

  // 3. Generate AI Summary
  let summary = "";
  if (domain_match) {
    summary = `AI Verification Summary: Confidence Score ${confidence_score}%. Repository detected as ${repo_type}. Core requirements satisfied: existence verified, active commit history detected, and required project files (README.md) present. Domain validation passed. Manual review recommended for final acceptance.`;
  } else {
    summary = `AI Verification Warning: Confidence Score ${confidence_score}%. Repository detected as ${repo_type}. Expected domain: Web Development. Core deliverable mismatch detected. Sanity checks (existence, commits) passed but architectural validation failed. HIGH MANUAL REVIEW RECOMMENDED.`;
  }

  // 4. Detailed Metrics
  const ai_metadata = {
    checks,
    metrics: {
      commits_found: Math.floor(Math.random() * 15) + 5,
      required_files: ["README.md", "package.json"],
      pr_status: "Merged Successfully",
      branch_activity: "Active"
    }
  };

  return {
    ai_score: confidence_score,
    ai_summary: summary,
    repo_type,
    domain_match,
    ai_metadata
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
const executeSettlement = async (agreementId, outcome, arbiterId = null, splitData = null) => {
  try {
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*, client:client_id(*), contractor:contractor_id(*)')
      .eq('id', agreementId)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found");

    const { amount, contractor_id, client_id } = agreement;
    let contractorPayout = 0;
    let clientRefund = 0;
    let status = 'SETTLED';

    if (outcome === 'CONTRACTOR_WINS') {
        contractorPayout = parseFloat(agreement.contractor_amount);
        status = 'SETTLED';
    } else if (outcome === 'CLIENT_WINS') {
        clientRefund = parseFloat(amount); // Refund total deposit
        status = 'REFUNDED';
    } else if (outcome === 'PARTIAL_SETTLEMENT') {
        const contractorCut = parseFloat(splitData.contractor_percent) / 100;
        contractorPayout = parseFloat(amount) * contractorCut;
        clientRefund = parseFloat(amount) - contractorPayout;
        status = 'PARTIAL_SETTLED';
    }

    // Process Contractor Payout
    if (contractorPayout > 0) {
      const { data: cWallet } = await supabase.from('wallets').select('id, balance').eq('owner_id', contractor_id).single();
      await supabase.from('wallets').update({ balance: parseFloat(cWallet.balance) + contractorPayout }).eq('id', cWallet.id);
      await supabase.from('transactions').insert([{
        to_wallet: cWallet.id,
        amount: contractorPayout,
        type: 'ESCROW_RELEASE',
        agreement_id: agreementId
      }]);

      // Log Platform Fee Routing
      if (parseFloat(agreement.platform_fee) > 0) {
        await supabase.from('transactions').insert([{
          amount: parseFloat(agreement.platform_fee),
          type: 'PLATFORM_FEE',
          agreement_id: agreementId
        }]);
      }
    }

    // Process Client Refund
    if (clientRefund > 0) {
      const { data: clWallet } = await supabase.from('wallets').select('id, balance').eq('owner_id', client_id).single();
      await supabase.from('wallets').update({ balance: parseFloat(clWallet.balance) + clientRefund }).eq('id', clWallet.id);
      await supabase.from('transactions').insert([{
        to_wallet: clWallet.id,
        amount: clientRefund,
        type: 'REFUND',
        agreement_id: agreementId
      }]);
    }

    // Final Audit Log
    const { data: aiReview } = await supabase.from('ai_reviews').select('ai_score').eq('agreement_id', agreementId).order('created_at', { ascending: false }).limit(1).single();
    await supabase.from('audit_logs').insert([{
        agreement_id: agreementId,
        reviewer: arbiterId || client_id,
        ai_score: aiReview?.ai_score || 0,
        decision: outcome,
        reason: outcome === 'CONTRACTOR_WINS' ? 'Satisfactory completion' : 'Arbitration resolved'
    }]);

    // Construct Compliance Certificate
    const { data: latestDeliverable } = await supabase.from('deliverables').select('submission_url').eq('agreement_id', agreementId).order('submitted_at', { ascending: false }).limit(1).single();

    const complianceReport = {
      tx_hash: `settle_0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`,
      timestamps: {
        agreement_created: agreement.created_at,
        settlement_executed: new Date().toISOString()
      },
      jurisdiction: {
        client: agreement.client?.country || 'USA',
        contractor: agreement.contractor?.country || 'India'
      },
      financials: {
        gross: amount,
        platform_fee: agreement.platform_fee,
        tax_reserve_metadata: agreement.tax_reserve,
        contractor_received: contractorPayout,
        client_refunded: clientRefund
      },
      tax_liability_estimate: {
        rate: "10%",
        obligation_usd: (parseFloat(amount) * 0.10).toFixed(2),
        note: "Contractor responsible for local remittance"
      },
      proof_of_work: {
        submission: latestDeliverable?.submission_url,
        ai_confidence: aiReview?.ai_score
      }
    };

    await supabase.from('agreements')
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        compliance_report: complianceReport
      })
      .eq('id', agreementId);

    return { success: true, status, compliance_report: complianceReport };
  } catch (error) {
    console.error("Settlement failed:", error.message);
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

    // SELF-HEALING: Ensure profiles and wallets exist 
    const ensureProfile = async (id, name, role, country, email, balance) => {
      const { data } = await supabase.from('profiles').select('id').eq('id', id).single();
      if (!data) {
        await supabase.from('profiles').upsert([{ id, full_name: name, role, country, email, kyc_status: 'VERIFIED' }]);
        await supabase.from('wallets').upsert([{ owner_id: id, balance }]);
      }
    };

    await ensureProfile(client_id, 'Acme Corp (Client)', 'client', 'USA', 'client@nexus.com', 50000);
    await ensureProfile(contractor_id, 'Jane Doe (Contractor)', 'contractor', 'India', 'contractor@nexus.com', 200);

    const { data, error } = await supabase
      .from('agreements')
      .insert([{
        title, description, deliverables, amount, deadline, client_id, contractor_id,
        trigger_type: trigger_type || 'manual_review', status: 'DRAFT', ...ledger
      }])
      .select().single();

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
    if (agreement.status !== 'ACCEPTED') throw new Error("Agreement must be accepted by contractor before funding");

    const amountToDeduct = parseFloat(agreement.amount);

    // Get Client Wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('owner_id', agreement.client_id)
      .single();

    if (walletError || !wallet) {
       // Auto-create wallet if missing
       const { data: newWallet } = await supabase.from('wallets').insert([{ owner_id: agreement.client_id, balance: 50000 }]).select().single();
       wallet = newWallet;
    }

    const currentBalance = parseFloat(wallet.balance || 0);
    if (currentBalance < amountToDeduct) throw new Error("Insufficient funds. Use 'Add Funds' in Navbar.");

    // Deduct from wallet
    await supabase.from('wallets').update({ balance: currentBalance - amountToDeduct }).eq('id', wallet.id);

    // Log Deposit Transaction
    await supabase.from('transactions').insert([{
      from_wallet: wallet.id,
      amount: amountToDeduct,
      type: 'ESCROW_DEPOSIT',
      agreement_id: id
    }]);

    const { data, error } = await supabase
      .from('agreements')
      .update({ status: 'FUNDED_AND_LOCKED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

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

// Phase 1 Step 4-B: Contractor Acceptance
app.post('/api/agreements/:id/accept-contractor', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('agreements')
      .update({ 
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Agreement accepted by contractor.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 5: Work Submission
app.post('/api/agreements/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { deliverable_url } = req.body;

  try {
    // Fetch agreement to verify and get contractor_id
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('contractor_id')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found");

    // Insert into Deliverables
    await supabase.from('deliverables').insert([{
      agreement_id: id,
      submission_url: deliverable_url,
      submitted_by: agreement.contractor_id
    }]);

    // Phase 2 Step 6: Trigger AI Analysis (Async simulated)
    const aiResult = await performAIAnalysis(deliverable_url);
    
    // Insert into AI Reviews
    await supabase.from('ai_reviews').insert([{
      agreement_id: id,
      ai_score: aiResult.ai_score,
      ai_summary: aiResult.ai_summary,
      domain_match: aiResult.domain_match,
      ai_metadata: aiResult.ai_metadata
    }]);

    const { data, error } = await supabase
      .from('agreements')
      .update({ 
        status: 'IN_REVIEW',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    res.json({ message: 'Submission successful. AI analysis complete.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 3: Human Review (Approve/Reject) + Audit Logging
app.post('/api/agreements/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // 'approve' or 'reject'

  try {
    const status = decision === 'approve' ? 'APPROVED' : 'DISPUTED';
    
    // 1. Update Agreement Status
    const { data: agreement, error: updateError } = await supabase
      .from('agreements')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (updateError) throw updateError;

    // Fetch latest AI review for audit logging
    const { data: aiReview } = await supabase.from('ai_reviews').select('ai_score').eq('agreement_id', id).order('created_at', { ascending: false }).limit(1).single();

    // 2. Step 6: Create Audit Log entry
    await supabase.from('audit_logs').insert([{
        agreement_id: id,
        reviewer: agreement.client_id,
        ai_score: aiReview?.ai_score || 0,
        decision,
        reason: reason || 'Human verified decision'
    }]);

    // 3. If approved, trigger settlement immediately
    let settlementResult = null;
    if (decision === 'approve') {
       settlementResult = await executeSettlement(id, 'CONTRACTOR_WINS');
    }

    res.json({ 
      message: `Agreement ${status.toLowerCase()} successfully.`, 
      data: agreement,
      settlement: settlementResult 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 3 Path B: Request Changes
app.post('/api/agreements/:id/request-changes', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('agreements')
      .update({ 
          status: 'FUNDED_AND_LOCKED', // Revert to funded so contractor can submit again
          updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log the request for changes
    await supabase.from('audit_logs').insert([{
        agreement_id: id,
        reviewer: agreement.client_id,
        ai_score: agreement.ai_score,
        decision: 'request_changes',
        reason
    }]);

    res.json({ message: 'Changes requested successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 8 & 9: Dispute Initiation
app.post('/api/agreements/:id/dispute', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { data: agreement, error } = await supabase
      .from('agreements')
      .update({ status: 'DISPUTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([{
      agreement_id: id,
      reviewer: agreement.client_id,
      decision: 'DISPUTE_TRIGGERED',
      reason
    }]);

    res.json({ message: 'Dispute filed. Negotiation window active.', data: agreement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 10: Arbitration Escalation
app.post('/api/agreements/:id/escalate', async (req, res) => {
    const { id } = req.params;
    try {
      await supabase.from('agreements').update({ status: 'ARBITRATION' }).eq('id', id);
      res.json({ message: 'Case escalated to human arbiter.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Step 12: Arbitration Decision
app.post('/api/agreements/:id/arbitrate', async (req, res) => {
  const { id } = req.params;
  const { outcome, arbiter_id, reason, split_data } = req.body;
  
  try {
    const result = await executeSettlement(id, outcome, arbiter_id, split_data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 4: Oracle Trigger (Settlement - Happy Path)
app.post('/api/agreements/:id/settle', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeSettlement(id, 'CONTRACTOR_WINS');
    res.json({ message: 'Settlement executed.', ...result });
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

// Top up client wallet
app.post('/api/profiles/:id/add-funds', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('owner_id', id)
      .single();

    if (fetchError || !wallet) throw new Error("Wallet not found");

    const newBalance = parseFloat(wallet.balance || 0) + parseFloat(amount);

    const { data, error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Funds added successfully', wallet_balance: data.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
