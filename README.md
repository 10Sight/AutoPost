# Auto Posting - Social Media Management Platform

> **Built for creators, agencies, and teams requiring reliable, extensible social media automation.**

An enterprise-grade social media automation platform designed for scheduling, managing, and analyzing content at scale. Features native **YouTube** integration alongside Instagram, Facebook, LinkedIn, and X (Twitter).

## 🚀 Platform Capabilities

### 📱 Multi-Channel Support
- **YouTube**: Full OAuth lifecycle, resumable video uploads, metadata management, and audience analytics.
- **Social Suite**: Native posting support for Instagram (Business), Facebook, LinkedIn, and X (Twitter).

### 🛠️ Core Functionality
- **Smart Scheduler**: Drag-and-drop calendar with conflict detection and timezone support.
- **Media Asset Management**: Centralized, searchable library for high-resolution images and videos.
- **Multi-Tenancy**: Secure organization isolation with granular Role-Based Access Control (RBAC).
- **Advanced Analytics**: Actionable insights into engagement metrics and content performance.
- **Compliance & Auditing**: Immutable audit logs for all sensitive user actions.
- **Resource Management**: System-wide quota enforcement to control costs and prevent API abuse.

### 💻 Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Redux Toolkit.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Infrastructure**: Redis (Queue), Cloudinary (CDN), Socket.io (Real-time).

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)
- Cloudinary Account
- Google Cloud Console Project (for YouTube API)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd auto-posting
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in `server/` with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autoposting
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google / YouTube API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/dashboard/accounts
```

```bash
npm run dev
```

### 3. Environment Configuration

The application authenticates its environment via `NODE_ENV`.
- **Development**: Loads `.env.development` (fallback to `.env`). Logs are verbose (Debug).
- **Production**: Loads `.env.production`. Logs are minimal (Info/Error).

**Sample `.env` structure:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development # or production
MONGO_URI=mongodb://localhost:27017/autoposting

# Security
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=super_secret_refresh_key
REFRESH_TOKEN_EXPIRY=7d
ENCRYPTION_KEY=32_byte_hex_string # generate via crypto.randomBytes(32).toString('hex')

# Cloudinary
CLOUDINARY_CLOUD_NAME=my_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=my_api_secret

# Google / YouTube
GOOGLE_CLIENT_ID=my_google_client_id
GOOGLE_CLIENT_SECRET=my_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/dashboard/accounts
```

---

### 4. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

Create a `.env` file in `client/` (if customized configuration is needed, otherwise defaults apply):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the development server:
```bash
npm run dev
```

---

## 📺 YouTube Integration Details

The platform now supports a full YouTube workflow:

1.  **Connect**: Users authenticate via Google OAuth 2.0.
2.  **Upload**: Supports large video files using resumable uploads.
3.  **Metadata**: scalable title, description, tags, category, and privacy status (Public, Private, Unlisted).
4.  **Thumbnails**: Upload custom thumbnails directly during post creation.
5.  **Analytics**: Track Views, Likes, Comments, and Subscriber growth.

**Quota Note**: The system tracks YouTube API quota usage (approx. 1600 units per upload) and enforces daily limits to prevent unexpected outages.

---

---

## 🔒 Security & Compliance

The platform adheres to strict security standards to ensure data integrity and user safety:

### 1. **Authentication & Authorization**
- **OAuth 2.0**: Used for all third-party integrations (YouTube, etc.). We never store user passwords for social platforms.
- **JWT Authentication**: Stateless authentication with short-lived Access Tokens (15m) and secure Refresh Tokens (7d).
- **RBAC**: granular Role-Based Access Control (`admin`, `user`, `manager`) enforced via middleware.

### 2. **Data Protection**
- **Encrypted Storage**: Sensitive tokens (Access/Refresh Tokens) are encrypted at rest using **AES-256-CBC** before being stored in MongoDB.
- **No Secrets Exposed**: All API keys and secrets are strictly server-side (`.env`), never exposed to the client bundle.

### 3. **Infrastructure Security**
- **Rate Limiting**:
    - **General API**: 100 requests / 15 mins per IP.
    - **Auth Routes**: Stricter limit of 20 requests / 15 mins to prevent brute-force attacks.
- **Helmet**: Adds secure HTTP headers (XSS Filter, HSTS, No-Sniff).
- **CORS**: configured to allow only trusted origins.

