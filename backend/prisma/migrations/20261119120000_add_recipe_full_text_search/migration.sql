-- FR-SRCH-001: Vietnamese-friendly full-text search.
-- PostgreSQL has no built-in Vietnamese dictionary, so the standard approach is
-- the `simple` configuration plus `unaccent`: "phở" and "pho" produce the same
-- lexemes while word boundaries are still respected.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- The generated `search_vector` column cannot call `unaccent` directly because
-- that function is STABLE, and generated columns require IMMUTABLE expressions.
-- A trigger keeps the vector current on insert and title/description changes.
ALTER TABLE "recipes" ADD COLUMN "search_vector" tsvector;

CREATE OR REPLACE FUNCTION "refresh_recipe_search_vector"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."search_vector" :=
    setweight(
      to_tsvector('simple', unaccent(coalesce(NEW."title", ''))),
      'A'
    ) ||
    setweight(
      to_tsvector('simple', unaccent(coalesce(NEW."description", ''))),
      'B'
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_recipe_search_vector" ON "recipes";
CREATE TRIGGER "trg_recipe_search_vector"
BEFORE INSERT OR UPDATE OF "title", "description"
ON "recipes"
FOR EACH ROW
EXECUTE FUNCTION "refresh_recipe_search_vector"();

-- Backfill existing rows.
UPDATE "recipes"
SET "search_vector" =
  setweight(to_tsvector('simple', unaccent(coalesce("title", ''))), 'A') ||
  setweight(to_tsvector('simple', unaccent(coalesce("description", ''))), 'B');

CREATE INDEX "idx_recipe_search_vector" ON "recipes" USING GIN ("search_vector");
