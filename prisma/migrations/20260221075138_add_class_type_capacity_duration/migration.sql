-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('PUBLIC', 'SEMI_PRIVATE', 'PRIVATE');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "classType" "ClassType" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "maxCapacity" INTEGER,
ADD COLUMN     "sessionDuration" INTEGER NOT NULL DEFAULT 90;
