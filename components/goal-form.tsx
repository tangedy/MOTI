"use client"

import type React from "react"
import { useState } from "react"
import { AnimatedWrapper } from "@/components/ui/animated-wrapper"

interface GoalFormProps {
  onSubmit: (data: { goal: string; questions: string[] }) => void
}

export default function GoalForm({ onSubmit }: GoalFormProps) {
  const [rawGoal, setRawGoal] = useState("")
  const [processedGoal, setProcessedGoal] = useState("")
  const [stage, setStage] = useState<"input" | "confirm">("input")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState("")

  const handleInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rawGoal.trim() === "") return

    setLoading(true)
    setError("")

    try {
      // Call the summarize-goal API
      const summaryResponse = await fetch("/api/summarize-goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal: rawGoal }),
      })
      const summaryData = await summaryResponse.json()
      if (!summaryResponse.ok) {
        setError(summaryData.error || "Something went wrong. Please try again.")
        return
      }
      if (summaryData.error === "Hmm. That's a bit unclear.") {
        setError("Please enter a more specific goal so we can help you better.")
        return
      }
      setSummary(summaryData.summary)
      setProcessedGoal(rawGoal)
      setStage("confirm")
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmation = async () => {
    setLoading(true)
    setError("")

    try {
      const questionsResponse = await fetch("/api/get-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal: processedGoal }),
      })

      if (!questionsResponse.ok) {
        throw new Error("Failed to get questions")
      }

      const questionsData = await questionsResponse.json()

      onSubmit({
        goal: processedGoal,
        questions: questionsData.questions,
      })
    } catch (err) {
      setError("Failed to load questions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRevise = () => {
    setRawGoal("")
    setProcessedGoal("")
    setStage("input")
    setError("")
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-start min-h-[60vh] pt-8 sm:pt-12 md:pt-24 px-4">
      {stage === "input" && (
        <form onSubmit={handleInput} className="w-full flex flex-col items-center">
          {/* Header with first animation */}
          <AnimatedWrapper index={0}>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-light mb-6 sm:mb-8 md:mb-10 text-center text-gray-700 px-4" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', letterSpacing: '-0.02em' }}>
              What do you want to achieve?
            </h2>
          </AnimatedWrapper>
          
          {/* Input field with second animation */}
          <AnimatedWrapper index={2}>
            <input
              type="text"
              value={rawGoal}
              onChange={(e) => setRawGoal(e.target.value)}
              placeholder="I want to..."
              className="w-full max-w-md sm:max-w-lg md:max-w-xl px-4 sm:px-6 md:px-8 py-2 sm:py-1.5 mb-2 rounded-2xl border border-gray-300 bg-white/30 backdrop-blur-md text-base sm:text-lg text-left shadow-md focus:outline-none focus:ring-2 focus:ring-coffee-cream placeholder-gray-500 transition font-normal"
              disabled={loading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && rawGoal.trim() !== "") {
                  handleInput(e)
                }
              }}
              style={{ textAlign: 'left' }}
            />
          </AnimatedWrapper>
          
          {/* Error message with third animation */}
          <AnimatedWrapper index={2} className="w-full flex items-start justify-start mt-2 px-4" style={{ minHeight: 32 }}>
            <div className={`transition-opacity duration-500 ${error ? 'opacity-100' : 'opacity-0'}` + " w-full max-w-md"}>
              {error && (
                <div className="p-2 bg-[rgba(153,27,27,0.85)] border border-[rgba(120,20,20,0.7)] text-white rounded-lg text-left text-sm shadow-sm font-normal" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                  {error}
                </div>
              )}
            </div>
          </AnimatedWrapper>
        </form>
      )}

      {stage === "confirm" && (
        <div className="w-full px-4">
          <AnimatedWrapper index={1}>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-light mb-4 sm:mb-6 md:mb-7 text-center text-gray-700" style={{ fontFamily: 'Segoe UI, Arial, sans-serif', letterSpacing: '-0.02em' }}>
              It sounds like you want to...
            </h2>
          </AnimatedWrapper>
          
          <div>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 md:mb-7 text-center text-gray-800">
              <AnimatedWrapper index={4}>
                <strong>{summary}, </strong>
              </AnimatedWrapper>
              <AnimatedWrapper index={8}>
                <div>is that right?</div>
              </AnimatedWrapper>
            </p>
          </div> 
          
          <AnimatedWrapper index={8}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleConfirmation}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg px-3 py-3 disabled:bg-gray-300"
              >
                {"Yes"}
              </button>
              <button
                onClick={handleRevise}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-3 py-3 disabled:bg-gray-300"
              >
                No
              </button>
            </div>
          </AnimatedWrapper>
        </div>
      )}
    </div>
  )
}