### 4. **Audit & Monitoring**
- **Centralized Logging**: Critical actions (Logins, Uploads, Errors) are logged via `winston`.
- **Audit Trails**: Database records for every user action (Create Post, Delete Media, Connect Account) for compliance.

```
/
├── server/
│   ├── src/utils/encryption.js       # AES-256 Encryption Utility
│   ├── src/middlewares/auth.middleware.js # RBAC & JWT Verification
│   └── src/app.js                    # Rate Limit Configuration
```

### 5. **Background Jobs & Reliability**
- **Atomic Locking**: Uses `findOneAndUpdate` to lock jobs (`status: processing`), ensuring **idempotency** and preventing race conditions in multi-worker environments.
- **Smart Retries**: Transient failures (network/timeouts) trigger exponential backoff (2^n * 5min).
- **Dead Letter Handling**: Jobs exceeding max retries (3) are marked `failed` and logged for manual inspection.
- **Error Classification**: Distinguishes between retryable (Network, 5xx) and fatal (Auth, 4xx) errors to optimize queue throughput.

```
/
├── server/
│   ├── src/jobs/scheduler.job.js     # Cron Trigger
│   ├── src/jobs/post.processor.js    # Atomic Processor
│   └── src/utils/retryHandler.js     # Backoff Logic
```

---

## 📂 Project Structure

```
/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views
│   │   ├── features/       # Redux slices & API services
│   │   └── ...
│   └── ...
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (YouTube, Instagram, etc.)
│   │   └── ...
│   └── ...
└── ...
```

### 6. **Known Limitations**
While we strive for a seamless experience, some third-party platform restrictions apply:
- **Instagram**: Auto-posting is currently limited to **Business** accounts only due to API restrictions. Personal/Creator accounts must use the mobile app for final publication.
- **YouTube Quotas**: The default API quota is 10,000 units/day. Video uploads cost ~1,600 units, limiting new projects to approx. **6 uploads per day** globally until a quota increase is approved by Google.
- **X (Twitter)**: due to recent API changes, the Free Tier has extremely limited write access. A **Basic or Pro** tier subscription is recommended for production use.
- **Analytics Delays**: Platform analytics (views, likes) are not real-time. Data is synchronized every 24 hours to respect rate limits.
- **Feature Parity**: Some features (e.g., Instagram Stories, LinkedIn Polls) are not yet supported via the public API.

### 7. **Roadmap 🚀**
We are constantly working to improve the platform. Here is a glimpse into our long-term vision:

- **🤖 AI-Assisted Captions**: Smart optimization of captions for engagement and tone using LLMs.
- **📱 YouTube Shorts Support**: Native scheduling and metadata optimization for Shorts.
- **📊 Advanced Analytics**: Deeper insights with downloadable PDF reports and competitor tracking.
- **🏢 Agency White-Labeling**: Custom branding (logo, colors, domain) for agencies managing client accounts.
- **💳 Billing & Subscriptions**: Integrated Stripe/Paddle support for SaaS monetization.
- **⚡ Webhooks & Automation**: Zapier/Make integrations for automated workflows.

> *Note: This roadmap is aspirational and subject to change based on user feedback and platform API updates.*

### 8. **Operational Best Practices 🛡️**
To ensure high availability and data integrity in production:

- **📉 API Quota Monitoring**:
  - Regular audits of the `Usage` collection to track consumption.
  - Set up alerts (e.g., email/Slack) when usage exceeds 80% of daily limits.

- **🔄 Graceful Failure Handling**:
  - The system implements **exponential backoff** for transient errors.
  - **Dead Letter Queues** (failed jobs) must be reviewed daily to identify systemic issues (e.g., token expiry).

- **👁️ Logging & Observability**:
  - Production logs (Info/Error) should be streamed to a centralized aggregator (e.g., Datadog, ELK) for searching and alerting.
  - Use `correlationId` (if implemented) or `postId` to trace requests across services.

- **💾 Backup & Restore**:
  - **Database**: Enable daily snapshots for MongoDB (Atlas/Local).
  - **Media**: Cloudinary handles redundancy, but maintain a local reference backup of critical assets if needed.

- **🚀 Safe Deployment**:
  - **Blue/Green Deployment** recommended to zero-downtime updates.
  - Always run strict linting and tests (`npm run test`) before pushing to production branches.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.
