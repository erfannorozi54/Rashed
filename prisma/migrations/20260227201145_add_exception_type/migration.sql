-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('BLOCKED', 'BUSY');

-- AlterTable
ALTER TABLE "AvailabilityException" ADD COLUMN     "type" "ExceptionType" NOT NULL DEFAULT 'BLOCKED';
