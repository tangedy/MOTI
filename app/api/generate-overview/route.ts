import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { goal, answers } = await request.json()

    if (!goal) {
      return NextResponse.json({ error: "No goal provided" }, { status: 400 })
    }

    // Check if API key is available
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI features are disabled - API key not configured" }, { status: 503 })
    }

    // Build context from answers
    const answersContext = answers
      ? Object.entries(answers)
          .filter(([_, value]) => value)
          .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
          .join("\n\n")
      : ""

    const prompt = `Based on this goal and the user's context, identify the MAIN, general steps needed to achieve this goal. Use simple, clear language that anyone can understand.

Goal: ${goal}

User Context:
${answersContext}

Generate 4-6 main steps that cover the essential areas needed to achieve this goal. For each step, provide:
1. A clear, short and simple title (what needs to be done)
2. A brief but concise description of WHY this step is necessary and important

Respond with ONLY valid JSON in this format:
{
  "steps": [
    {
      "title": "Simple, clear step title",
      "description": "Detailed explanation of why this step is necessary, what it accomplishes, and why it's important for achieving the goal. This should be 2-3 sentences that help the user understand the reasoning behind this step."
    }
  ]
}

Make the steps:
- High-level and strategic (not detailed tasks)
- In logical order
- Cover the main areas needed for success
- Use simple, motivating language
- Focus on the "what" and "why", not the "how"`

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
              "You are a helpful assistant that creates clear, high-level overviews of what needs to be done to achieve goals. Always respond with ONLY valid JSON in the exact format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      let content = aiResponse.choices[0].message.content.trim()

      // Clean up common formatting issues
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^{]*({.*})[^}]*$/s, "$1")

      try {
        const overviewData = JSON.parse(content)

        // Validate structure
        if (!overviewData.steps || !Array.isArray(overviewData.steps) || overviewData.steps.length === 0) {
          throw new Error("Invalid overview structure")
        }

        // Validate each step
        for (const step of overviewData.steps) {
          if (!step.title || !step.description) {
            throw new Error("Invalid step structure")
          }
        }

        return NextResponse.json(overviewData)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        console.error("Raw content:", content)

        // Return fallback overview
        const fallbackOverview = {
          steps: [
            {
              title: "Plan and prepare",
              description:
                "Every successful goal starts with proper planning. This step helps you understand exactly what you're working toward, what resources you'll need, and what obstacles you might face. Without planning, you're likely to waste time and energy on the wrong activities.",
            },
            {
              title: "Build foundational skills",
              description:
                "Most goals require developing new abilities or strengthening existing ones. This step ensures you have the core competencies needed to succeed. It's like building a strong foundation before constructing a house - everything else depends on getting this right.",
            },
            {
              title: "Take consistent action",
              description:
                "Goals are achieved through regular, sustained effort rather than sporadic bursts of activity. This step focuses on creating habits and routines that move you forward every day, even when motivation is low. Consistency beats intensity over the long term.",
            },
            {
              title: "Monitor and adjust",
              description:
                "Success rarely follows a straight line. This step involves regularly checking your progress, celebrating wins, and making course corrections when needed. It helps you stay on track and adapt to changing circumstances without losing momentum.",
            },
          ],
        }

        return NextResponse.json(fallbackOverview)
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
}
