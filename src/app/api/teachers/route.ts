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

        return NextResponse.json({ teachers });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
