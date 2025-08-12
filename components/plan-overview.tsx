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
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Analyzing...</h2>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Here's what needs to happen</h2>
        <p className="text-gray-700 mb-4">
          To achieve: <strong>{goal}</strong>
        </p>
    
      </div>

      <div className="space-y-4">
        {overviewSteps.map((step, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg" onClick={() => toggleStep(index)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 text-blue-600 rounded-full flex items-center justify-center font-semibold border border-gray-300">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                <span className="text-gray-400 text-xl">{expandedStep === index ? " −" : "+"}</span>
              </div>
            </div>
            {expandedStep === index && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <p className="text-gray-700">{step.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-between gap-4">
          <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-6 py-3">
             Revise
          </button>

          <button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg px-6 py-3">
            Proceed
          </button>
        </div>

        {error && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      </div>
    </div>
  )
}
