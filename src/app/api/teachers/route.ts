import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const teachers = await prisma.user.findMany({
            where: { role: { in: ["TEACHER", "ADMIN"] } },
            select: { id: true, name: true, role: true },
            orderBy: { name: "asc" },
        });

        // Attach specializations (using prisma as any since model is new and not yet generated)
        const teacherIds = teachers.map((t) => t.id);
        const allSpecs = await (prisma as any).teacherSpecialization.findMany({
            where: { teacherId: { in: teacherIds } },
            select: { id: true, teacherId: true, subject: true, grade: true, content: true, price: true },
            orderBy: { createdAt: "asc" },
        }) as Array<{ id: string; teacherId: string; subject: string; grade: string; content: string; price: number }>;

        const specsByTeacher: Record<string, typeof allSpecs> = {};
        for (const s of allSpecs) {
            if (!specsByTeacher[s.teacherId]) specsByTeacher[s.teacherId] = [];
            specsByTeacher[s.teacherId].push(s);
        }

        const result = teachers.map((t) => ({
            ...t,
            specializations: specsByTeacher[t.id] || [],
        }));

        return NextResponse.json({ teachers: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
