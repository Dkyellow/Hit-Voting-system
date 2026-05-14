// ─────────────────────────────────────────────────────────────
//  js/config.js  —  Supabase project credentials
//  Replace the two values below with your own from:
//  https://supabase.com → Your Project → Settings → API
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://lyifcpngaliytrgmhgrm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aWZjcG5nYWxpeXRyZ21oZ3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDQ5NDcsImV4cCI6MjA5NDMyMDk0N30.abKbV-59pg0_1USbo33rmyuhTaeI2D1IsYzblY0T1uk';

// ─── Poll configuration ───────────────────────────────────────
// Edit these to customise the poll without touching the database.
const POLL_CONFIG = {
  question: "Who do you think should lead the team?",
  candidateA: "Misheck",
  candidateB: "Leslie",
};
