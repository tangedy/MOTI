"use client"

import { useState, useEffect } from "react"

interface PlanOverviewProps {
  goal: string
  answers: Record<string, string>
  onApprove: (overview: any) => void
  onBack: () => void
}

interface OverviewStep {
  title: string
  description: string
}

export default function PlanOverview({ goal, answers, onApprove, onBack }: PlanOverviewProps) {
  const [overviewSteps, setOverviewSteps] = useState<OverviewStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  useEffect(() => {
    generateOverview()
  }, [])

  const generateOverview = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          answers,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate overview")
      }

      const data = await response.json()
      setOverviewSteps(data.steps)
    } catch (err) {
      setError("Failed to generate overview. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => {
    onApprove({ steps: overviewSteps })
  }

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto border border-gray-300 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Analyzing your goal...</h2>
        <p>Creating a high-level overview of what needs to be done.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border border-gray-300 p-6">
        <h2 className="text-2xl font-semibold mb-2">Here's what needs to happen</h2>
        <p className="text-gray-600 mb-4">
          To achieve: <strong>{goal}</strong>
        </p>
        <p className="text-gray-600">
          These are the main steps in simple terms. Click on any step to understand why it's necessary.
        </p>
      </div>

      <div className="space-y-4">
        {overviewSteps.map((step, index) => (
          <div key={index} className="border border-gray-300">
            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleStep(index)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                </div>
                <span>{expandedStep === index ? "−" : "+"}</span>
              </div>
            </div>
            {expandedStep === index && (
              <div className="p-4 bg-blue-50 border-t border-gray-300">
                <p className="text-gray-700">{step.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border border-gray-300 p-6">
        <div className="flex justify-between">
          <button onClick={onBack} className="bg-gray-600 text-white px-6 py-2">
            ← Back to Questions
          </button>

          <button onClick={handleApprove} className="bg-blue-600 text-white px-6 py-2">
            This looks good - Set timeline →
          </button>
        </div>

        {error && <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700">{error}</div>}
      </div>
    </div>
  )
}
