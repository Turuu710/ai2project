// import { NextResponse } from "next/server";

// export async function GET(request: Request, { params }: { params: { id: string } }) {}



import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // URL-аас ID-г салгаж авах

    const article = await prisma.article.findUnique({
      where: { id: id },
      include: {
        quizzes: true, // Хэрэв артиклтайгаа цуг квизүүдийг нь авмаар байвал
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Артикл олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: "Датаг авахад алдаа гарлаа" }, { status: 500 });
  }
}