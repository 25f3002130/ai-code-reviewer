# 💎 ZINC × NH // INDUSTRIAL CODE REVIEWER

An elite, high-performance AI code review platform engineered for stability, speed, and resilience. Built with **Next.js 16**, **Firebase**, **Groq**, and **Hugging Face**.

---

## ⚡ Core Features

### 🤖 Resilient AI Pipeline (Groq × Hugging Face)
- **Groq Primary Cluster**: Leveraging Llama 3.3 70B for ultra-fast, high-accuracy analysis.
- **Hugging Face Backup Cluster**: Seamlessly falls back to Qwen 2.5, StarCoder 2, or Llama 3.2 if Groq is busy.
- **Multi-Key Rotation**: Supports unlimited API keys for both providers to bypass rate limits and support 1,000+ users.
- **Global Response Cache**: SHA-256 hashed Firestore cache that serves identical queries instantly, saving your tokens.

### 🎨 Premium Industrial Aesthetics
- **GLSL Shader Background**: Dynamic, high-performance WebGL hill animations for a stunning first impression.
- **Glassmorphism UI**: Sleek, high-contrast design with custom scrollbars and hover micro-animations.
- **Brutalist Typography**: Designed with Syne and Inter fonts for a modern, industrial look.

### 🛡️ Enterprise-Grade Infrastructure
- **Server-Side Quota Enforcement**: Industrial-grade rate limiting (Daily/Hourly) enforced via Firebase Admin SDK.
- **Firebase Authentication**: Secure Google and Email/Password sign-in with unified profile management.
- **Cloud-Synced History**: Firestore-backed conversation history that follows you across any device.
- **Technical Intent Filtering**: AI refuses non-programming queries to maintain focus and resource integrity.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS |
| **Backend** | Next.js API Routes, Firebase Admin SDK |
| **Database** | Firebase Firestore (Real-time persistence) |
| **Auth** | Firebase Authentication |
| **AI (Primary)** | Groq (Llama-3.3-70b-versatile) |
| **AI (Backup)** | Hugging Face (Qwen-2.5-Coder-32B, StarCoder-2) |
| **Graphics** | Three.js / GLSL Shaders |

---

## 🚀 Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/25f3002130/ai-code-reviewer.git
cd ai-code-reviewer
npm install
```

### 2. Configure Environment
Create a `.env.local` file with the following structure:

```env
# 🤖 GROQ: Comma-separated keys for rotation
GROQ_API_KEY=gsk_key1,gsk_key2...
GROQ_MODEL=llama-3.3-70b-versatile

# 🤖 HUGGING FACE: Comma-separated keys for backup
HF_API_KEY=hf_key1,hf_key2...

# 🔥 FIREBASE: Client config
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# 🔐 FIREBASE: Server-side Admin Key (Minified JSON)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account" ...}'
```

### 3. Run Development
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🛡️ Security Rules (Recommended)

To ensure your production environment is secure, deploy the following Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{convId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /ai_reviews_cache/{hash} {
      allow read: if true;
      allow write: if false; // Only Server Admin can write
    }
  }
}
```

---

## 📈 Scalability Guide
This platform is designed to handle **1,000+ active users** on a $0 budget:
1. **Model Rotation**: If Groq hits a limit, it instantly tries the Hugging Face cluster.
2. **Key Rotation**: Adding just 2-3 free API keys to the rotation list effectively doubles your capacity.
3. **Caching**: Common queries like "How to loop in JS" hit the Firestore cache, costing $0 in AI tokens.

---

Designed with 🤍 by **Antigravity** for **ZINC × NH**.
