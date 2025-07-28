"use client"

import type React from "react"
import { useState } from "react"

interface ConsultingProps {
  goal: string
  questions: string[]
  onComplete: (data: { goal: string; answers: Record<string, string> }) => void
}

type Phase = "primary" | "secondary" | "tertiary"

export default function Consulting({ goal, questions, onComplete }: ConsultingProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<Phase>("primary")
  const [secondaryQuestions, setSecondaryQuestions] = useState<string[]>([])
  const [tertiaryQuestions, setTertiaryQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPhaseChoice, setShowPhaseChoice] = useState(false)

  const getProgress = () => {
    const primaryAnswered = Math.min(Object.keys(answers).length, 5)
    const secondaryAnswered = Math.max(0, Object.keys(answers).length - 5)
    const tertiaryAnswered = Math.max(0, Object.keys(answers).length - 8)

    if (currentPhase === "primary") {
      return (primaryAnswered / 11) * 100
    } else if (currentPhase === "secondary") {
      return ((5 + secondaryAnswered) / 11) * 100
    } else {
      return ((8 + tertiaryAnswered) / 11) * 100
    }
  }

  const getStatusText = () => {
    if (currentPhase === "primary") return "General Plan"
    if (currentPhase === "secondary") return "Specific Plan"
    return "Foolproof Plan"
  }

  const getCurrentQuestions = () => {
    if (currentPhase === "primary") return questions
    if (currentPhase === "secondary") return secondaryQuestions
    return tertiaryQuestions
  }

  const handleAnswer = async (answer: string) => {
    const currentQuestions = getCurrentQuestions()
    const questionKey = currentQuestions[currentQuestionIndex]

    const newAnswers = {
      ...answers,
      [questionKey]: answer,
    }
    setAnswers(newAnswers)

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      if (currentPhase === "primary") {
        setShowPhaseChoice(true)
      } else if (currentPhase === "secondary") {
        setShowPhaseChoice(true)
      } else {
        proceedToOverview(newAnswers)
      }
    }
  }

  const handleSkip = () => {
    const currentQuestions = getCurrentQuestions()

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      if (currentPhase === "primary") {
        setShowPhaseChoice(true)
      } else if (currentPhase === "secondary") {
        setShowPhaseChoice(true)
      } else {
        proceedToOverview(answers)
      }
    }
  }

  const generateSecondaryQuestions = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-follow-up-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          answers,
          phase: "secondary",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate secondary questions")
      }

      const data = await response.json()
      setSecondaryQuestions(data.questions)
      setCurrentPhase("secondary")
      setCurrentQuestionIndex(0)
      setShowPhaseChoice(false)
    } catch (err) {
      setError("Failed to generate follow-up questions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateTertiaryQuestions = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-follow-up-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          answers,
          phase: "tertiary",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate tertiary questions")
      }

      const data = await response.json()
      setTertiaryQuestions(data.questions)
      setCurrentPhase("tertiary")
      setCurrentQuestionIndex(0)
      setShowPhaseChoice(false)
    } catch (err) {
      setError("Failed to generate follow-up questions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const proceedToOverview = (finalAnswers: Record<string, string>) => {
    onComplete({ goal, answers: finalAnswers })
  }

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {showPhaseChoice ? "Generating follow-up questions..." : "Processing your responses..."}
        </h2>
        <p className="text-gray-600">This might take a moment.</p>
      </div>
    )
  }

  if (showPhaseChoice) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Great progress!</h2>
        <p className="mb-6 text-gray-700">
          You've completed the {currentPhase === "primary" ? "primary" : "secondary"} questions. What would you like to do next?
        </p>

        <div className="mb-6">
          <div className="w-full bg-gray-100 h-2 mb-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getProgress()}%` }}></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{getStatusText()}</span>
            <span>{Object.keys(answers).length} questions answered</span>
          </div>
        </div>

        <div className="space-y-4">
          <button onClick={() => proceedToOverview(answers)} className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg py-3">
            See My Plan Overview
          </button>

          <div className="text-center text-gray-400">or</div>

          {currentPhase === "primary" && (
            <button onClick={generateSecondaryQuestions} className="w-full bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg py-3">
              Answer More Specific Questions (3 more)
            </button>
          )}

          {currentPhase === "secondary" && (
            <button onClick={generateTertiaryQuestions} className="w-full bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg py-3">
              Answer Final Deep-Dive Questions (3 more)
            </button>
          )}
        </div>
      </div>
    )
  }

  const currentQuestions = getCurrentQuestions()

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Okay, let's talk.</h2>
      <p className="text-gray-700 mb-6">
        Goal: <strong>{goal}</strong>
      </p>

      <div className="mb-8">
        <div className="w-full bg-gray-100 h-2 mb-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getProgress()}%` }}></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{getStatusText()}</span>
          <span>
            {currentPhase === "primary" &&
              `Question ${currentQuestionIndex + 1} of ${currentQuestions.length} (Required)`}
            {currentPhase === "secondary" &&
              `Secondary ${currentQuestionIndex + 1} of ${currentQuestions.length} (Optional)`}
            {currentPhase === "tertiary" &&
              `Final ${currentQuestionIndex + 1} of ${currentQuestions.length} (Optional)`}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-900">{currentQuestions[currentQuestionIndex]}</h3>
        <QuestionInput question={currentQuestions[currentQuestionIndex]} onAnswer={handleAnswer} onSkip={handleSkip} />
      </div>

      <div className="flex justify-between">
        <button
          onClick={goBack}
          disabled={currentQuestionIndex === 0}
          className="bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-4 py-2 disabled:bg-gray-300"
        >
           Back
        </button>

        <button onClick={handleSkip} className="bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-4 py-2">
          Skip Question 
        </button>
      </div>

      {error && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
    </div>
  )
}

function QuestionInput({
  question,
  onAnswer,
  onSkip,
}: {
  question: string
  onAnswer: (answer: string) => void
  onSkip: () => void
}) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onAnswer(inputValue.trim())
      setInputValue("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 h-28 bg-gray-50 text-base"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg py-2 disabled:bg-gray-300"
        >
          {question.includes("?") ? "Answer" : "Next"} 
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 bg-gray-200 hover:bg-gray-300 transition text-gray-700 font-semibold rounded-lg py-2"
        >
          Skip
        </button>
      </div>
    </form>
  )
}
