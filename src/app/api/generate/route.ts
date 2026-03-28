// import { NextResponse } from "next/server";

// export async function POST(req: Request) {}


// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   try {
//     const { content } = await request.json();
    
//     // Энд AI-ийн логик орох ёстой (OpenAI/Gemini)
//     // Одоогоор түр зуур dummy summary буцаая:
//     const dummySummary = content.substring(0, 100) + "... (Summarized)";

//     return NextResponse.json({ summary: dummySummary });
//   } catch (error) {
//     return NextResponse.json({ error: "Generation failed" }, { status: 500 });
//   }
// }



import { NextResponse } from "next/server";
import OpenAI from "openai";

// .env.local файлдаа OPENAI_API_KEY-ээ нэмээрэй
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an educational assistant. 
          Return ONLY a JSON object with this EXACT structure:
          {
            "summary": "string",
            "quizzes": [
              {
                "question": "string",
                "options": ["string", "string", "string", "string"],
                "answer": number
              }
            ]
          }
          Generate exactly 5 questions. Do not include any markdown formatting like \`\`\`json.`
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

    // БАТАЛГААЖУУЛАЛТ: Хэрэв quizzes байхгүй бол хоосон массив буцаана
    return NextResponse.json({
      summary: data.summary || "No summary generated",
      quizzes: data.quizzes || []
    });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}