-- AlterTable
ALTER TABLE "users" ADD COLUMN     "full_name" VARCHAR(100),
ADD COLUMN     "user_name" VARCHAR(30);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");
