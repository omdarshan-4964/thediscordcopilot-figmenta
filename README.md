# 🤖 Discord Copilot — AI-Powered Discord Agent

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase)
![Discord.js](https://img.shields.io/badge/Discord.js-14.25-5865F2?style=for-the-badge&logo=discord)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google)

**A lightweight system featuring a Web Admin Interface and an AI-powered Discord Bot**

*Built for Figmenta Labs Trial — Brief N°01*

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Demo](#-demo)

</div>

---

## 📋 Project Overview

**Discord Copilot** is a full-stack application that enables administrators to control an AI agent's behavior through a sleek web interface, while team members interact with the configured AI directly in Discord channels.

> 💡 **The Challenge:** Build an admin-controlled AI agent system where the "brain" (System Instructions) can be configured via web, while users interact with the AI through Discord.

---

## ✨ Features

### 🖥️ Admin Console (Web Interface)
| Feature | Description |
|---------|-------------|
| **System Instructions** | Real-time configuration of AI behavioral parameters and personality |
| **Channel Allow-list** | Granular control over which Discord channels the bot responds to |
| **Memory Control** | View and purge conversation history per channel |
| **Knowledge Base (RAG)** | Upload PDF documents to enhance AI responses with custom knowledge |
| **Authentication** | Secure admin access via Supabase Auth |

### 🤖 Discord Bot
| Feature | Description |
|---------|-------------|
| **Context-Aware Responses** | Leverages conversation history for coherent multi-turn dialogues |
| **RAG Integration** | Retrieves relevant snippets from uploaded PDFs using vector similarity |
| **Channel Filtering** | Only responds in admin-approved channels |
| **Smart Chunking** | Handles Discord's 2000-character message limit gracefully |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN CONSOLE                            │
│                    (Next.js 16 + React 19)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   System     │ │   Channel    │ │   Knowledge Base (RAG)   │ │
│  │ Instructions │ │  Allow-list  │ │   PDF Upload & Embed     │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   system_    │ │  allowed_    │ │  documents (pgvector)    │ │
│  │ instructions │ │  channels    │ │  + chat_logs             │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DISCORD BOT                               │
│                      (Node.js + Discord.js)                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Message → Check Allow-list → Generate Embedding →          ││
│  │  Match Documents → Fetch History → Build Prompt →           ││
│  │  Gemini Response → Save to Memory → Reply                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Next.js API Routes, Supabase |
| **Database** | PostgreSQL with pgvector extension |
| **AI/ML** | Google Gemini 2.5 Flash (Chat), text-embedding-004 (Embeddings) |
| **Bot Framework** | Discord.js 14 |
| **Authentication** | Supabase Auth |
| **PDF Processing** | pdf2json |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Discord Bot Token
- Google AI API Key (Gemini)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/discord-copilot.git
cd discord-copilot
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

Create a `.env` file in the `discord-bot/` directory:
```env
DISCORD_TOKEN=your_discord_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- System Instructions Table
CREATE TABLE system_instructions (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO system_instructions (content) VALUES ('You are a helpful assistant.');

-- Allowed Channels Table
CREATE TABLE allowed_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Logs Table
CREATE TABLE chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents Table (for RAG)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector Similarity Search Function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 4. Install Dependencies
```bash
# Install web app dependencies
npm install

# Install bot dependencies
cd discord-bot
npm install
cd ..
```

### 5. Run the Application

**Terminal 1 - Web Admin Console:**
```bash
npm run dev
```

**Terminal 2 - Discord Bot:**
```bash
cd discord-bot
npm start
```

Access the admin console at `http://localhost:3000`

---

## 📸 Demo

### Admin Console UI
The admin interface features a modern, cyberpunk-inspired design with:
- **System Instructions Panel** — Configure AI personality in real-time
- **Active Channels Manager** — Control where the bot responds
- **Neural Link (Memory)** — View and purge conversation history
- **Knowledge Base** — Upload PDFs for RAG-enhanced responses

### Bot in Action
1. Add a channel ID to the allow-list via admin console
2. Set custom system instructions (e.g., "You are a pirate who only speaks in nautical terms")
3. Upload relevant PDF documentation for context-aware responses
4. Interact with the bot in Discord — it remembers conversation history!

---

## 📂 Project Structure

```
discord-copilot/
├── app/
│   ├── api/
│   │   └── train/           # RAG training endpoint
│   │       └── route.ts
│   ├── login/               # Authentication page
│   │   └── page.tsx
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main admin dashboard
├── discord-bot/
│   ├── index.js             # Bot entry point
│   └── package.json
├── utils/
│   └── supabase/
│       └── client.ts        # Supabase client config
├── middleware.ts            # Auth middleware
├── package.json
└── README.md
```

---

## 🔒 Security Features

- ✅ Supabase Row Level Security (RLS)
- ✅ Protected admin routes via middleware
- ✅ Channel-based access control
- ✅ Secure environment variable handling

---

## 🎯 Key Highlights

| Aspect | Implementation |
|--------|----------------|
| **Clean Architecture** | Separation of concerns between web admin, database, and bot |
| **Real-time Control** | Changes to system instructions reflect immediately |
| **Scalable RAG** | pgvector enables efficient similarity search at scale |
| **Modern UI/UX** | Glassmorphism design with smooth animations |
| **Production Ready** | Error handling, loading states, and edge cases covered |

---

## 📄 License

This project was built as part of the **Figmenta Labs Trial** assessment.

---

<div align="center">

**Built with ❤️ using AI-assisted development (Vibe Coding)**

*Powered by Next.js, Supabase, Discord.js, and Google Gemini*

</div>
