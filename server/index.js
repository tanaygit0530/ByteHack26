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

import { extractGithubDetails, fetchGithubData, analyzeRepositoryAI } from './services/verificationService.js';

// Phase 4: Bilateral Negotiation (Update Agreement)
app.put('/api/agreements/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, deliverables, amount, deadline } = req.body;

  try {
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) return res.status(404).json({ error: "Agreement not found" });
    if (agreement.status !== 'AGREEMENT_CREATED') {
      return res.status(400).json({ error: "Cannot modify agreement once it has been accepted or funded." });
    }

    const { data, error } = await supabase
      .from('agreements')
      .update({
        title,
        description,
        deliverables,
        amount,
        deadline,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log the negotiation change
    await supabase.from('audit_logs').insert([{
      agreement_id: id,
      decision: 'negotiation_update',
      reason: 'Bilateral terms adjusted during draft phase.'
    }]);

    res.json({ message: "Agreement updated successfully", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 1 Step 3: Immutable Fee Ledger Logic (Phase 4 Version)
const calculateImmutableLedger = (amount) => {
  const totalAmount = parseFloat(amount);

  const platform_fee = totalAmount * 0.01; // 1% Platform Fee
  const estimated_tax = totalAmount * 0.18; // 18% Regulatory Tax Reserve
  const receiver_amount = totalAmount - platform_fee - estimated_tax;

  return {
    platform_fee,
    estimated_tax,
    receiver_amount
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
      .select('*')
      .eq('id', agreementId)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found: " + (fetchError?.message || "No data"));

    const { amount, receiver_id, payer_id } = agreement;
    let receiverPayout = 0;
    let payerRefund = 0;
    let status = 'SETTLED';

    const { data: client } = await supabase.from('profiles').select('*').eq('id', payer_id).single();
    const { data: contractor } = await supabase.from('profiles').select('*').eq('id', receiver_id).single();

    agreement.payer = client;
    agreement.receiver = contractor;

    const ledger = calculateImmutableLedger(amount);

    if (outcome === 'CONTRACTOR_WINS') {
      receiverPayout = ledger.receiver_amount;
      status = 'PAID';
    } else if (outcome === 'CLIENT_WINS') {
      payerRefund = parseFloat(amount); // Refund total deposit
      status = 'REFUNDED';
    } else if (outcome === 'PARTIAL_SETTLEMENT') {
      const receiverCut = parseFloat(splitData.contractor_percent) || 50;
      receiverPayout = (ledger.receiver_amount * receiverCut) / 100;
      payerRefund = parseFloat(amount) - receiverPayout - ledger.platform_fee - ledger.gst_amount - ledger.digital_service_tax;
      status = 'PARTIAL_SETTLED';
    }

    // 4. Compliance Engine: Record Tax Liability
    await supabase.from('tax_records').insert([{
      agreement_id: agreementId,
      total_amount: amount,
      platform_fee: ledger.platform_fee,
      jurisdiction_client: agreement.payer?.country || 'USA',
      jurisdiction_contractor: agreement.receiver?.country || 'India',
      estimated_tax: ledger.estimated_tax,
      net_payout: receiverPayout,
      status: 'liability_recorded'
    }]);

    // Process Receiver Payout
    if (receiverPayout > 0) {
      const { data: cWallet } = await supabase.from('wallets').select('id, balance').eq('owner_id', receiver_id).single();
      await supabase.from('wallets').update({ balance: parseFloat(cWallet.balance) + receiverPayout }).eq('id', cWallet.id);
      await supabase.from('transactions').insert([{
        to_wallet: cWallet.id,
        amount: receiverPayout,
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

    // Process Payer Refund
    if (payerRefund > 0) {
      const { data: clWallet } = await supabase.from('wallets').select('id, balance').eq('owner_id', payer_id).single();
      await supabase.from('wallets').update({ balance: parseFloat(clWallet.balance) + payerRefund }).eq('id', clWallet.id);
      await supabase.from('transactions').insert([{
        to_wallet: clWallet.id,
        amount: payerRefund,
        type: 'REFUND',
        agreement_id: agreementId
      }]);
    }

    // Final Audit Log
    const { data: aiReview } = await supabase.from('ai_reviews').select('ai_score').eq('agreement_id', agreementId).order('created_at', { ascending: false }).limit(1).single();
    await supabase.from('audit_logs').insert([{
      agreement_id: agreementId,
      reviewer: arbiterId || payer_id,
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
        payer: agreement.payer?.country || 'USA',
        receiver: agreement.receiver?.country || 'India'
      },
      financials: {
        gross: amount,
        platform_fee: agreement.platform_fee,
        gst_amount: agreement.gst_amount,
        digital_service_tax: agreement.digital_service_tax,
        receiver_received: receiverPayout,
        payer_refunded: payerRefund
      },
      tax_liability_estimate: {
        rate: "10%",
        obligation_usd: (parseFloat(amount) * 0.10).toFixed(2),
        note: "Receiver responsible for local remittance"
      },
      proof_of_work: {
        submission: latestDeliverable?.submission_url,
        ai_confidence: aiReview?.ai_score
      }
    };

    // 7. Immutable Settlement Certificate: Persist to dedicated table
    await supabase.from('settlement_certificates').insert([{
      agreement_id: agreementId,
      tx_hash: complianceReport.tx_hash,
      certificate_data: complianceReport
    }]);

    // Update Contractor Health Metrics
    if (outcome === 'CONTRACTOR_WINS' || outcome === 'PARTIAL_SETTLEMENT') {
      const { data: prof } = await supabase.from('profiles').select('completed_projects, resolved_disputes').eq('id', receiver_id).single();
      const updates = { completed_projects: (prof?.completed_projects || 0) + 1 };
      if (agreement.status === 'DISPUTED') {
        updates.resolved_disputes = (prof?.resolved_disputes || 0) + 1;
      }
      await supabase.from('profiles').update(updates).eq('id', receiver_id);
    }

    await supabase.from('agreements')
      .update({
        status,
        platform_fee: ledger.platform_fee,
        estimated_tax: ledger.estimated_tax,
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
  const { title, description, deliverables, amount, deadline, receiver_id, payer_id, trigger_type, agreement_type } = req.body;
  if (!supabase) return res.status(500).json({ error: "Supabase client not initialized" });

  try {
    // SELF-HEALING: Ensure profiles and wallets exist 
    const ensureProfile = async (id, name, role, country, email, balance) => {
      if (!id) return;
      const { data } = await supabase.from('profiles').select('id').eq('id', id).single();
      if (!data) {
        await supabase.from('profiles').upsert([{ id, full_name: name, role, country, email, kyc_status: 'VERIFIED' }]);
        await supabase.from('wallets').upsert([{ owner_id: id, balance }]);
      }
    };

    await ensureProfile(payer_id, 'Acme Corp (Client)', 'client', 'USA', 'client@nexus.com', 50000);
    await ensureProfile(receiver_id, 'Jane Doe (Contractor)', 'contractor', 'India', 'contractor@nexus.com', 200);

    // Fetch client and contractor countries for tax calculation
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, country')
      .in('id', [payer_id, receiver_id].filter(Boolean));

    const client = profiles?.find(p => p.id === payer_id);
    const contractor = profiles?.find(p => p.id === receiver_id);

    // Calculate Immutable Ledger
    const ledger = calculateImmutableLedger(amount);

    const { data, error } = await supabase
      .from('agreements')
      .insert([{
        title, description, deliverables, amount, deadline, payer_id, receiver_id,
        trigger_type: trigger_type || 'manual_review', status: 'AGREEMENT_CREATED',
        agreement_type: agreement_type || 'ESCROW', ...ledger
      }])
      .select().single();

    if (error) throw error;

    // Increment Total Projects for Contractor
    const { data: contractorProfile } = await supabase.from('profiles').select('total_projects').eq('id', receiver_id).single();
    await supabase.from('profiles').update({ total_projects: (contractorProfile?.total_projects || 0) + 1 }).eq('id', receiver_id);

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
      .select('amount, payer_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found: " + (fetchError?.message || "No data"));
    if (agreement.status !== 'ACCEPTED' && agreement.status !== 'AGREEMENT_CREATED') {
      throw new Error("Agreement must be in CREATED or ACCEPTED status before funding");
    }

    const amountToDeduct = parseFloat(agreement.amount);

    // Get Client Wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('owner_id', agreement.payer_id)
      .single();

    if (walletError || !wallet) {
      // Auto-create wallet if missing
      const { data: newWallet } = await supabase.from('wallets').insert([{ owner_id: agreement.payer_id, balance: 50000 }]).select().single();
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
      .update({ status: 'ESCROW_FUNDED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    res.json({ message: 'Capital secured and locked in vault.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Lock Escrow
app.post('/api/agreements/:id/lock', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('agreements')
      .update({ status: 'ESCROW_LOCKED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    res.json({ message: 'Escrow vault locked and secured.', data });
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
app.post('/api/agreements/:id/accept-receiver', async (req, res) => {
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
    res.json({ message: 'Agreement accepted by Receiver.', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 5: Work Submission
app.post('/api/agreements/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { deliverable_url } = req.body;

  try {
    // Fetch agreement to verify and get deliverables
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('receiver_id, deliverables')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found: " + (fetchError?.message || "No data"));

    // Insert into Deliverables
    await supabase.from('deliverables').insert([{
      agreement_id: id,
      submission_url: deliverable_url,
      submitted_by: agreement.receiver_id
    }]);

    // 1. Extract GitHub details
    const repoDetails = extractGithubDetails(deliverable_url);
    if (!repoDetails) {
      throw new Error("Invalid GitHub URL provided.");
    }

    // 2. Fetch GitHub Data
    const githubData = await fetchGithubData(repoDetails.owner, repoDetails.repo);

    // 3. AI Analysis
    const aiData = await analyzeRepositoryAI(agreement.deliverables, githubData);

    // Save directly to agreements
    const { data: updatedAgreement, error: updateError } = await supabase
      .from('agreements')
      .update({
        ai_score: aiData.confidence_score,
        ai_summary: aiData.summary,
        domain_match: aiData.domain_match,
        status: 'WORK_SUBMITTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select().single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      ai_score: aiData.confidence_score,
      ai_summary: aiData.summary,
      data: updatedAgreement
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Phase 3: Human Review (Approve/Reject) + Audit Logging
app.post('/api/agreements/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // 'approve' or 'reject'

  try {
    let result;
    if (decision === 'approve') {
      result = await executeSettlement(id, 'CONTRACTOR_WINS');
    } else {
      const { data: agreement, error: updateError } = await supabase
        .from('agreements')
        .update({ status: 'DISPUTED', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select().single();
      if (updateError) throw updateError;
      result = { status: 'DISPUTED', ...agreement };
    }

    // Fetch latest AI review for audit logging
    const { data: aiReview } = await supabase.from('ai_reviews').select('ai_score').eq('agreement_id', id).order('created_at', { ascending: false }).limit(1).single();

    // 2. Step 6: Create Audit Log entry
    await supabase.from('audit_logs').insert([{
      agreement_id: id,
      reviewer: result.payer_id,
      ai_score: aiReview?.ai_score || 0,
      decision,
      reason: reason || 'Human verified decision'
    }]);

    res.json({
      message: `Agreement ${result.status.toLowerCase()} successfully.`,
      data: result
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
      reviewer: agreement.payer_id,
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
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .update({ status: 'DISPUTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();

    if (fetchError) throw fetchError;

    // Increment Total Disputes for Contractor
    const { data: cond } = await supabase.from('profiles').select('total_disputes').eq('id', agreement.receiver_id).single();
    await supabase.from('profiles').update({ total_disputes: (cond?.total_disputes || 0) + 1 }).eq('id', agreement.receiver_id);

    await supabase.from('audit_logs').insert([{
      agreement_id: id,
      reviewer: agreement.payer_id,
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
    res.json({ message: 'Settlement executed via manual approval.', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 4: Oracle Settlement Trigger (Post-Verification/Webhook/n8n)
app.post('/api/settlement-trigger', async (req, res) => {
  const { project_id, oracle_status } = req.body;
  if (oracle_status !== 'approved' && oracle_status !== 'conditions_met') {
    return res.status(400).json({ error: "Oracle condition not met." });
  }

  try {
    const result = await executeSettlement(project_id, 'CONTRACTOR_WINS');
    res.json({ message: 'Oracle trigger accepted. Settlement processed.', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 4: GitHub PR/Merge Webhook Handler
app.post('/api/webhooks/github', async (req, res) => {
  const { action, pull_request, repository } = req.body;

  // Only trigger if a PR is merged
  if (action === 'closed' && pull_request?.merged) {
    const repoUrl = repository.html_url;

    // Find the agreement associated with this repo
    const { data: agreement } = await supabase
      .from('deliverables')
      .select('agreement_id')
      .eq('submission_url', repoUrl)
      .single();

    if (agreement) {
      console.log(`🚀 GitHub Oracle: Merge detected for ${repoUrl}. Triggering settlement...`);
      await executeSettlement(agreement.agreement_id, 'CONTRACTOR_WINS');
      return res.json({ message: "GitHub Oracle Triggered Settlement." });
    }
  }

  res.json({ message: "Webhook received but no trigger action taken." });
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
    let { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('owner_id', id)
      .single();

    if (fetchError || !wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert([{ owner_id: id, balance: 0 }]).select().single();
      wallet = newWallet;
    }

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

// Phase 4: Reject/Cancel Agreement
app.delete('/api/agreements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) return res.status(404).json({ error: "Agreement not found" });
    if (agreement.status !== 'AGREEMENT_CREATED' && agreement.status !== 'ACCEPTED') {
      return res.status(400).json({ error: "Cannot reject an agreement that is already funded or in progress." });
    }

    const { error } = await supabase
      .from('agreements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: "Agreement cancelled and removed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
