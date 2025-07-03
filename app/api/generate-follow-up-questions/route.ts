import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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"
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { goal, answers, phase } = await request.json()

    if (!goal || !answers || !phase) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Build context from previous answers
    const answersContext = Object.entries(answers)
      .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
      .join("\n\n")

    const prompt =
      phase === "secondary"
        ? `Based on this goal and the user's previous answers, generate 3 specific follow-up questions that will help create a more detailed and personalized plan.

Goal: ${goal}

Previous Answers:
${answersContext}

Generate 3 secondary questions that:
- Dig deeper into specific aspects mentioned in their answers
- Help understand their constraints, preferences, or specific situation
- Are more targeted than general questions
- Will help create a more personalized plan

Respond with ONLY a JSON array of 3 questions:
["question 1", "question 2", "question 3"]`
        : `Based on this goal and all previous answers, generate 3 final deep-dive questions that will help create the most comprehensive and foolproof plan possible.

Goal: ${goal}

All Previous Answers:
${answersContext}

Generate 3 tertiary questions that:
- Address potential obstacles or edge cases
- Explore advanced strategies or optimizations
- Help anticipate and plan for challenges
- Will make the final plan as thorough and foolproof as possible

Respond with ONLY a JSON array of 3 questions:
["question 1", "question 2", "question 3"]`

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
              "You are a helpful assistant that generates targeted follow-up questions. Always respond with ONLY a valid JSON array of exactly 3 questions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      let content = aiResponse.choices[0].message.content.trim()

      // Clean up the response
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")

      try {
        const questions = JSON.parse(content)

        if (Array.isArray(questions) && questions.length === 3) {
          return NextResponse.json({ questions })
        } else {
          throw new Error("Invalid questions format")
        }
      } catch (parseError) {
        // Fallback questions if parsing fails
        const fallbackQuestions =
          phase === "secondary"
            ? [
                "What specific challenges do you anticipate facing?",
                "What resources or support do you currently have available?",
                "How will you measure success along the way?",
              ]
            : [
                "What would you do if you encountered a major setback?",
                "How will you maintain motivation during difficult periods?",
                "What would make this plan fail, and how can we prevent that?",
              ]

        return NextResponse.json({ questions: fallbackQuestions })
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
}
