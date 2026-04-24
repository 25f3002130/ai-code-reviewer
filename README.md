An AI-powered code review platform built with **Next.js 16**, **Firebase**, **Groq**, and **Hugging Face**.

---

## Features

- 🏠 **Landing page** with animated hero, feature grid, and mock chat preview
- 🔐 **Auth** — Email/password + Google sign-in via Firebase Authentication
- 💬 **Chat interface** — ChatGPT-style UI with streaming indicator
- 📁 **Left sidebar** — Chat history, resume old chats, delete conversations
- 🤖 **Dual AI Models** — Gemini 2.0 Flash (primary) with Groq Llama 3.1 70B fallback
- ☁️ **Firebase Firestore** — Chat history synced across devices (with localStorage fallback when logged out)
- 🚫 **Technical-only mode** — AI refuses non-programming questions
- 🔄 **Automatic fallback** — When Gemini rate limits, automatically switches to Groq

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx                  ← Root layout (AuthProvider + Syne font)
│   ├── globals.css
│   ├── auth/
│   │   ├── signin/page.tsx         ← Sign In page
│   │   └── signup/page.tsx         ← Sign Up page
│   └── chat/
│       └── [id]/page.tsx           ← Main chat page (protected)
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── glass-card.tsx
│   └── chat/
│       ├── chat-layout.tsx         ← Layout wrapper with header + sidebar
│       ├── chat-sidebar.tsx        ← Left sidebar with conversation list
│       ├── chat-messages.tsx       ← Message bubbles
│       ├── chat-input.tsx          ← Input box
│       ├── chat-code-block.tsx     ← Syntax-highlighted code blocks
│       └── model-selector.tsx      ← Dropdown to pick AI model
├── hooks/
│   └── use-chat.ts                 ← Chat logic hook
├── lib/
│   ├── firebase/
│   │   ├── config.ts               ← Firebase init
│   │   ├── auth.ts                 ← Auth helpers (signIn, signUp, Google)
│   │   ├── auth-context.tsx        ← React context for user state
│   │   └── conversations.ts        ← Firestore CRUD for conversations
│   ├── ai-providers/
│   │   ├── index.ts                ← Provider orchestration with fallback logic
│   │   ├── gemini.ts               ← Gemini API integration
│   │   ├── groq.ts                 ← Groq API integration
│   │   ├── code-reviewer.ts        ← Prompt builder + response parser
│   │   └── types.ts                ← TypeScript types
│   ├── store/
│   │   └── chat-store.ts           ← Zustand global store
│   ├── storage/
│   │   └── conversation-storage.ts ← Firebase + localStorage hybrid storage
│   └── utils.ts
└── types/
    └── chat.ts                     ← Message, Conversation types
```

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/25f3002130/ai-code-reviewer.git
cd ai-code-reviewer
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project
2. Enable **Authentication** → Sign-in methods → **Email/Password** and **Google**
3. Enable **Firestore Database** → Start in test mode
4. Go to Project Settings → Your Apps → Add Web App → copy config
5. Add a Firestore index (or let it auto-create on first query):
   - Collection: `conversations`, Fields: `userId ASC`, `updatedAt DESC`

### 3. Get Hugging Face API Key (FREE)

1. Go to [Hugging Face Tokens](https://huggingface.co/settings/tokens)
2. Click **New token** → Role: **Read**
3. Copy the key (starts with `hf_...`)

**Recommended models (Free Inference API):**
- `Qwen/Qwen2.5-Coder-32B-Instruct`
- `bigcode/starcoder2-15b-instruct-v0.1`
- `meta-llama/Llama-3.2-3B-Instruct`

### 4. Get Groq API Key (FREE)

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up / Sign in
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `gsk_...`)

**High Availability Setup:**
- You can generate **multiple keys** (e.g., 5 keys) and paste them as a comma-separated list.
- The system will automatically rotate through them if one is rate limited.

### 5. Configure environment

```bash
cp .env.example .env.local
```

Fill in your keys:

```env
# AI Provider API Keys (Comma-separated for rotation)
GROQ_API_KEY=gsk_key1,gsk_key2,gsk_key3,gsk_key4,gsk_key5
GROQ_MODEL=llama-3.3-70b-versatile

HF_API_KEY=hf_key1,hf_key2
# HF Models are configured in the code as a fallback chain
```

### 6. Run

```bash
npm run dev
# Open http://localhost:3000
```

### 7. Deploy on Vercel

1. Push this repo to GitHub/GitLab/Bitbucket
2. In Vercel, click **Add New Project** and import the repo
3. Keep defaults (Framework Preset: Next.js, Build Command: `next build`)
4. In **Project Settings → Environment Variables**, add all variables from `.env.example`
5. Deploy

For future changes:

```bash
pnpm build
```

If `pnpm build` passes locally, Vercel build should pass as well.

---

## How the AI Providers Work

The system uses a **priority-based fallback** approach:

```
1. Groq Cluster (Primary - rotates through all provided keys)
   ↓ (if all Groq keys fail)
2. Hugging Face Cluster (Backup - rotates through multiple keys and models)
   ↓ (if all HF providers fail)
3. Error shown to user
```

**Rate limit handling:**
- When a provider returns 429, it's marked as "limited" for 60 seconds
- Requests automatically route to the next available provider
- Console logs show which provider is being used
- User sees a helpful tip message on errors

**To add more providers:**
1. Create `src/lib/ai-providers/new-provider.ts`
2. Add to the `PROVIDERS` array in `index.ts`

---

## Available Models

| Provider | Model | Best For |
|----------|-------|----------|
| Groq | `llama-3.3-70b-versatile` | Ultra-fast, high accuracy |
| Hugging Face | `Qwen2.5-Coder-32B` | Specialized code reasoning |

**Alternative Groq models:**
- `llama-3.1-8b-instant` - Faster, less accurate
- `mixtral-8x7b-32768` - Good balance
- `gemma2-9b-it` - Google's open model

---

## Firestore Security Rules (recommended for production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{convId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Troubleshooting

**"API not configured" or "Limit exceeded"**
- Ensure you have added your keys to the Vercel dashboard.
- If using multiple keys, separate them with commas (no spaces).

**"Invalid API key"**
- Double-check keys in `.env.local`
- Ensure keys don't have extra whitespace
- Restart dev server after changing env vars

**"Empty response from AI"**
- The code might be too short or not actual code
- Try with a larger code snippet

---

## Cost Estimation for 1,000 Users

Assuming ~50 code reviews per user per month:

| Provider | Free Tier | Overage Cost |
|----------|-----------|--------------|
| Gemini | 15M tokens/mo | ~$0.075 / 1M tokens |
| Groq | ~50K requests/mo | Paid plans available |

**Estimated usage:**
- 50,000 reviews/month × ~2,000 tokens = 100M tokens
- Gemini free tier covers 15M tokens
- Remaining 85M tokens ≈ $6.38/month

This is a rough estimate. Monitor usage in Google Cloud Console.
