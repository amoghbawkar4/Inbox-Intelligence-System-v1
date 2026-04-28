# ✦ Inbox Intelligence System (v1)

An AI-powered system that transforms your Gmail inbox into a **prioritized, actionable feed** — helping you focus only on what truly matters.

---

## 🧠 The Problem

Modern inboxes are noisy.

Newsletters, updates, promotions, and alerts flood in daily — making it difficult to identify what actually deserves attention.

Most tools stop at filtering or labeling.
They don’t help you **decide what to do next**.

---

## 💡 The Solution

Inbox Intelligence System connects to your Gmail account, analyzes incoming emails using AI, and:

* Generates concise summaries (TL;DR)
* Classifies emails by priority
* Suggests actionable next steps
* Sends a clean daily digest directly from your inbox

---

## ⚙️ Key Features

### 📥 Gmail Integration

* Secure OAuth-based authentication
* Reads emails directly from your inbox
* No passwords stored

### 🤖 AI-Powered Summarization

* Extracts key information from emails
* Generates structured summaries
* Identifies why the email matters

### 🧠 Intelligent Categorization

Emails are automatically classified into:

* 🔴 Urgent
* 🔵 Read Later
* ⚫ Ignore

### 📬 Daily Digest System

* Compiles summaries into a single digest
* Sends it via your own Gmail account
* Designed for quick scanning and decision-making

### 🔒 User Isolation

* Each user’s data is completely isolated
* No cross-user data mixing
* Token-based authentication with JWT

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Plain CSS (custom design system)
* Responsive UI with light/dark mode

### Backend

* Node.js + Express
* MongoDB (Mongoose)

### AI & Integrations

* OpenAI API (for summarization & insights)
* Gmail API (email fetching & sending)
* Google OAuth 2.0 (authentication)

---

## 🔄 System Flow

1. User authenticates via Google OAuth
2. Gmail API fetches emails
3. Emails are cleaned and processed
4. OpenAI generates:

   * TL;DR summary
   * Importance classification
   * Suggested action
5. Data is stored in MongoDB
6. User views categorized summaries in dashboard
7. Daily digest is generated and sent via Gmail