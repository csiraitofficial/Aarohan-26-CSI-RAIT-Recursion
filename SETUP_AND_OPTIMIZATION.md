# Healix Project Setup & Optimization Guide

## ðŸš€ Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server will run on: `http://localhost:3000`

### Frontend Setup

```bash
cd curo-frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:5174`

---

## ðŸ“‹ Feature Status & Required Configuration

### âœ… Features That Work Without API Keys (Core Features)

1. **Medicine Reminder** âœ“
   - Status: Fully functional
   - Database: Supabase (configured)
   - No external API keys required

2. **Health Records** âœ“
   - Status: Fully functional
   - Database: Supabase (configured)
   - File upload support enabled
   - No external API keys required

3. **Medicine Price Comparison** âœ“
   - Status: Fully functional
   - Uses public pharmacy APIs (PharMeasy, 1mg, Apollo Pharmacy)
   - Real-time price scraping
   - No API key required

4. **Insurance Premium Predictor** âœ“
   - Status: Fully functional
   - Uses ONNX ML models (LightGBM, Random Forest)
   - Models included locally
   - No API key required

### âš ï¸ Features That Need API Keys (Optional External Services)

1. **MediChat AI Doctor**
   - Status: Requires API keys
   - Required Keys:
     - `GROQ_API_KEY` - LLM inference
     - `TAVILY_API_KEY` - Web search capability
     - `PINECONE_API_KEY` + `PINECONE_INDEX` - Vector database
   - To enable:
     1. Get GROQ API Key: https://console.groq.com
     2. Get Tavily API Key: https://tavily.com
     3. Setup Pinecone: https://www.pinecone.io
     4. Update `.env` file with real keys

2. **Nearby Services (Hospitals, Pharmacies, Doctors)**
   - Status: Requires API key
   - Required Key: `GOOGLE_MAPS_API_KEY`
   - To enable:
     1. Go to Google Cloud Console: https://cloud.google.com/maps-platform
     2. Enable Cloud Maps API
     3. Create an API key
     4. Update `GOOGLE_MAPS_API_KEY` in `.env`

3. **Appointments Booking**
   - Status: Requires API keys
   - Required Keys:
     - `NEXHEALTH_API_KEY`
     - `NEXHEALTH_SUBDOMAIN`
     - `NEXHEALTH_LOCATION_ID`
   - To enable:
     1. Sign up at https://nexhealth.com
     2. Get API credentials
     3. Update `.env` with credentials

---

## ðŸ—„ï¸ Database Setup (Required Once)

### Create Supabase Tables

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy the entire content from `backend/supabase_schema.sql`
5. Click **Run** to execute

This creates:

- `users` table
- `health_records` table
- `medicine_reminders` table
- `appointments` table
- Row-level security policies

---

## ðŸ“Š Check Feature Status

### Via API

```bash
curl http://localhost:3000/api/features-status
```

Response example:

```json
{
  "features": {
    "medichat": { "enabled": false, "message": "Missing GROQ_API_KEY" },
    "nearbyServices": {
      "enabled": false,
      "message": "Missing GOOGLE_MAPS_API_KEY"
    },
    "appointments": {
      "enabled": false,
      "message": "Missing NEXHEALTH credentials"
    },
    "medicineReminder": { "enabled": true, "message": "Ready" },
    "healthRecords": { "enabled": true, "message": "Ready" },
    "medicinePrice": { "enabled": true, "message": "Ready" },
    "premiumPredictor": { "enabled": true, "message": "Ready" }
  }
}
```

---

## âš¡ Performance Optimizations Already Applied

### Frontend Optimizations

âœ… Code splitting with lazy loading
âœ… Route-based code splitting
âœ… Vite build optimizations (minification, terser)
âœ… Manual chunk splitting for vendor libraries
âœ… API proxy configuration for local development

### Backend Optimizations

âœ… CORS configuration
âœ… Parallel API requests for medicine search
âœ… Connection pooling
âœ… Error handling and graceful degradation

---

## ðŸ› ï¸ Environment Variables

Create `.env` file in `backend/` folder:

```env
PORT=3000

# Supabase (REQUIRED - must be configured)
SUPABASE_URL=https://biqohhlgwgobyvbbwzvq.supabase.co
SUPABASE_SERVICE_KEY=your_key_here

# Firebase (REQUIRED - must be configured)
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_domain_here
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
FIREBASE_APP_ID=your_app_id_here

# Optional - for enhanced features
GOOGLE_MAPS_API_KEY=dummy  # Add your key to enable nearby services
PINECONE_API_KEY=dummy  # Add your key to enable MediChat
PINECONE_INDEX=dummy  # Add your index to enable MediChat
GROQ_API_KEY=dummy  # Add your key to enable MediChat
TAVILY_API_KEY=dummy  # Add your key to enable MediChat
NEXHEALTH_API_KEY=dummy  # Add your key to enable appointments
NEXHEALTH_SUBDOMAIN=dummy
NEXHEALTH_LOCATION_ID=dummy
```

---

## ðŸ”§ Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Supabase Connection Failed

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Ensure database tables exist (run schema.sql)
- Check network/firewall settings

### Firebase Auth Issues

- Verify Firebase project credentials
- Check if user is properly registered
- Clear browser cache

### Medicine Reminder Not Working

- Ensure database tables exist
- Check FCM token is set in user profile
- Verify scheduler is running (backend logs should show "Running scheduler...")

---

## ðŸ“¦ Building for Production

### Frontend

```bash
cd curo-frontend
npm run build
npm run preview
```

### Backend

```bash
cd backend
npm install --production
node index.js
```

---

## ðŸŽ¯ Current Feature Completeness

| Feature                    | Status          | Works Without Keys                |
| -------------------------- | --------------- | --------------------------------- |
| Medicine Reminder          | âœ… Complete     | Yes                               |
| Health Records             | âœ… Complete     | Yes                               |
| Medicine Price Comparison  | âœ… Complete     | Yes                               |
| Premium Predictor          | âœ… Complete     | Yes                               |
| MediChat AI Doctor         | âš ï¸ Needs Config | No (needs GROQ, Tavily, Pinecone) |
| Nearby Services            | âš ï¸ Needs Config | No (needs Google Maps API)        |
| Appointments               | âš ï¸ Needs Config | No (needs NexHealth)              |
| User Authentication        | âœ… Complete     | N/A (Firebase)                    |
| Fire messaging (Reminders) | âœ… Complete     | N/A (Firebase)                    |

---

## ðŸš€ To Enable All Features

1. **Get API Keys** for:
   - GROQ (for MediChat)
   - Tavily (for MediChat web search)
   - Pinecone (for MediChat vector DB)
   - Google Maps (for nearby services)
   - NexHealth (for appointments)

2. **Update `.env`** with real keys (don't use "dummy")

3. **Restart Backend**:

   ```bash
   npm run dev
   ```

4. **Check Status**:
   ```bash
   curl http://localhost:3000/api/features-status
   ```

---

## ðŸ“ž Support

For issues or questions:

1. Check the status endpoint: `/api/features-status`
2. Review backend logs for errors
3. Verify all environment variables are set
4. Ensure Supabase and Firebase are properly configured
