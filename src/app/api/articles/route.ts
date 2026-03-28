// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/prisma";

// export async function GET() {}

// export async function POST(request: Request) {}


// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET() {
//   try {
//     const articles = await prisma.article.findMany({
//       orderBy: { createdAt: "desc" },
//     });
//     // Хэрэв дата байхгүй бол хоосон массив буцаах (SyntaxError-оос сэргийлнэ)
//     return NextResponse.json(articles || []);
//   } catch (error) {
//     console.error("GET Articles Error:", error);
//     return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { userId: clerkId } = await auth();
//     if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // DB-ээс хэрэглэгчийн жинхэнэ ID-г олох
//     const user = await prisma.user.findUnique({ where: { clerkId } });
//     if (!user) return NextResponse.json({ error: "User not synced" }, { status: 404 });

//     const body = await request.json();
//     const { title, content, summary } = body;

//     const article = await prisma.article.create({
//       data: {
//         title,
//         content,
//         summary,
//         userId: user.id, // Clerk-ийн ID биш, DB-ийн CUID-г ашиглана
//       },
//     });

//     return NextResponse.json(article, { status: 201 });
//   } catch (error) {
//     console.error("POST Article Error:", error);
//     return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { syncUser } from "@/lib/sync-user";
import { prisma } from "@/lib/prisma";

// 1. Бүх артикулуудыг авах (Sidebar-д зориулагдсан)
export async function GET() {
  try {
    const dbUser = await syncUser();
    
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      where: { userId: dbUser.id }, // Зөвхөн тухайн хэрэглэгчийн артикулуудыг харуулна
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles || []);
  } catch (error) {
    console.error("GET Articles Error:", error);
    return NextResponse.json({ error: "Датаг авахад алдаа гарлаа" }, { status: 500 });
  }
}

// 2. Шинэ артикл хадгалах
export async function POST(request: Request) {
  try {
    const dbUser = await syncUser();
    
    if (!dbUser) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, summary } = body;
    
    const article = await prisma.article.create({
      data: {
        title: title || "Гарчиггүй артикл",
        content: content,
        summary: summary,
        userId: dbUser.id, 
      }
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json({ error: "Хадгалахад алдаа гарлаа" }, { status: 500 });
  }
}