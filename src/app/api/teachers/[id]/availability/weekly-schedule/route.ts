import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTeacherWeeklySchedule } from "@/lib/availability-utils";

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

        const date = dateStr ? new Date(dateStr) : new Date();
        const schedule = await getTeacherWeeklySchedule(teacherId, date);

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
