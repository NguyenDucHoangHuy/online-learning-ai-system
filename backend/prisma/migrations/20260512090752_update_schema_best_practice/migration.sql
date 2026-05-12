/*
  Warnings:

  - The values [high,medium,low] on the enum `AttentionLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [happy,sad,angry,surprised,fearful,disgusted,neutral] on the enum `Emotion` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,approved,rejected,left] on the enum `JoinStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [student,teacher] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [waiting,active,ended] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updated_at` to the `class_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttentionLevel_new" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
ALTER TABLE "emotion_logs" ALTER COLUMN "attention_level" TYPE "AttentionLevel_new" USING ("attention_level"::text::"AttentionLevel_new");
ALTER TYPE "AttentionLevel" RENAME TO "AttentionLevel_old";
ALTER TYPE "AttentionLevel_new" RENAME TO "AttentionLevel";
DROP TYPE "public"."AttentionLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Emotion_new" AS ENUM ('HAPPY', 'SAD', 'ANGRY', 'SURPRISED', 'FEAR', 'DISGUSTED', 'NEUTRAL');
ALTER TABLE "emotion_logs" ALTER COLUMN "emotion" TYPE "Emotion_new" USING ("emotion"::text::"Emotion_new");
ALTER TYPE "Emotion" RENAME TO "Emotion_old";
ALTER TYPE "Emotion_new" RENAME TO "Emotion";
DROP TYPE "public"."Emotion_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "JoinStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LEFT');
ALTER TABLE "public"."session_participants" ALTER COLUMN "join_status" DROP DEFAULT;
ALTER TABLE "session_participants" ALTER COLUMN "join_status" TYPE "JoinStatus_new" USING ("join_status"::text::"JoinStatus_new");
ALTER TYPE "JoinStatus" RENAME TO "JoinStatus_old";
ALTER TYPE "JoinStatus_new" RENAME TO "JoinStatus";
DROP TYPE "public"."JoinStatus_old";
ALTER TABLE "session_participants" ALTER COLUMN "join_status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'TEACHER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');
ALTER TABLE "public"."class_sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "class_sessions" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "class_sessions" ALTER COLUMN "status" SET DEFAULT 'WAITING';
COMMIT;

-- AlterTable
ALTER TABLE "class_sessions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'WAITING';

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "session_participants" ALTER COLUMN "join_status" SET DEFAULT 'PENDING',
ALTER COLUMN "joined_at" DROP NOT NULL,
ALTER COLUMN "joined_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "emotion_logs_participant_id_idx" ON "emotion_logs"("participant_id");

-- CreateIndex
CREATE INDEX "emotion_logs_recorded_at_idx" ON "emotion_logs"("recorded_at");

-- CreateIndex
CREATE INDEX "session_participants_session_id_idx" ON "session_participants"("session_id");

-- CreateIndex
CREATE INDEX "session_participants_student_id_idx" ON "session_participants"("student_id");
