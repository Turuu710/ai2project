import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, id } = body;

    const user = await prisma.user.create({
      data: {
        email: email,
        name: "User Name",
        clerkId: id,
      },
    });
    return NextResponse.json({ message: "Bolson", user }, { status: 200 });
  } catch (error) {
    console.error("Prisma Error:", error);
    return new Response(
      `Aldaa: ${error instanceof Error ? error.message : "Unknown"}`,
      { status: 500 },
    );
  }
}
