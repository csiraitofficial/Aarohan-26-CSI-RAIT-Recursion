# Ã°Å¸Å¡â‚¬ Healix Project - Complete Setup & Run Guide

## Prerequisites

- Both `npm install` commands have been successfully run in both backend and frontend folders
- Node.js 16+ installed
- Supabase account with the project set up

## Ã¢Å¡Â Ã¯Â¸Â Critical Setup - Database Schema

### Step 1: Create Database Tables

1. Go to https://supabase.com/dashboard
2. Select your Healix project
3. Go to **SQL Editor** (left sidebar)
4. Click **Create a new query**
5. Copy and paste the entire content from `backend/supabase_schema.sql`
6. Click **Run**

This will create:

- Ã¢Å“â€¦ `users` table (stores user profile and FCM tokens)
- Ã¢Å“â€¦ `health_records` table (stores medical records)
- Ã¢Å“â€¦ `medicine_reminders` table (stores medicine reminder schedules)
- Ã¢Å“â€¦ `appointments` table (stores appointment data)
- Ã¢Å“â€¦ Row Level Security (RLS) policies for data protection

## Ã°Å¸Å½Â¯ Running the Project

### Option A: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**

```bash
cd Curo-main/backend
npm run dev
```

Backend will run on `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd Curo-main/curo-frontend
npm run dev
```

Frontend will run on `http://localhost:5173` or `5174` if port is busy

### Option B: Run Both in One Command

```bash
# From project root
start npm run dev  # Backend
start npm run dev  # Frontend
```

## Ã¢Å“â€¦ Verification Checklist

After starting both services:

- [ ] Backend at `http://localhost:3000` - Should see Express server running (no "Table not found" errors)
- [ ] Frontend at `http://localhost:5173` - Should see Healix landing page
- [ ] No console errors in frontend terminal
- [ ] Scheduler running without "table not found" errors in backend

## Ã°Å¸â€Â§ Environment Variables

**Backend (.env)** - Already configured:

- Ã¢Å“â€¦ Supabase credentials
- Ã¢Å“â€¦ Firebase credentials
- Ã¢Å“â€¦ Other API keys configured

**Frontend** - Uses Firebase config from `src/lib/firebase.ts`

## Ã°Å¸Ââ€º Troubleshooting

| Issue                                    | Solution                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| `"Table 'medicine_reminders' not found"` | Run the SQL schema in Supabase (see Step 1)            |
| `Port 3000 already in use`               | Change backend port in `.env` or kill existing process |
| `Port 5173 already in use`               | Vite will automatically try 5174, 5175, etc.           |
| `Module not found`                       | Run `npm install` in the respective folder             |
| `Firebase authentication errors`         | Check `.env` and `firebase.ts` credentials are valid   |

## Ã°Å¸â€œÅ¡ Key Features Available

Once fully running:

- Ã°Å¸ÂÂ¥ Dashboard with appointments and health metrics
- Ã°Å¸â€™Å  Medicine Reminder tracker
- Ã°Å¸Â¤â€“ MediChat - AI Doctor chatbot
- Ã°Å¸â€™Â° Medicine Price Comparison
- Ã°Å¸â€œÅ  Insurance Premium Predictor
- Ã°Å¸â€”ÂºÃ¯Â¸Â Find Nearby Healthcare Services
- Ã°Å¸â€œâ€¹ Health Records Management

## Ã°Å¸â€Â Note on RLS (Row Level Security)

The schema includes RLS policies that ensure:

- Users can only see/edit their own data
- Database queries are secured at the Supabase level
- Authentication via Firebase UID

If you face permission errors, verify:

1. User is properly authenticated in Firebase
2. RLS policies are enabled in Supabase
3. Service key used has proper permissions

---

**Questions?** Check the README.md or review the API endpoints documented there.
