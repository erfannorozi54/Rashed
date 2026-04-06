import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assignmentId = formData.get("assignmentId") as string;

    if (!file || !assignmentId) {
      return NextResponse.json({ error: "فایل و شناسه تکلیف الزامی است" }, { status: 400 });
    }

    // Check if assignment exists and student has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        session: {
          include: {
            class: {
              include: {
                students: {
                  where: { studentId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment || assignment.session.class.students.length === 0) {
      return NextResponse.json({ error: "دسترسی به این تکلیف ندارید" }, { status: 403 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads", "submissions");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const fileUrl = `/uploads/submissions/${filename}`;

    // Create or update submission
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
      create: {
        assignmentId,
        studentId: session.user.id,
        fileUrl,
      },
      update: {
        fileUrl,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error("Submit assignment error:", error);
    return NextResponse.json({ error: "خطا در ارسال پاسخ" }, { status: 500 });
  }
}
