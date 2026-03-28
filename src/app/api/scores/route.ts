// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function POST(request: Request) {}

// export async function GET(request: Request) {}




import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth(); 
    const body = await req.json();
    const { articleId, score, timeSpent } = body;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Find the internal Prisma User ID using the Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // 2. Use the dbUser.id (the CUID) to create the score
    const newScore = await prisma.userScore.create({
      data: {
        articleId: articleId,
        userId: dbUser.id, // Use the internal ID, not the Clerk string
        score: Number(score),
        timeSpent: Number(timeSpent),
      },
    });

    return NextResponse.json(newScore);
  } catch (error) {
    console.error("BACKEND_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. Add the GET method to fix the 405 error in your logs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
    }

    const scores = await prisma.userScore.findMany({
      where: { articleId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}