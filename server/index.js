import express from 'express';
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


// Helper function for disbursement logic
// Feature 5: The Programmable Logic Engine
const executeDisbursement = async (agreementId) => {
  try {
    // 1. Fetch agreement details
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*, client_id, contractor_id, amount')
      .eq('id', agreementId)
      .single();

    if (fetchError || !agreement) throw new Error("Agreement not found");
    if (agreement.status !== 'APPROVED') throw new Error("Agreement must be in APPROVED state for disbursement");

    const totalAmount = parseFloat(agreement.amount);
    
    // 2. Calculate splits
    const platformFee = totalAmount * 0.02; // 2%
    const taxWithholding = totalAmount * 0.10; // 10%
    const contractorPayout = totalAmount * 0.88; // 88%

    console.log(`Disbursing for ${agreementId}:`);
    console.log(`Total: $${totalAmount}`);
    console.log(`Platform (2%): $${platformFee}`);
    console.log(`Tax (10%): $${taxWithholding}`);
    console.log(`Contractor (88%): $${contractorPayout}`);

    // 3. Update contractor's wallet (Simulated)
    const { data: contractorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', agreement.contractor_id)
      .single();

    if (profileError) throw profileError;

    const newBalance = parseFloat(contractorProfile.wallet_balance || 0) + contractorPayout;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', agreement.contractor_id);

    if (updateError) throw updateError;

    // 4. Update agreement status to SETTLED
    const { error: statusError } = await supabase
      .from('agreements')
      .update({ status: 'SETTLED' })
      .eq('id', agreementId);

    if (statusError) throw statusError;

    return { success: true, splits: { platformFee, taxWithholding, contractorPayout } };
  } catch (error) {
    console.error("Disbursement failed:", error.message);
    throw error;
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Nexus API is running...');
});

// Feature 4: Mock Payment Trigger
app.post('/api/agreements/:id/simulate-payment', async (req, res) => {
  const { id } = req.params;
  if (!supabase) return res.status(500).json({ error: "Supabase client not initialized. Check .env" });
  try {
    const { data, error } = await supabase
      .from('agreements')
      .update({ status: 'FUNDED_AND_LOCKED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Payment simulated successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feature 4 & 5: Trigger Disbursement
app.post('/api/agreements/:id/settle', async (req, res) => {
  const { id } = req.params;
  if (!supabase) return res.status(500).json({ error: "Supabase client not initialized. Check .env" });
  try {
    const result = await executeDisbursement(id);
    res.json({ message: 'Disbursement executed successfully', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
