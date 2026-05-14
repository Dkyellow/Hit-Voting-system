-- ─────────────────────────────────────────────────────────────
--  supabase_schema.sql
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────


-- ── 1. Create the votes table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.votes (
  id           bigserial PRIMARY KEY,
  candidate    char(1)      NOT NULL CHECK (candidate IN ('A', 'B')),
  session_id   text         NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

-- Prevent the same session from voting more than once
CREATE UNIQUE INDEX IF NOT EXISTS votes_session_id_unique
  ON public.votes (session_id);

-- Fast lookup by candidate
CREATE INDEX IF NOT EXISTS votes_candidate_idx
  ON public.votes (candidate);


-- ── 2. Enable Row Level Security (RLS) ───────────────────────
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;


-- ── 3. RLS Policies ───────────────────────────────────────────

-- Allow anyone to READ votes (needed for counting & feed)
CREATE POLICY "Allow public read"
  ON public.votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to INSERT a vote (anonymous users can vote)
CREATE POLICY "Allow public insert"
  ON public.votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to DELETE (needed for the Reset button)
-- ⚠️  For production, restrict this to authenticated admins only:
--   TO authenticated
--   USING (auth.role() = 'authenticated')
CREATE POLICY "Allow public delete"
  ON public.votes
  FOR DELETE
  TO anon, authenticated
  USING (true);


-- ── 4. Enable Realtime on the votes table ────────────────────
-- This makes Supabase broadcast INSERT / DELETE events to clients.
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;


-- ── 5. Verify setup ──────────────────────────────────────────
-- Run these to confirm everything looks right:
--   SELECT * FROM public.votes;
--   SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'votes';
