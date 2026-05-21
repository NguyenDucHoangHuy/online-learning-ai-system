/*
  Warnings:

  - Changed the type of `emotion` on the `emotion_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EmotionType" AS ENUM ('HAPPY', 'SAD', 'ANGRY', 'NEUTRAL', 'SURPRISED', 'FEARFUL', 'DISGUSTED');

-- AlterTable
ALTER TABLE "emotion_logs" DROP COLUMN "emotion",
ADD COLUMN     "emotion" "EmotionType" NOT NULL;

-- DropEnum
DROP TYPE "Emotion";

-- CreateIndex
CREATE INDEX "emotion_logs_participant_id_recorded_at_idx" ON "emotion_logs"("participant_id", "recorded_at" DESC);
