import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTeacherFreeSlots } from "@/lib/availability-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const { id: teacherId } = await params;
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get("date");
        const duration = Number(searchParams.get("duration") || "90");

        if (!dateStr) return NextResponse.json({ error: "تاریخ الزامی است" }, { status: 400 });

        const date = new Date(dateStr);
        const freeSlots = await getTeacherFreeSlots(teacherId, date, duration);

        return NextResponse.json({ freeSlots });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}