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
      if (!summaryResponse.ok) {
        throw new Error("Failed to summarize goal")
      }
      const summaryData = await summaryResponse.json()
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
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
      {stage === "input" && (
        <form onSubmit={handleInput}>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">What do you want to achieve?</h2>
          <input
            type="text"
            value={rawGoal}
            onChange={(e) => setRawGoal(e.target.value)}
            placeholder="I want to..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 mb-6 text-lg bg-gray-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || rawGoal.trim() === ""}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg px-6 py-3 disabled:bg-gray-300"
          >
            {loading ? "Processing..." : "Send"}
          </button>
        </form>
      )}

      {stage === "confirm" && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Confirm your goal</h2>
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg mb-6">
            <p className="text-lg text-gray-800">
              It sounds like you want to <strong>{summary}</strong>, is that right?
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleConfirmation}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-lg px-6 py-3 disabled:bg-gray-300"
            >
              {loading ? "Loading Questions..." : "Confirm"}
            </button>
            <button
              onClick={handleRevise}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-6 py-3 disabled:bg-gray-300"
            >
              Revise
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
    </div>
  )
}
