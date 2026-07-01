import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, content } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    // Limit content size to prevent abuse
    const truncatedContent = content?.slice(0, 5000) || "";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful writing assistant. Respond directly with the requested content, no preamble.",
        },
        {
          role: "user",
          content: `${prompt}\n\n---\n\n${truncatedContent}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "No response";

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}