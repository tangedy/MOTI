const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json()

    if (!goal || goal.trim() === "") {
      return NextResponse.json({ error: "No goal provided" }, { status: 400 })
    }

    // Simple question templates based on goal keywords
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "AI features are disabled - API key not configured" }, { status: 503 })
    }

    const prompt = `You are an expert project clarification specialist with deep domain knowledge across multiple fields.

GOAL: "${goal}"

Your primary objective is to transform this potentially vague goal into a crystal-clear, well-defined objective with specific requirements and scope.

ANALYSIS FRAMEWORK:
1. GOAL SPECIFICATION: What exactly does the user want to create/achieve?
2. SCOPE DEFINITION: What are the boundaries, requirements, and constraints?
3. CONTEXT GATHERING: What's the specific situation, environment, or use case?
4. SUCCESS CRITERIA: What does "done" and "successful" look like?
5. RESOURCE BASELINE: What do they currently have access to?

Generate exactly 5 questions that will clarify:
- The specific type/style/version of what they want
- Key requirements and must-haves vs nice-to-haves
- The context and intended use case
- Success criteria and quality standards
- Available resources and starting point

Each question should be:
- Focused on defining WHAT they want, not HOW to achieve it
- Specific enough to eliminate ambiguity
- Practical and relevant to planning
- Designed to prevent scope creep

RESPONSE FORMAT: JSON array of exactly 5 questions
["question 1", "question 2", "question 3", "question 4", "question 5"]

- make sure each question begets no more than one response. Dont ask two things in one question.
- DONT include a bracketed list of examples in your questions.
- Word your questions in dialogue-like human language.
DOMAIN-SPECIFIC PATTERNS:

CREATIVE PROJECTS: 
- Style/aesthetic preferences
- Intended use (personal, display, gift, etc.)
- Materials/medium preferences
- Size/scale requirements
- Quality/complexity level

EVENTS/PLANNING:
- Occasion and context
- Number of people/scale
- Venue type and location
- Budget range or constraints
- Style/theme/atmosphere

SKILL LEARNING:
- Specific skill level target
- Primary use case/application
- Learning format preferences
- Time commitment available
- Current experience level

BUSINESS/CAREER:
- Specific industry/role/company
- Timeline and urgency
- Success metrics
- Current situation/starting point
- Key requirements/deal-breakers

HEALTH/FITNESS:
- Specific measurable outcomes
- Medical considerations
- Lifestyle integration needs
- Activity preferences
- Current baseline

FINANCIAL:
- Specific amount/timeline
- Purpose/use case
- Risk tolerance
- Current situation`

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
              "You are an expert project clarification specialist. Always respond with ONLY valid JSON in the exact format requested - a JSON array of exactly 5 questions.",
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
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^[]*(\[.*\])[^\]]*$/s, "$1")
      
      try {
        const questionsData = JSON.parse(content)
        if (!Array.isArray(questionsData) || questionsData.length !== 5) {
          throw new Error("Invalid response format")
        }
        
        // Validate that all questions are strings
        if (!questionsData.every(q => typeof q === 'string' && q.trim().length > 0)) {
          throw new Error("Invalid question format")
        }
        
        return NextResponse.json({ questions: questionsData })
      } catch (parseError) {
        console.error("Failed to parse questions:", parseError)
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
