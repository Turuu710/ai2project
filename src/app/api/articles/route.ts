// import { NextResponse } from "next/server";
// import { syncUser } from "@/lib/sync-user";
// import { prisma } from "@/lib/prisma";
// import { auth, currentUser } from "@clerk/nextjs/server";

// export async function GET() {
//   try {
//     const { userId: clerkId } = await auth();
//     const user = await currentUser();

//     if (!clerkId || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const email = user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
//     const name = user.fullName?.trim() || user.firstName?.trim() || "User";

//     if (!email) {
//       return NextResponse.json({ error: "Email олдсонгүй" }, { status: 400 });
//     }

//     const dbUser = await syncUser({
//       clerkId,
//       email,
//       name,
//     });

//     const articles = await prisma.article.findMany({
//       where: { userId: dbUser.id },
//       orderBy: { createdAt: "desc" },
//       include: {
//         quizzes: true,
//       },
//     });

//     return NextResponse.json(articles, { status: 200 });
//   } catch (error) {
//     console.error("GET Articles Error:", error);
//     return NextResponse.json(
//       { error: "Датаг авахад алдаа гарлаа" },
//       { status: 500 },
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { userId: clerkId } = await auth();
//     const user = await currentUser();

//     if (!clerkId || !user) {
//       return NextResponse.json(
//         { error: "Нэвтрэх шаардлагатай" },
//         { status: 401 },
//       );
//     }

//     const email = user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
//     const name = user.fullName?.trim() || user.firstName?.trim() || "User";

//     if (!email) {
//       return NextResponse.json({ error: "Email олдсонгүй" }, { status: 400 });
//     }

//     const dbUser = await syncUser({
//       clerkId,
//       email,
//       name,
//     });

//     const body = await request.json();
//     const title =
//       typeof body.title === "string" && body.title.trim()
//         ? body.title.trim()
//         : "Гарчиггүй артикл";
//     const content = typeof body.content === "string" ? body.content.trim() : "";
//     const summary = typeof body.summary === "string" ? body.summary.trim() : "";
//     const quizzes = Array.isArray(body.quizzes) ? body.quizzes : [];

//     if (!content || !summary) {
//       return NextResponse.json(
//         { error: "content болон summary шаардлагатай" },
//         { status: 400 },
//       );
//     }

//     const existingArticle = await prisma.article.findFirst({
//       where: {
//         userId: dbUser.id,
//         title,
//         content,
//       },
//       include: {
//         quizzes: true,
//       },
//     });

//     if (existingArticle) {
//       return NextResponse.json(existingArticle, { status: 200 });
//     }

//     const normalizedQuizzes = quizzes
//       .map((q: any) => {
//         const options = Array.isArray(q.options)
//           ? q.options
//               .filter(
//                 (opt: any) => typeof opt === "string" && opt.trim() !== "",
//               )
//               .slice(0, 4)
//           : [];

//         const answer =
//           q.answer !== undefined && q.answer !== null ? String(q.answer) : "0";

//         return {
//           question: typeof q.question === "string" ? q.question.trim() : "",
//           options,
//           answer,
//         };
//       })
//       .filter((q: any) => q.question !== "" && q.options.length > 0);

//     const article = await prisma.article.create({
//       data: {
//         title,
//         content,
//         summary,
//         userId: dbUser.id,
//         quizzes: normalizedQuizzes.length
//           ? {
//               create: normalizedQuizzes.map((q: any) => ({
//                 question: q.question,
//                 options: q.options,
//                 answer: q.answer,
//               })),
//             }
//           : undefined,
//       },
//       include: {
//         quizzes: true,
//       },
//     });

//     return NextResponse.json(article, { status: 201 });
//   } catch (error) {
//     console.error("POST API Error:", error);
//     return NextResponse.json(
//       { error: "Хадгалахад алдаа гарлаа" },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { syncUser } from "@/lib/sync-user";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай" },
        { status: 401 },
      );
    }

    const email = user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
    const name = user.fullName?.trim() || user.firstName?.trim() || "User";

    if (!email) {
      return NextResponse.json({ error: "Email олдсонгүй" }, { status: 400 });
    }

    const dbUser = await syncUser({ clerkId, email, name });

    const body = await request.json();
    const { title, content, summary, quizzes } = body;

    if (!content || !summary) {
      return NextResponse.json(
        { error: "Агуулга болон хураангуй шаардлагатай" },
        { status: 400 },
      );
    }

    
    const rawQuizzes = Array.isArray(quizzes) ? quizzes : [];

    const normalizedQuizzes = rawQuizzes
      .map((q: any) => {
        const options = Array.isArray(q.options)
          ? q.options
              .filter(
                (opt: any) => typeof opt === "string" && opt.trim() !== "",
              )
              .map((o: string) => o.trim())
          : [];


        let finalAnswer = "0";
        if (typeof q.answer === "number") {
          finalAnswer = String(q.answer);
        } else if (typeof q.answer === "string") {
         
          const foundIndex = options.indexOf(q.answer.trim());
          finalAnswer =
            foundIndex !== -1 ? String(foundIndex) : q.answer.trim();
        }

        return {
          question: typeof q.question === "string" ? q.question.trim() : "",
          options,
          answer: finalAnswer,
        };
      })

      .filter((q) => q.question.length > 0 && q.options.length >= 2);


    const existingArticle = await prisma.article.findFirst({
      where: {
        userId: dbUser.id,
        title: title?.trim() || "Гарчиггүй",
        content: content.trim(),
      },
      include: { quizzes: true },
    });

    if (existingArticle) {
      return NextResponse.json(existingArticle, { status: 200 });
    }


    const article = await prisma.article.create({
      data: {
        title: title?.trim() || "Гарчиггүй артикл",
        content: content.trim(),
        summary: summary.trim(),
        userId: dbUser.id,
        quizzes:
          normalizedQuizzes.length > 0
            ? {
                create: normalizedQuizzes.map((q) => ({
                  question: q.question,
                  options: q.options,
                  answer: q.answer,
                })),
              }
            : undefined,
      },
      include: { quizzes: true },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json(
      { error: "Сервер дээр алдаа гарлаа" },
      { status: 500 },
    );
  }
}
