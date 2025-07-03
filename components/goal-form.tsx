"use client"

import type React from "react"
import { useState } from "react"

interface GoalFormProps {
  onSubmit: (data: { goal: string; questions: string[] }) => void
}

export default function GoalForm({ onSubmit }: GoalFormProps) {
  const [rawGoal, setRawGoal] = useState("")
  const [processedGoal, setProcessedGoal] = useState("")
  const [stage, setStage] = useState<"input" | "confirm">("input")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rawGoal.trim() === "") return

    setLoading(true)
    setError("")

    try {
      const processed = rawGoal
      setProcessedGoal(processed)
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
    <div className="max-w-2xl mx-auto border border-gray-300 p-6">
      {stage === "input" && (
        <form onSubmit={handleInput}>
          <h2 className="text-xl font-semibold mb-4">What do you want to achieve?</h2>
          <input
            type="text"
            value={rawGoal}
            onChange={(e) => setRawGoal(e.target.value)}
            placeholder="I want to..."
            className="w-full p-3 border border-gray-300 mb-4"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || rawGoal.trim() === ""}
            className="bg-blue-600 text-white px-6 py-2 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Send"}
          </button>
        </form>
      )}

      {stage === "confirm" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Confirm your goal</h2>
          <div className="p-4 bg-gray-100 mb-4">
            <p>
              It sounds like you want to <strong>{processedGoal}</strong>, is that right?
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleConfirmation}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 disabled:bg-gray-400"
            >
              {loading ? "Loading Questions..." : "Confirm"}
            </button>
            <button
              onClick={handleRevise}
              disabled={loading}
              className="bg-gray-600 text-white px-6 py-2 disabled:bg-gray-400"
            >
              Revise
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700">{error}</div>}
    </div>
  )
}
