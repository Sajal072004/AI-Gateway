# AI Hybrid Gateway

A complete working prototype of an AI gateway system that routes requests to Google's Gemini API using tiered pricing (cheap/premium), with comprehensive usage tracking, limit enforcement, and an admin dashboard.

## 🏗️ Architecture

- **Gateway Backend**: Node.js + Fastify + MongoDB
- **Admin Dashboard**: Next.js (App Router) + Tailwind CSS
- **Database**: MongoDB (cloud-hosted)
- **AI Provider**: Google Gemini API (two keys for cheap/premium tiers)

## 📋 Features

### Gateway
- ✅ Tiered routing (cheap/premium) with auto-detection based on keywords and message length
- ✅ Per-user and global usage limits (daily/monthly, tokens/requests)
- ✅ Soft warnings at 80% and critical alerts at 95% of limits
- ✅ Request logging with detailed metrics
- ✅ Automatic fallback from premium to cheap on errors
- ✅ Token usage tracking with estimation fallback
- ✅ Timezone-aware (Asia/Kolkata) date calculations

### Admin Dashboard
- ✅ Real-time usage statistics and monitoring
- ✅ User policy management (limits, tiers, defaults)
- ✅ Request logs with filtering
- ✅ Data export (CSV/JSON)
- ✅ Session-based authentication
- ✅ BFF pattern (admin token never exposed to browser)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB cloud account (MongoDB Atlas recommended)
- Google Gemini API keys (get from https://aistudio.google.com/app/apikey)

### 1. Clone and Install

```bash
cd /Users/user/Documents/AI-Gateway

# Install gateway dependencies
cd gateway
npm install

# Install admin dependencies
cd ../admin
npm install
```

### 2. Configure Environment Variables

#### Gateway Configuration

Copy `gateway/.env.example` to `gateway/.env` and fill in your values:

```bash
cd gateway
cp .env.example .env
```

**Required values to add:**
- `MONGODB_URI`: Your MongoDB cloud connection string
- `GEMINI_KEY_CHEAP`: Your Gemini API key for cheap tier
- `GEMINI_KEY_PREMIUM`: Your Gemini API key for premium tier (can be same as cheap for testing)
- `ADMIN_TOKEN`: Generate a secure random token (e.g., `openssl rand -hex 32`)
- `USER_TOKEN_USERA`, `USER_TOKEN_USERB`, `USER_TOKEN_USERC`: Generate secure tokens for each user

#### Admin Dashboard Configuration

Copy `admin/.env.example` to `admin/.env.local` and fill in your values:

```bash
cd ../admin
cp .env.example .env.local
```

**Required values to add:**
- `ADMIN_TOKEN`: Same value as in gateway/.env
- `SESSION_SECRET`: Generate a secure random string (e.g., `openssl rand -base64 32`)
- `ADMIN_PASSWORD`: Password for admin login (can be same as ADMIN_TOKEN)

### 3. Start the Services

#### Start Gateway (Terminal 1)

```bash
cd gateway
npm run dev
```

The gateway will:
- Connect to MongoDB
- Seed initial data (SystemPolicy and 3 UserPolicy documents)
- Start on http://localhost:8080

#### Start Admin Dashboard (Terminal 2)

```bash
cd admin
npm run dev
```

The admin dashboard will start on http://localhost:3000

### 4. Access the Admin Dashboard

1. Open http://localhost:3000
2. Login with your `ADMIN_PASSWORD`
3. Explore the dashboard!

## 📊 Seed Data

The system automatically creates the following on first startup:

### System Policy (Global Limits)
- **Daily Token Limits**: Cheap: 2M, Premium: 500K
- **Monthly Token Limits**: Cheap: 60M, Premium: 15M
- **Daily Request Limits**: Cheap: 5K, Premium: 2K
- **Monthly Request Limits**: Cheap: 150K, Premium: 60K
- **Thresholds**: Warning: 80%, Critical: 95%

### User Policies

**userA** (cheap only):
- Allowed tiers: `['cheap']`
- Default tier: `cheap`
- Daily token limit: Cheap: 200K, Premium: 0
- Monthly token limit: Cheap: 5M, Premium: 0
- Daily request limit: Cheap: 200, Premium: 0
- Monthly request limit: Cheap: 5K, Premium: 0

**userB** (cheap + premium with small premium budget):
- Allowed tiers: `['cheap', 'premium']`
- Default tier: `auto`
- Daily token limit: Cheap: 200K, Premium: 30K
- Monthly token limit: Cheap: 5M, Premium: 600K
- Daily request limit: Cheap: 200, Premium: 30
- Monthly request limit: Cheap: 5K, Premium: 600

**userC** (premium default, large premium budget):
- Allowed tiers: `['cheap', 'premium']`
- Default tier: `premium`
- Daily token limit: Cheap: 200K, Premium: 200K
- Monthly token limit: Cheap: 5M, Premium: 5M
- Daily request limit: Cheap: 200, Premium: 200
- Monthly request limit: Cheap: 5K, Premium: 5K

## 🧪 Testing with cURL

### 1. UserA - Cheap Only Request

```bash
curl -X POST http://localhost:8080/v1/chat \
  -H "Authorization: Bearer YOUR_USER_TOKEN_USERA" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

**Expected**: Uses cheap tier, returns usage and limits

### 2. UserA - Premium Request (Should Downgrade)

```bash
curl -X POST http://localhost:8080/v1/chat \
  -H "Authorization: Bearer YOUR_USER_TOKEN_USERA" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "premium",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**Expected**: Downgrades to cheap (routingReason: 'downgrade_not_allowed')

### 3. UserB - Auto Routing (Keyword Trigger)

```bash
curl -X POST http://localhost:8080/v1/chat \
  -H "Authorization: Bearer YOUR_USER_TOKEN_USERB" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "auto",
    "messages": [
      {"role": "user", "content": "Please analyze this complex data"}
    ]
  }'
```

**Expected**: Routes to premium (routingReason: 'auto_keyword' because "analyze" and "complex" are keywords)

### 4. UserB - Auto Routing (Character Count Trigger)

```bash
curl -X POST http://localhost:8080/v1/chat \
  -H "Authorization: Bearer YOUR_USER_TOKEN_USERB" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "auto",
    "messages": [
      {"role": "user", "content": "'"$(python3 -c "print('a' * 600)")"'"}
    ]
  }'
```

**Expected**: Routes to premium (routingReason: 'auto_chars' because > 500 chars)

### 5. UserB - Hit Daily Premium Request Limit

Run this script to make 31 premium requests (limit is 30/day):

```bash
#!/bin/bash
for i in {1..31}; do
  echo "Request $i"
  curl -X POST http://localhost:8080/v1/chat \
    -H "Authorization: Bearer YOUR_USER_TOKEN_USERB" \
    -H "Content-Type: application/json" \
    -d '{
      "tier": "premium",
      "messages": [{"role": "user", "content": "Test"}]
    }'
  echo ""
done
```

**Expected**: First 30 succeed, 31st returns 429 with limit_exceeded error

### 6. Check Usage in Dashboard

After running requests:
1. Open http://localhost:3000/dashboard
2. Verify usage stats update
3. Check warning/critical status indicators

## 🔄 Routing Logic

### Tier Selection

1. **Explicit tier**: If `tier` is provided in request body → use that tier
2. **Default tier**: If no tier provided → use user's `defaultTier` from policy
3. **Auto tier**: If tier is `auto` → apply heuristics:
   - If prompt chars > 500 → premium
   - If any keyword matches (analyze, complex, detailed, etc.) → premium
   - Otherwise → cheap

### Tier Validation

- If selected tier is not in user's `allowedTiers`:
  - If `cheap` is allowed → downgrade to cheap
  - Otherwise → reject with 403

### Fallback

- If premium tier fails with 429 or 5xx error:
  - Retry once with cheap tier (if allowed)
  - Set routingReason to 'fallback'

## 📈 Limits Enforcement

### Pre-Check (Before Provider Call)

1. Estimate prompt tokens: `Math.floor(promptChars / 4)`
2. Check if adding +1 request and +estimatedTokens would exceed:
   - User daily token limit
   - User monthly token limit
   - User daily request limit
   - User monthly request limit
   - Global daily token limit
   - Global monthly token limit
   - Global daily request limit
   - Global monthly request limit
3. If any limit exceeded → return 429 immediately

### Post-Call Updates

1. Reserve request counters (atomic increment)
2. Call Gemini provider
3. Update token counters with actual usage (atomic increment)
4. Calculate limit status (ok/warning/critical)
5. Log request to database

### Soft Warnings

- **OK**: Usage < 80% of limit
- **WARNING**: Usage >= 80% and < 95%
- **CRITICAL**: Usage >= 95%

These statuses are returned in the response and displayed in the dashboard.

## 📁 Data Model

### Collections

1. **UserPolicy**: User-specific limits and tier configuration
2. **SystemPolicy**: Global limits and threshold settings (singleton)
3. **UsageRollup**: Daily and monthly usage counters (user + global scope)
4. **RequestLog**: Detailed request logs with metrics

### Indexes

- UsageRollup: Compound unique index on (periodType, period, scope, userId, tier)
- RequestLog: Indexes on day, month, userId, ts, tierUsed, status

## 🎯 Admin Dashboard Pages

### /dashboard
- Global stats (today/month totals, premium share, requests)
- Progress bars for global limits with thresholds
- User overview table with status indicators

### /users
- User policy management (inline editing)
- Edit allowed tiers, default tier, limits
- Progress bars showing usage vs limits

### /logs
- Request logs table with filtering
- Filter by userId, tier, status, limit
- Shows timestamp, requestId, tier, status, latency, tokens, routing reason

### /exports
- Export usage data (daily/monthly)
- Export request logs
- Format: CSV or JSON
- Date range selection

## ⚠️ Known Limitations

### Race Conditions

The prototype uses a **pre-check + post-update** pattern for usage rollups rather than full transactional reservations. This means:

- There's a small window between the pre-check and the actual update
- Under high concurrency, limits could be slightly exceeded
- For production, consider implementing:
  - MongoDB transactions
  - Optimistic locking
  - Request reservation pattern with rollback

### Token Estimation

- If Gemini API doesn't return token counts, we estimate: `chars / 4`
- This is marked with `estimated: true` in the response
- Actual token counts may vary

### Timezone

- All date calculations use **Asia/Kolkata** timezone
- Day format: YYYY-MM-DD
- Month format: YYYY-MM
- Ensure your system timezone doesn't cause confusion

## 🛠️ Development

### Gateway Structure

```
gateway/src/
├── index.js              # Main server
├── env.js                # Environment config
├── db/
│   ├── mongo.js          # DB connection + seed
│   └── models/           # Mongoose models
├── auth/                 # Authentication middleware
├── provider/             # Gemini API integration
├── policy/               # Routing + limits logic
├── routes/               # API endpoints
└── utils/                # Utilities (time, CSV, etc.)
```

### Admin Structure

```
admin/
├── app/
│   ├── api/              # BFF routes
│   ├── dashboard/        # Dashboard page
│   ├── users/            # Users page
│   ├── logs/             # Logs page
│   └── exports/          # Exports page
├── components/           # Reusable UI components
└── lib/                  # Session + gateway client
```

## 📝 API Endpoints

### User Endpoints

- `POST /v1/chat` - Main chat endpoint (requires user Bearer token)

### Admin Endpoints (require admin Bearer token)

- `GET /admin/api/system` - Get system policy + global usage
- `PUT /admin/api/system` - Update system policy
- `GET /admin/api/users` - Get all users + usage
- `PUT /admin/api/users/:userId` - Update user policy
- `GET /admin/api/usage` - Get aggregated usage
- `GET /admin/api/logs` - Get request logs
- `POST /admin/api/reset` - Reset usage rollups
- `GET /admin/api/export` - Export data (CSV/JSON)

## 🔐 Security Notes

- Admin token is NEVER exposed to the browser (BFF pattern)
- Session cookies are HttpOnly and signed
- User tokens are mapped server-side
- All admin operations require authentication

## 📞 Support

For issues or questions, check the implementation plan and task.md in the artifacts directory.

## 📄 License

MIT
