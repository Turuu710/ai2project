import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Агуулга хоосон байна" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Чи бол боловсролын туслах багш. 
          Заавал дараах JSON бүтцээр хариу өгнө үү:
          {
            "summary": "string",
            "quizzes": [
              {
                "question": "string",
                "options": ["string", "string", "string", "string"],
                "answer": number (зөв хариултын индекс: 0-ээс 3 хүртэл)
              }
            ]
          }
          Нийт 5 асуулт үүсгэнэ үү.`
        },
        {
          role: "user",
          content: content,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content;
    const data = JSON.parse(responseContent || "{}");

    return NextResponse.json({
      summary: data.summary || "Товчлол үүсгэж чадсангүй",
      quizzes: data.quizzes || []
    });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Сервер дээр алдаа гарлаа" }, { status: 500 });
  }
}