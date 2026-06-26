-- Migration: Phase 2 Notebook (SRS, Collections, Tags, Mastered, Share)
-- Adds columns to user_vocabulary plus 3 new tables for the
-- Flashcard SRS + Collections + Share features.

-- =====================================================
-- 1. Extend user_vocabulary with tags/note/masteredAt
-- =====================================================

ALTER TABLE user_vocabulary
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS user_vocabulary_mastered_idx
  ON user_vocabulary(user_id, mastered_at);

COMMENT ON COLUMN user_vocabulary.tags IS 'Free-form user tags (lowercase, trim, max 10 tags, 30 chars each)';
COMMENT ON COLUMN user_vocabulary.note IS 'Private user note (max 1000 chars)';
COMMENT ON COLUMN user_vocabulary.mastered_at IS 'When user marked the word as mastered; null = not mastered';

-- =====================================================
-- 2. vocabulary_review (SRS state per user-vocab)
-- =====================================================

CREATE TABLE IF NOT EXISTS vocabulary_review (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5 NOT NULL,
  interval_days INTEGER DEFAULT 0 NOT NULL,
  repetition INTEGER DEFAULT 0 NOT NULL,
  lapses INTEGER DEFAULT 0 NOT NULL,
  due_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_review_user_vocab_unique
  ON vocabulary_review(user_id, vocabulary_id);
CREATE INDEX IF NOT EXISTS vocabulary_review_due_idx
  ON vocabulary_review(user_id, due_at);

COMMENT ON TABLE vocabulary_review IS 'Per-user SRS (SM-2) state for vocabulary in personal notebook';
COMMENT ON COLUMN vocabulary_review.ease_factor IS 'SM-2 ease factor (default 2.5, min 1.3)';

-- =====================================================
-- 3. vocabulary_collection (user-created folders)
-- =====================================================

CREATE TABLE IF NOT EXISTS vocabulary_collection (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  share_slug VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS vocabulary_collection_user_idx
  ON vocabulary_collection(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_collection_user_name_unique
  ON vocabulary_collection(user_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_collection_share_slug_unique
  ON vocabulary_collection(share_slug);

COMMENT ON TABLE vocabulary_collection IS 'User-created collections/folders for grouping notebook words';
COMMENT ON COLUMN vocabulary_collection.is_public IS 'When true, collection can be viewed at /notebook/shared/<share_slug>';

-- =====================================================
-- 4. user_vocabulary_collection (n-n join)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_vocabulary_collection (
  id TEXT PRIMARY KEY,
  user_vocabulary_id TEXT NOT NULL REFERENCES user_vocabulary(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES vocabulary_collection(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_vocab_collection_unique
  ON user_vocabulary_collection(user_vocabulary_id, collection_id);
CREATE INDEX IF NOT EXISTS user_vocab_collection_collection_idx
  ON user_vocabulary_collection(collection_id);
