# Auto Posting - Social Media Management Platform

> **The enterprise-grade solution for agencies, businesses, and creators to manage multi-channel social media automation at scale.**

Auto Posting is a high-performance, multi-tenant platform designed to streamline social media workflows. It features native **YouTube** integration alongside Instagram, Facebook, LinkedIn, and X (Twitter), supported by a powerful global administration layer and per-organization resource management.

---

## 🚀 Key Platform Pillars

### 🏢 Multi-Tenant SaaS Architecture
- **Organization Isolation**: Secure data segregation for multiple tenants within a single infrastructure.
- **Custom Branding**: Fully white-labelable portal with organization-specific logos, color palettes, and custom domains.
- **Global Administration**: Dedicated **SuperAdmin Panel** for platform-wide oversight, health monitoring, and organization provisioning.

### 🖼️ Professional Media Editor
- **Canvas-lite Engine**: In-browser image editing with text overlays, filters, and stickers using Fabric.js.
- **Video Trimming**: High-performance client-side video trimming powered by **FFmpeg.wasm**.
- **Secure Context**: Advanced COOP/COEP headers implementation to enable multithreaded media processing.
- **Dedicated Workflow**: Full-page immersive editing experience with auto-saving to organization library.

### ⚖️ Resource & Authority Management
- **Dynamic Quotas**: SuperAdmin-controlled limits for social accounts, monthly posts, and cloud storage.
- **Usage Tracking**: Real-time monitoring of resource consumption with automated enforcement.
- **Granular RBAC**: Role-based access control (`Admin`, `Publisher`, `Reviewer`, `Creator`, `User`) with organization-level team management.

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18+ with Vite
- **State Management**: Redux Toolkit & RTK Query
- **Styling**: Tailwind CSS & Framer Motion
- **UI Components**: Shadcn UI, Radix UI, Lucide Icons
- **Media Engine**: Fabric.js (Canvas), FFmpeg.wasm (Video Processing)
- **Charts**: Recharts (for analytics & growth metrics)

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Queue/Async**: Redis (Optional) / Cron-based scheduling
- **Real-time**: Socket.io (for status updates)

### Services & Infrastructure
- **Media Storage**: Cloudinary (CDN-backed asset management)
- **Email**: Nodemailer (Custom templates for welcome, security, and alerts)
- **Security**: JWT (Access/Refresh), AES-256-CBC token encryption, Helmet, Rate-limiting

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x)
- MongoDB (v6.0+)
- Cloudinary Account (for media)
- Google Cloud Console Project (for YouTube API)

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd auto-posting

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 3. Environment Setup
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autoposting
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ENCRYPTION_KEY=32_byte_hex_string

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/dashboard/accounts
```

---

## 🔒 Security & Reliability

- **Immutable Audit Logs**: Every sensitive action (logins, deletions, limit changes) is recorded for compliance.
- **Security Notifications**: Automatic email alerts for password changes and email updates.
- **Exponential Backoff**: Transient publishing failures are handled with smart retries and backoff logic.
- **Idempotency**: Atomic job processing ensures posts are never published twice.

---

## 📂 Project Roadmap

- [x] **SuperAdmin Analytics**: Global growth trends and usage KPIs.
- [x] **Whitelabeling Engine**: Organization-specific branding (Logo/Colors).
- [x] **Team Management**: Admin tools to manage member roles and access.
- [x] **YouTube Shorts**: Specialized workflow for short-form video content.
- [x] **Professional Media Editor**: Browser-based video trimming and image enhancement.
- [ ] **AI Caption Studio**: LLM-powered caption generation and optimization.
- [ ] **Stripe Integration**: Automated subscription billing and invoicing.

---

## 📄 License
This project is licensed under the ISC License. Built with ❤️ for high-scale social automation.
