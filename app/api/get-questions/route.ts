import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json()

    if (!goal || goal.trim() === "") {
      return NextResponse.json({ error: "No goal provided" }, { status: 400 })
    }

    // Simple question templates based on goal keywords
    let questions: string[] = []
    const goalLower = goal.toLowerCase()

    if (["grade", "school", "study", "learn", "course"].some((word) => goalLower.includes(word))) {
      questions = [
        "What school/program are you in?",
        "Which subjects are you struggling with most?",
        "How much time can you dedicate to studying per day?",
        "What's your current GPA or grade level?",
        "When is your next major exam/deadline?",
      ]
    } else if (["fitness", "weight", "exercise", "workout", "health"].some((word) => goalLower.includes(word))) {
      questions = [
        "What's your current fitness level?",
        "Do you have access to a gym or prefer home workouts?",
        "How many days per week can you commit to exercise?",
        "Do you have any injuries or limitations?",
        "What's your primary motivation (strength, weight loss, endurance)?",
      ]
    } else if (["job", "career", "interview", "resume", "work"].some((word) => goalLower.includes(word))) {
      questions = [
        "What field/industry are you targeting?",
        "How much relevant experience do you have?",
        "Are you currently employed or job searching?",
        "What's your timeline for making this change?",
        "What skills do you need to develop?",
      ]
    } else {
      // Generic questions for any goal
      questions = [
        "What's your current experience level with this?",
        "How much time can you dedicate to this per week?",
        "What resources do you have available?",
        "What's your target timeline?",
        "What's the biggest challenge you expect to face?",
      ]
    }

    return NextResponse.json({ questions: questions.slice(0, 5) })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
