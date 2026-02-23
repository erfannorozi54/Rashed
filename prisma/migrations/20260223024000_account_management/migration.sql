-- AlterTable: add maxDebtLimit to User
ALTER TABLE "User" ADD COLUMN "maxDebtLimit" INTEGER NOT NULL DEFAULT 4000000;

-- AlterTable: add cancelled to Session
ALTER TABLE "Session" ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "FeeHandling" AS ENUM ('DEBT', 'PAID');

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionReschedule" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "originalSessionId" TEXT NOT NULL,
    "newSessionId" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "feeHandling" "FeeHandling" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionReschedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherAvailability_teacherId_idx" ON "TeacherAvailability"("teacherId");
CREATE INDEX "AvailabilityException_teacherId_idx" ON "AvailabilityException"("teacherId");
CREATE INDEX "AvailabilityException_date_idx" ON "AvailabilityException"("date");
CREATE INDEX "RefundRequest_studentId_idx" ON "RefundRequest"("studentId");
CREATE INDEX "RefundRequest_paymentId_idx" ON "RefundRequest"("paymentId");
CREATE INDEX "SessionReschedule_studentId_idx" ON "SessionReschedule"("studentId");

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionReschedule" ADD CONSTRAINT "SessionReschedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionReschedule" ADD CONSTRAINT "SessionReschedule_originalSessionId_fkey" FOREIGN KEY ("originalSessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionReschedule" ADD CONSTRAINT "SessionReschedule_newSessionId_fkey" FOREIGN KEY ("newSessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
