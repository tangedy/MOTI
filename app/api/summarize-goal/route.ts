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
        model: "llama-3.1-8b-instant",
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
      
      console.log("Raw AI response (summarize-goal):", content)
      
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^{]*({.*})[^}]*$/m, "$1")
      
      // Fix common malformed JSON issues
      if (!content.startsWith('{')) {
        content = '{' + content
      }
      if (!content.endsWith('}')) {
        content = content + '}'
      }
      
      console.log("Cleaned content (summarize-goal):", content)
      
      try {
        const summaryData = JSON.parse(content)
        if (summaryData.error === 400) {
          return NextResponse.json({ error: "Hmm. That's a bit unclear." }, { status: 400 })
        }
        if (!summaryData.summary) {
          console.error("No summary returned:", summaryData)
          return NextResponse.json({ error: "No summary returned", debug: { raw: aiResponse.choices[0].message.content, cleaned: content, parsed: summaryData } }, { status: 500 })
        }
        return NextResponse.json(summaryData)
      } catch (parseError) {
        console.error("Failed to parse summary:", parseError)
        console.error("Content that failed to parse:", content)
        return NextResponse.json({ 
          error: "Failed to parse summary", 
          debug: { 
            raw: aiResponse.choices[0].message.content,
            cleaned: content,
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          }
        }, { status: 500 })
      }
    } else {
      const errorText = await response.text()
      console.error("API request failed (summarize-goal):", response.status, errorText)
      return NextResponse.json({ 
        error: `API request failed: ${response.status}`, 
        debug: errorText 
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
} 