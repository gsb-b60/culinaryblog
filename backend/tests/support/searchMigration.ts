import { type PrismaClient } from '@prisma/client';

/**
 * `prisma db push` only creates what the Prisma schema declares. The FTS
 * migration adds a tsvector column, trigger and GIN index outside the schema,
 * so integration schemas must apply the same raw SQL after pushing.
 */
export async function ensureRecipeFullTextSearch(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "search_vector" tsvector',
  );
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION "refresh_recipe_search_vector"()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW."search_vector" :=
        setweight(to_tsvector('simple', public.unaccent(coalesce(NEW."title", ''))), 'A') ||
        setweight(to_tsvector('simple', public.unaccent(coalesce(NEW."description", ''))), 'B');
      RETURN NEW;
    END;
    $$;
  `);
  await prisma.$executeRawUnsafe(
    'DROP TRIGGER IF EXISTS "trg_recipe_search_vector" ON "recipes"',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER "trg_recipe_search_vector"
    BEFORE INSERT OR UPDATE OF "title", "description"
    ON "recipes"
    FOR EACH ROW
    EXECUTE FUNCTION "refresh_recipe_search_vector"();
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "recipes"
    SET "search_vector" =
      setweight(to_tsvector('simple', public.unaccent(coalesce("title", ''))), 'A') ||
      setweight(to_tsvector('simple', public.unaccent(coalesce("description", ''))), 'B');
  `);
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "idx_recipe_search_vector" ON "recipes" USING GIN ("search_vector")',
  );
}
