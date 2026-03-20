-- CreateEnum
CREATE TYPE "PrivateBookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TeacherSpecialization" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "specializationId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PrivateBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "gatewayRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherSpecialization_teacherId_idx" ON "TeacherSpecialization"("teacherId");

-- CreateIndex
CREATE INDEX "PrivateBooking_studentId_idx" ON "PrivateBooking"("studentId");

-- CreateIndex
CREATE INDEX "PrivateBooking_teacherId_idx" ON "PrivateBooking"("teacherId");

-- CreateIndex
CREATE INDEX "PrivateBooking_date_idx" ON "PrivateBooking"("date");

-- AddForeignKey
ALTER TABLE "TeacherSpecialization" ADD CONSTRAINT "TeacherSpecialization_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateBooking" ADD CONSTRAINT "PrivateBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateBooking" ADD CONSTRAINT "PrivateBooking_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateBooking" ADD CONSTRAINT "PrivateBooking_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "TeacherSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
