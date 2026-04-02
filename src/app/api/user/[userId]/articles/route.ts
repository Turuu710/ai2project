import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      where: {
        userId: params.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { quizzes: true },
        },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Fetch User Articles Error:", error);
    return NextResponse.json(
      { error: "Нийтлэлүүдийг авахад алдаа гарлаа" },
      { status: 500 },
    );
  }
}
