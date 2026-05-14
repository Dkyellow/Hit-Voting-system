# VotePulse — Live Voting Poll
A real-time two-candidate poll built with plain HTML/CSS/JS and Supabase as the backend database.

---

## Project Structure

```
voting-system/
├── index.html              ← Main page
├── css/
│   └── style.css           ← All styles
├── js/
│   ├── config.js           ← ⚙️  YOUR CREDENTIALS GO HERE
│   ├── db.js               ← All Supabase / database calls
│   └── app.js              ← UI logic
└── supabase_schema.sql     ← Run this once in Supabase SQL Editor
```

---

## Setup Steps

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (free account).
2. Click **"New Project"**.
3. Choose a name (e.g. `votepulse`), set a database password, pick a region, then click **"Create new project"**.
4. Wait ~1 minute for the project to be ready.

---

### Step 2 — Create the Database Table

1. In your Supabase project, click **"SQL Editor"** in the left sidebar.
2. Click **"New Query"**.
3. Open `supabase_schema.sql` from this project folder.
4. Copy the entire contents and paste it into the SQL Editor.
5. Click **"Run"** (or press `Ctrl+Enter`).

You should see: `Success. No rows returned.`

---

### Step 3 — Get Your API Keys

1. In Supabase, go to **Settings → API** (gear icon in the sidebar).
2. Copy two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long JWT string

---

### Step 4 — Add Your Keys to the Project

1. Open `js/config.js` in a text editor.
2. Replace the placeholder values:

```js
const SUPABASE_URL    = 'https://YOUR_PROJECT_ID.supabase.co';  // ← paste here
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';               // ← paste here
```

3. Save the file.

---

### Step 5 — Customise the Poll (Optional)

Still in `js/config.js`, edit the poll config:

```js
const POLL_CONFIG = {
  question:   "Who do you think should lead the team?",
  candidateA: "Alex Rivera",   // ← change to any name
  candidateB: "Blake Chen",    // ← change to any name
};
```

---

### Step 6 — Open the App

**Option A — Open directly in browser:**
- Double-click `index.html` — works for testing, but note that some browsers block local CORS.

**Option B — Use VS Code Live Server (recommended):**
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **"Open with Live Server"**.
3. The app opens at `http://127.0.0.1:5500`.

**Option C — Deploy to Netlify (free hosting):**
1. Go to [https://netlify.com](https://netlify.com) → **"Add new site" → "Deploy manually"**.
2. Drag the entire `voting-system/` folder into the deploy box.
3. Done — you get a live public URL instantly.

---

## Features

| Feature | Detail |
|---|---|
| **Real-time updates** | Votes from other users appear live via Supabase Realtime |
| **One vote per session** | Each browser tab can vote once; enforced in both JS and DB |
| **Live percentage bars** | Animated bars update as votes come in |
| **Activity feed** | Shows the last 8 votes with timestamps |
| **Reset poll** | Clears all votes from the database |
| **No login required** | Works with anonymous users via Supabase anon key |

---

## Database Schema

| Column | Type | Description |
|---|---|---|
| `id` | bigserial | Auto-incrementing primary key |
| `candidate` | char(1) | `'A'` or `'B'` |
| `session_id` | text | Unique per browser tab (prevents double voting) |
| `created_at` | timestamptz | Timestamp of the vote |

---

## Security Notes

- The **anon key** is safe to expose in frontend code — it only has the permissions you define via Row Level Security (RLS) policies.
- The `session_id` unique constraint in the DB prevents duplicate votes even if someone bypasses the JS check.
- For a production app, consider adding Supabase Auth so votes are tied to real user accounts.
- The **Reset** button uses a permissive `DELETE` policy. To restrict it to admins only, update the RLS policy in `supabase_schema.sql` (see the comment in that file).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Could not connect to database" | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js` |
| Votes not saving | Check RLS policies in Supabase → Auth → Policies |
| Real-time not working | Confirm `supabase_realtime` publication was added (Step 2 of SQL) |
| Reset fails | Supabase RLS may be blocking DELETE — check policies |
| CORS error locally | Use Live Server or Netlify instead of opening file directly |
