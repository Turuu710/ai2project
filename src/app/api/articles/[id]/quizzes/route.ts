// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { Prisma } from "@prisma/client";

// export async function POST(request: Request, { params }) {}



import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// export async function GET(request: Request, { params }: { params: { id: string } }) {
//   try {
//     const quiz = await prisma.quiz.findMany({
//       where: { articleId: params.id }
//     });
//     return NextResponse.json(quiz);
//   } catch (error) {
//     return NextResponse.json({ error: "Квиз олдсонгүй" }, { status: 500 });
//   }
// }

// export async function POST(request: Request, { params }: { params: { id: string } }) {
//   try {
//     const { userId } = await auth();
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await request.json();
//     const newQuiz = await prisma.quiz.create({
//       data: { ...body, articleId: params.id }
//     });
//     return NextResponse.json(newQuiz, { status: 201 });
//   } catch (error) {
//     return NextResponse.json({ error: "Квиз үүсгэхэд алдаа гарлаа" }, { status: 500 });
//   }
// }






export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const quizzes = Array.isArray(body) ? body : body.quizzes;

    if (!quizzes || !Array.isArray(quizzes)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    } 

    const createdQuizzes = await Promise.all(
      quizzes.map((q: any) => 
        prisma.quiz.create({
          data: {
            question: q.question,
            options: q.options, 
            // Хэрэв схемд 'answer' нь String бол String() болгоно
            answer: String(q.answer), 
            articleId: params.id
          }
        })
      )
    );

    return NextResponse.json(createdQuizzes, { status: 201 });
  } catch (error) {
    console.error("POST QUIZ ERROR:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}