# Nexus Implementation Plan

Welcome to the Nexus codebase. This is a programmable finance cross-border escrow application built with React, Node.js, and Supabase.

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy and paste the contents of `supabase_schema.sql` (located in the root directory) and run it. This will create the necessary tables, enums, and RLS policies.

### 2. Environment Variables
You need to configure the `.env` files for both the client and the server.

#### Frontend (`client/.env`)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Backend (`server/.env`)
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
> [!IMPORTANT]
> Use the **Service Role Key** for the backend to allow it to bypass RLS for administrative tasks like disbursement.

### 3. Install Dependencies
Run the following in the root directory:
```bash
# Frontend
cd client && npm install

# Backend
cd ../server && npm install
```

### 4. Run the Application
You will need two terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
node index.js
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

## 🛠 Features Implemented

### 1. Dual-Role Authentication
Users can sign up as either a **Client** or a **Contractor**. The UI adapts based on the role stored in the `profiles` table.

### 2. Smart Agreement Workflow
The app follows the mandated 5-state machine:
- **Initiation**: Client creates a draft.
- **Funding**: Client simulates a deposit (Locks funds in vault).
- **Execution**: Contractor submits work (Simulated).
- **Verification**: Client approves the deliverable.
- **Disbursement**: The system automatically splits the funds (2% Platform, 10% Tax, 88% Contractor).

### 3. Impact Metrics
- **Real-time Ledger**: A custom progress bar shows exactly where the money is.
- **Settlement Comparison**: Highlights the speed of Nexus vs. traditional SWIFT payments.

## 📂 Project Structure
- `client/`: React + Vite + Tailwind CSS frontend.
- `server/`: Node.js + Express backend for programmable logic.
- `supabase_schema.sql`: Database definitions for Supabase.
# ByteHack26
