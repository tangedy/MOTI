import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { goal, answers, overview } = await request.json()

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

    // Build overview context
    const overviewContext = overview?.steps
      ? overview.steps.map((step: any, index: number) => `${index + 1}. ${step.title}`).join("\n")
      : ""

    const prompt = `Based on this goal, user context, and planned steps, estimate realistic timeline requirements.

Goal: ${goal}

User Context:
${answersContext}

Planned Steps:
${overviewContext}

Provide a realistic timeline estimate considering:
- The complexity of the goal
- The user's available time and experience level
- The steps required
- A sustainable pace that prevents burnout

Respond with ONLY valid JSON in this format:
{
  "suggested_weeks": 8,
  "minimum_weeks": 4,
  "maximum_weeks": 16,
  "reasoning": "Brief explanation of why this timeline makes sense based on the goal complexity and user's situation"
}

Guidelines:
- Most goals should be achievable in 2-8 weeks unless they are truly large or complex.
- Only suggest timelines longer than 12 weeks for extremely ambitious or multi-phase goals.
- For simple goals, timelines may be as short as 1-2 weeks.
- Use the user's experience and available time to adjust, but avoid being overly conservative.
- suggested_weeks: Your recommended timeline for sustainable progress
- minimum_weeks: Absolute minimum if working very intensively (5-7 hours/day)
- maximum_weeks: Upper bound for a very relaxed pace (1-2 hours/day)
- reasoning: 1-2 sentences explaining the timeline rationale
- Be realistic

Examples:
// Example 1: Simple goal
{
  "suggested_weeks": 2,
  "minimum_weeks": 1,
  "maximum_weeks": 4,
  "reasoning": "This is a straightforward goal that can be completed quickly with focused effort."
}
// Example 2: Moderate goal
{
  "suggested_weeks": 6,
  "minimum_weeks": 4,
  "maximum_weeks": 10,
  "reasoning": "This goal has several steps but is manageable within a couple of months at a steady pace."
}
// Example 3: Ambitious goal
{
  "suggested_weeks": 12,
  "minimum_weeks": 8,
  "maximum_weeks": 16,
  "reasoning": "This is a complex, multi-phase goal that will require sustained effort over several months."
}`

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
              "You are a helpful assistant that provides realistic timeline estimates for goals. Always respond with ONLY valid JSON in the exact format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      let content = aiResponse.choices[0].message.content.trim()

      // Clean up common formatting issues
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^{]*({.*})[^}]*$/s, "$1")

      try {
        const timelineData = JSON.parse(content)

        // Validate structure
        if (
          typeof timelineData.suggested_weeks !== "number" ||
          typeof timelineData.minimum_weeks !== "number" ||
          typeof timelineData.maximum_weeks !== "number" ||
          !timelineData.reasoning
        ) {
          throw new Error("Invalid timeline structure")
        }

        // Artificially shorten the timeline for now
        const divisor = 4;
        timelineData.suggested_weeks = Math.max(1, Math.round(timelineData.suggested_weeks / divisor));
        timelineData.minimum_weeks = Math.max(1, Math.round(timelineData.minimum_weeks / divisor));
        timelineData.maximum_weeks = Math.max(1, Math.round(timelineData.maximum_weeks / divisor));

        // Ensure logical constraints
        if (timelineData.minimum_weeks > timelineData.suggested_weeks) {
          timelineData.minimum_weeks = Math.max(1, timelineData.suggested_weeks - 2)
        }
        if (timelineData.maximum_weeks < timelineData.suggested_weeks) {
          timelineData.maximum_weeks = timelineData.suggested_weeks * 2
        }

        return NextResponse.json(timelineData)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        console.error("Raw content:", content)

        // Return fallback timeline
        const fallbackTimeline = {
          suggested_weeks: 8,
          minimum_weeks: 4,
          maximum_weeks: 16,
          reasoning:
            "Based on typical goal complexity, this timeline allows for steady progress while maintaining a sustainable pace.",
        }

        return NextResponse.json(fallbackTimeline)
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
}
