import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
    const name = user.fullName?.trim() || user.firstName?.trim() || "User";

    if (!email) {
      return NextResponse.json({ error: "Email олдсонгүй" }, { status: 400 });
    }

    const dbUser = await syncUser({
      clerkId,
      email,
      name,
    });

    const body = await req.json();

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Гарчиггүй";
    const articleId =
      typeof body.articleId === "string" && body.articleId.trim()
        ? body.articleId
        : null;
    const mode = body.mode === "quiz" ? "quiz" : "summary";

    if (!text) {
      return NextResponse.json({ error: "Текст оруулна уу." }, { status: 400 });
    }

    if (mode === "summary") {
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Чи бол боловсролын туслах. Өгөгдсөн текстийг товч, ойлгомжтой Монгол хэлээр хураангуйлж өг. JSON форматаар зөвхөн ийм бүтэцтэй хариул:
{
  "summary": "string"
}`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = summaryCompletion.choices[0]?.message?.content;

      if (!raw) {
        return NextResponse.json(
          { error: "Summary хариу ирсэнгүй" },
          { status: 500 },
        );
      }

      const parsed = JSON.parse(raw);

      if (!parsed?.summary || typeof parsed.summary !== "string") {
        return NextResponse.json(
          { error: "Summary үүссэнгүй" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          summary: parsed.summary,
        },
        { status: 200 },
      );
    }

    const quizCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Чи бол боловсролын туслах.
Өгөгдсөн текстийг хураангуйлж, quiz үүсгээд JSON форматаар хариул.

JSON бүтэц:
{
  "summary": "string",
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": 0
    }
  ]
}

Дүрэм:
- summary нь string
- quiz нь массив
- options яг 4 сонголттой
- answer нь зөв хариултын index (0-3)
- 5 асуулт үүсгэ`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = quizCompletion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: "OpenAI хариу ирсэнгүй" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(aiResponse);

    if (!parsed?.summary) {
      return NextResponse.json({ error: "Summary үүссэнгүй" }, { status: 500 });
    }

    const normalizedQuiz = Array.isArray(parsed.quiz)
      ? parsed.quiz
          .map((q: any) => {
            const question =
              typeof q.question === "string" ? q.question.trim() : "";

            const options = Array.isArray(q.options)
              ? q.options
                  .filter(
                    (opt: any) => typeof opt === "string" && opt.trim() !== "",
                  )
                  .slice(0, 4)
              : [];

            let answerIndex = 0;

            if (
              typeof q.answer === "number" &&
              q.answer >= 0 &&
              q.answer <= 3
            ) {
              answerIndex = q.answer;
            } else if (typeof q.answer === "string") {
              const asNumber = Number(q.answer);
              if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber <= 3) {
                answerIndex = asNumber;
              }
            }

            return {
              question,
              options,
              answer: String(answerIndex),
            };
          })
          .filter((q: any) => q.question && q.options.length === 4)
      : [];

    if (normalizedQuiz.length === 0) {
      return NextResponse.json(
        { error: "Quiz үүсгэж чадсангүй" },
        { status: 500 },
      );
    }

    let article;

    if (articleId) {
      const existingArticle = await prisma.article.findFirst({
        where: {
          id: articleId,
          userId: dbUser.id,
        },
      });

      if (!existingArticle) {
        return NextResponse.json(
          { error: "Article олдсонгүй" },
          { status: 404 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.quiz.deleteMany({
          where: { articleId: existingArticle.id },
        });

        await tx.article.update({
          where: { id: existingArticle.id },
          data: {
            title,
            content: text,
            summary: parsed.summary,
          },
        });

        await tx.quiz.createMany({
          data: normalizedQuiz.map((q: any) => ({
            articleId: existingArticle.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
          })),
        });
      });

      article = await prisma.article.findUnique({
        where: { id: existingArticle.id },
        include: { quizzes: true },
      });
    } else {
      const existingArticle = await prisma.article.findFirst({
        where: {
          userId: dbUser.id,
          title,
          content: text,
        },
        include: {
          quizzes: true,
        },
      });

      if (existingArticle) {
        await prisma.$transaction(async (tx) => {
          await tx.quiz.deleteMany({
            where: { articleId: existingArticle.id },
          });

          await tx.article.update({
            where: { id: existingArticle.id },
            data: {
              summary: parsed.summary,
            },
          });

          await tx.quiz.createMany({
            data: normalizedQuiz.map((q: any) => ({
              articleId: existingArticle.id,
              question: q.question,
              options: q.options,
              answer: q.answer,
            })),
          });
        });

        article = await prisma.article.findUnique({
          where: { id: existingArticle.id },
          include: { quizzes: true },
        });
      } else {
        article = await prisma.article.create({
          data: {
            title,
            content: text,
            summary: parsed.summary,
            userId: dbUser.id,
            quizzes: {
              create: normalizedQuiz.map((q: any) => ({
                question: q.question,
                options: q.options,
                answer: q.answer,
              })),
            },
          },
          include: {
            quizzes: true,
          },
        });
      }
    }

    if (!article) {
      return NextResponse.json(
        { error: "Article үүсгэж чадсангүй" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        id: article.id,
        title: article.title,
        summary: article.summary,
        quiz: article.quizzes,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("GENERATE_ROUTE_ERROR:", error);

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI квота дууссан байна." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: error?.message || "Алдаа гарлаа" },
      { status: 500 },
    );
  }
}
