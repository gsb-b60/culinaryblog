-- Durable cleanup requests, intentionally independent of the deleted recipe.
CREATE TABLE "file_cleanup_tasks" (
  "id" TEXT NOT NULL,
  "recipe_id" TEXT NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "file_cleanup_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "file_cleanup_tasks_created_at_id_idx" ON "file_cleanup_tasks"("created_at", "id");
