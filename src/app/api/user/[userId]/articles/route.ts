// app/api/users/[userId]/articles/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Clerk-ээс нэвтэрсэн эсэхийг шалгах
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Тухайн userId-тай холбоотой Article-уудыг шүүж авах
    const articles = await prisma.article.findMany({
      where: {
        userId: params.userId,
      },
      orderBy: {
        createdAt: "desc", // Хамгийн сүүлийнхийг дээр нь
      },
      // Хэрэв квизүүдийн тоог хармаар байвал count нэмж болно
      include: {
        _count: {
          select: { quizzes: true }
        }
      }
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Fetch User Articles Error:", error);
    return NextResponse.json(
      { error: "Нийтлэлүүдийг авахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}