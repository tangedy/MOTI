import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json()
    if (!goal) {
      return NextResponse.json({ error: "No goal provided" }, { status: 400 })
    }

    // Check if API key is available
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI features are disabled - API key not configured" }, { status: 503 })
    }

    const prompt = `Summarize the following goal in simple, clear language that anyone can understand. Make it concise and easy to grasp, using everyday words.\n\nGoal: ${goal}\n\nRespond with ONLY valid JSON in this format:\n{\n  \"summary\": \"A simple summary of the goal\"\n}\n\nIf you cannot summarize the goal because it is too vague or unclear, respond with ONLY this JSON:\n{\n  \"error\": 400\n}`

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes goals in simple, clear language. Always respond with ONLY valid JSON in the exact format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 100,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      let content = aiResponse.choices[0].message.content.trim()
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^{]*({.*})[^}]*$/s, "$1")
      try {
        const summaryData = JSON.parse(content)
        if (summaryData.error === 400) {
          return NextResponse.json({ error: "Hmm. That's a bit unclear." }, { status: 400 })
        }
        if (!summaryData.summary) throw new Error("No summary returned")
        return NextResponse.json(summaryData)
      } catch (parseError) {
        return NextResponse.json({ error: "Failed to parse summary" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
} 