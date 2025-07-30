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
      <div className="max-w-2xl mx-auto bg-white/60 border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 md:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-light mb-4 text-gray-700" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          {showPhaseChoice ? "Generating follow-up questions..." : "Processing your responses..."}
        </h2>
        <p className="text-gray-500">This might take a moment.</p>
      </div>
    )
  }

  if (showPhaseChoice) {
    return (
      <div className="max-w-2xl mx-auto bg-white/60 border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 md:p-12">
        <h2 className="text-2xl sm:text-3xl font-light mb-4 sm:mb-6 text-gray-700" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          Great progress!
        </h2>
        <p className="mb-4 sm:mb-6 text-gray-600">
          You've completed the {currentPhase === "primary" ? "primary" : "secondary"} questions. What would you like to do next?
        </p>

        <div className="mb-4 sm:mb-6">
          <div className="w-full bg-gray-100 h-2 mb-2 rounded-full overflow-hidden">
            <div className="bg-[rgba(255,179,102,0.95)] h-2 rounded-full transition-all duration-500" style={{ width: `${getProgress()}%` }}></div>
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-400">
            <span>{getStatusText()}</span>
            <span>{Object.keys(answers).length} questions answered</span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <button onClick={() => proceedToOverview(answers)} className="w-full bg-[rgba(255,179,102,0.95)] hover:bg-[rgba(255,179,102,1)] transition text-white font-semibold rounded-lg py-3">
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
    <div className="max-w-2xl mx-auto bg-white/60 border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 md:p-12">
      <h2 className="text-2xl sm:text-3xl font-light mb-4 text-gray-700" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
        Okay, let's talk.
      </h2>
      <p className="text-gray-600 mb-4 sm:mb-6">
        Goal: <span className="font-semibold text-gray-800">{goal}</span>
      </p>

      <div className="mb-6 sm:mb-8">
        <div className="w-full bg-gray-100 h-2 mb-2 rounded-full overflow-hidden">
          <div className="bg-[rgba(255,179,102,0.95)] h-2 rounded-full transition-all duration-500" style={{ width: `${getProgress()}%` }}></div>
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-gray-400">
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

      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-normal mb-4 text-gray-800" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          {currentQuestions[currentQuestionIndex]}
        </h3>
        <QuestionInput question={currentQuestions[currentQuestionIndex]} onAnswer={handleAnswer} onSkip={handleSkip} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
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

      {/* Error bar, left-aligned, dark semi-transparent, reserved space, fade-in */}
      <div style={{ minHeight: 36 }} className="w-full flex items-start justify-start mt-4">
        <div className={`transition-opacity duration-500 ${error ? 'opacity-100' : 'opacity-0'}` + " w-full max-w-md"}>
          {error && (
            <div className="p-2 bg-[rgba(153,27,27,0.85)] border border-[rgba(120,20,20,0.7)] text-white rounded-lg text-left text-sm shadow-sm font-normal" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
              {error}
            </div>
          )}
        </div>
      </div>
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full px-4 sm:px-6 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,179,102,0.7)] h-20 sm:h-24 bg-white/30 backdrop-blur-md text-base text-left font-normal shadow-md placeholder-gray-500 transition"
        style={{ fontFamily: 'Segoe UI, Arial, sans-serif', resize: 'vertical' }}
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="flex-1 bg-[rgba(255,179,102,0.95)] hover:bg-[rgba(255,179,102,1)] transition text-white font-semibold rounded-lg py-2 disabled:bg-gray-300"
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
