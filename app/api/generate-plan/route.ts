import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { goal, context } = await request.json()

    if (!goal || goal.trim() === "") {
      return NextResponse.json({ error: "No goal provided" }, { status: 400 })
    }

    // Build context string from additional info
    const contextStr = context
      ? Object.entries(context)
          .filter(([_, value]) => value)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : ""

    // Craft the prompt for structured plan generation
    const prompt = `You are a goal planning assistant. You MUST respond with ONLY valid JSON in the exact format specified below.

Goal: ${goal}
Additional Context: ${contextStr}

IMPORTANT: Your response must be ONLY the JSON object below, with no additional text, explanations, or markdown formatting.

{
  "summary": "Brief summary of what the user wants to achieve",
  "phases": [
    {
      "title": "Phase name",
      "description": "Why this phase is important",
      "tasks": [
        {
          "title": "Task name", 
          "description": "What to do",
          "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
        }
      ]
    }
  ],
  "estimated_timeline": "X weeks/months",
  "minimum_timeline": "Y weeks/months"
}

Requirements:
- Create exactly 3 phases
- Each phase must have 4-5 tasks
- Each task must have 3-4 actionable subtasks
- Be specific and actionable, not vague
- Provide realistic timelines
- Response must be valid JSON only`

    // Update the system message as well
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
              "You are a helpful assistant that creates structured, actionable plans. You MUST respond with ONLY valid JSON in the exact format requested. Do not include any markdown formatting, explanations, or additional text outside the JSON object.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 2000,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      let content = aiResponse.choices[0].message.content.trim()

      // Clean up common formatting issues
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")
      content = content.replace(/^[^{]*({.*})[^}]*$/s, "$1") // Extract JSON from any surrounding text

      try {
        const planData = JSON.parse(content)

        // Validate the structure
        if (!planData.phases || !Array.isArray(planData.phases) || planData.phases.length === 0) {
          throw new Error("Invalid plan structure")
        }

        // Ensure each phase has the required structure
        for (const phase of planData.phases) {
          if (!phase.title || !phase.description || !Array.isArray(phase.tasks)) {
            throw new Error("Invalid phase structure")
          }
          for (const task of phase.tasks) {
            if (!task.title || !task.description || !Array.isArray(task.subtasks)) {
              throw new Error("Invalid task structure")
            }
          }
        }

        return NextResponse.json(planData)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        console.error("Raw content:", content)

        // Return a fallback plan structure
        const fallbackPlan = {
          summary: `Create an actionable plan for: ${goal}`,
          phases: [
            {
              title: "Planning & Preparation",
              description: "Set up the foundation for success",
              tasks: [
                {
                  title: "Define specific objectives",
                  description: "Break down your goal into measurable outcomes",
                  subtasks: [
                    "Write down your specific goal",
                    "Set measurable success criteria",
                    "Identify potential obstacles",
                    "Create accountability measures",
                  ],
                },
                {
                  title: "Gather necessary resources",
                  description: "Collect tools, information, and support needed",
                  subtasks: [
                    "Research best practices",
                    "Identify required tools/materials",
                    "Find mentors or support groups",
                    "Set up your workspace",
                  ],
                },
              ],
            },
            {
              title: "Initial Action",
              description: "Take the first concrete steps",
              tasks: [
                {
                  title: "Start with small wins",
                  description: "Build momentum with achievable early tasks",
                  subtasks: [
                    "Complete one small task today",
                    "Track your progress",
                    "Celebrate small victories",
                    "Adjust approach based on results",
                  ],
                },
              ],
            },
            {
              title: "Sustained Progress",
              description: "Maintain consistent effort toward your goal",
              tasks: [
                {
                  title: "Develop consistent habits",
                  description: "Create routines that support your goal",
                  subtasks: [
                    "Set daily/weekly schedules",
                    "Track your consistency",
                    "Review and adjust regularly",
                    "Stay accountable to your plan",
                  ],
                },
              ],
            },
          ],
          estimated_timeline: "4-8 weeks",
          minimum_timeline: "2-3 weeks",
          fallback: true,
        }

        return NextResponse.json(fallbackPlan)
      }
    } else {
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: `Server error: ${error}` }, { status: 500 })
  }
}
