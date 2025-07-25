"use client"

import { useState, useEffect } from "react"

interface TimelineSelectorProps {
  goal: string
  answers: Record<string, string>
  overview: any
  onConfirm: (timeline: { timeline: string; intensity: string }) => void
  onBack: () => void
  onGeneratePlan: (plan: any) => void
}

interface TimelineData {
  suggested_weeks: number
  minimum_weeks: number
  maximum_weeks: number
  reasoning: string
}

export default function TimelineSelector({
  goal,
  answers,
  overview,
  onConfirm,
  onBack,
  onGeneratePlan,
}: TimelineSelectorProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [selectedWeeks, setSelectedWeeks] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [error, setError] = useState("")
  const [showRevision, setShowRevision] = useState(false)

  useEffect(() => {
    generateTimelineEstimate()
  }, [])

  const generateTimelineEstimate = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          answers,
          overview,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate timeline estimate")
      }

      const data = await response.json()
      setTimelineData(data)
      setSelectedWeeks(data.suggested_weeks)
    } catch (err) {
      setError("Failed to generate timeline estimate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getIntensityLevel = () => {
    if (!timelineData) return { level: "moderate", description: "", hoursPerDay: "" }

    const ratio = selectedWeeks / timelineData.suggested_weeks

    if (ratio >= 1.5) {
      return {
        level: "relaxed",
        description: "Relaxed pace",
        hoursPerDay: "1-2 hours/day",
      }
    } else if (ratio >= 1.0) {
      return {
        level: "moderate",
        description: "Moderate pace",
        hoursPerDay: "2-3 hours/day",
      }
    } else if (ratio >= 0.75) {
      return {
        level: "intensive",
        description: "Intensive pace",
        hoursPerDay: "3-4 hours/day",
      }
    } else {
      return {
        level: "extreme",
        description: "Very intensive pace",
        hoursPerDay: "5-7 hours/day",
      }
    }
  }

  const getTimelineText = () => {
    if (selectedWeeks < 4) {
      return `${selectedWeeks} week${selectedWeeks === 1 ? "" : "s"}`
    } else if (selectedWeeks % 4 === 0) {
      const months = selectedWeeks / 4
      return `${months} month${months === 1 ? "" : "s"}`
    } else {
      const months = Math.floor(selectedWeeks / 4)
      const remainingWeeks = selectedWeeks % 4
      if (months === 0) {
        return `${remainingWeeks} week${remainingWeeks === 1 ? "" : "s"}`
      }
      return `${months} month${months === 1 ? "" : "s"} and ${remainingWeeks} week${remainingWeeks === 1 ? "" : "s"}`
    }
  }

  const handleConfirm = async () => {
    if (!timelineData) return

    setGeneratingPlan(true)
    setError("")

    try {
      const intensity = getIntensityLevel()
      const timelineText = getTimelineText()

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          context: {
            ...answers,
            timeline: timelineText,
            intensity: intensity.description,
            hours_per_day: intensity.hoursPerDay,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate plan")
      }

      const planData = await response.json()
      onGeneratePlan(planData)
    } catch (err) {
      setError("Failed to generate your plan. Please try again.")
      setGeneratingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border border-gray-300 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Analyzing timeline requirements...</h2>
        <p>Calculating realistic timeframes for your goal.</p>
      </div>
    )
  }

  if (generatingPlan) {
    return (
      <div className="max-w-2xl mx-auto border border-gray-300 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Creating your timeline-optimized plan...</h2>
        <p>Tailoring tasks and phases to your {getTimelineText()} timeline.</p>
      </div>
    )
  }

  if (!timelineData) {
    return (
      <div className="max-w-2xl mx-auto border border-gray-300 p-6 text-center">
        <p className="text-red-600">Failed to load timeline data. Please try again.</p>
        <button onClick={generateTimelineEstimate} className="mt-4 bg-blue-600 text-white px-4 py-2">
          Retry
        </button>
      </div>
    )
  }

  const intensity = getIntensityLevel()
  const isMinimumWarning = selectedWeeks < timelineData.minimum_weeks

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!showRevision && (
        <div className="border border-gray-300 p-6">
          <h2 className="text-2xl font-semibold mb-4">Timeline Estimate</h2>
          <p className="mb-4">Based on your goal and context</p>

          <div className="text-center p-6 bg-blue-50 border border-blue-200 mb-4">
            <p className="text-lg mb-2">I think this can be done in</p>
            <p className="text-3xl font-bold text-blue-600">
              {timelineData.suggested_weeks < 4
                ? `${timelineData.suggested_weeks} week${timelineData.suggested_weeks === 1 ? "" : "s"}`
                : `${Math.round(timelineData.suggested_weeks / 4)} month${Math.round(timelineData.suggested_weeks / 4) === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="p-4 bg-gray-100 border border-gray-300 mb-4">
            <p className="text-sm">{timelineData.reasoning}</p>
          </div>

          <div className="flex gap-4">
            <button onClick={handleConfirm} className="flex-1 bg-blue-600 text-white py-3">
              Sounds good - Create my plan
            </button>
            <button onClick={() => setShowRevision(true)} className="flex-1 bg-gray-600 text-white py-3">
              Let me adjust the timeline
            </button>
          </div>
        </div>
      )}

      {showRevision && (
        <div className="border border-gray-300 p-6">
          <h2 className="text-2xl font-semibold mb-4">Adjust Your Timeline</h2>
          <p className="mb-6">Slide to set your preferred timeline</p>

          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-blue-600 mb-2">{getTimelineText()}</p>
            <p className="text-sm bg-gray-100 inline-block px-3 py-1 border border-gray-300">
              {intensity.description} • {intensity.hoursPerDay}
            </p>
          </div>

          <div className="mb-6">
            <input
              type="range"
              value={selectedWeeks}
              onChange={(e) => setSelectedWeeks(Number(e.target.value))}
              min={Math.max(1, timelineData.minimum_weeks - 2)}
              max={timelineData.maximum_weeks}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                {Math.max(1, timelineData.minimum_weeks - 2) < 4
                  ? `${Math.max(1, timelineData.minimum_weeks - 2)}w`
                  : `${Math.round(Math.max(1, timelineData.minimum_weeks - 2) / 4)}m`}
              </span>
              <span>
                {timelineData.maximum_weeks < 4
                  ? `${timelineData.maximum_weeks}w`
                  : `${Math.round(timelineData.maximum_weeks / 4)}m`}
              </span>
            </div>
          </div>

          {isMinimumWarning && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 mb-4">
              <p>
                ⚠️ This timeline is very aggressive. You'll need to dedicate {intensity.hoursPerDay} to finish in{" "}
                {getTimelineText()}. Consider allowing more time for a sustainable pace.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={onBack} className="bg-gray-600 text-white px-6 py-2">
              ← Back
            </button>

            <button onClick={handleConfirm} className="bg-blue-600 text-white px-6 py-2">
              Create plan for {getTimelineText()} →
            </button>
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-red-100 border border-red-300 text-red-700">{error}</div>}
    </div>
  )
}
