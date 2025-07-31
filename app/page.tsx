"use client"

import { useState } from "react"
import GoalForm from "@/components/goal-form"
import Consulting from "@/components/consulting"
import PlanOverview from "@/components/plan-overview"
import TimelineSelector from "@/components/timeline-selector"
import PlanDisplay from "@/components/plan-display"
import { AnimatedWrapper } from "@/components/ui/animated-wrapper"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"goal" | "consulting" | "overview" | "timeline" | "plan">("goal")
  const [goalData, setGoalData] = useState<{ goal: string; questions: string[] } | null>(null)
  const [consultingData, setConsultingData] = useState<{ goal: string; answers: Record<string, string> } | null>(null)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [timelineData, setTimelineData] = useState<{ timeline: string; intensity: string } | null>(null)
  const [planData, setPlanData] = useState<any>(null)

  const handleGoalSubmit = (data: { goal: string; questions: string[] }) => {
    setGoalData(data)
    setCurrentStep("consulting")
  }

  const handleConsultingComplete = (data: { goal: string; answers: Record<string, string> }) => {
    setConsultingData(data)
    setCurrentStep("overview")
  }

  const handleOverviewApprove = (overview: any) => {
    setOverviewData(overview)
    setCurrentStep("timeline")
  }

  const handleTimelineConfirm = (timeline: { timeline: string; intensity: string }) => {
    setTimelineData(timeline)
    setCurrentStep("plan")
  }

  const resetApp = () => {
    setCurrentStep("goal")
    setGoalData(null)
    setConsultingData(null)
    setOverviewData(null)
    setTimelineData(null)
    setPlanData(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Simple Header */}
        <AnimatedWrapper index={0}>
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">MOTI</h1>
            <p className="text-sm sm:text-base text-gray-600">your execution engine</p>
          </div>
        </AnimatedWrapper>

        {/* Main Content */}
        <AnimatedWrapper index={1}>
          {currentStep === "goal" && <GoalForm onSubmit={handleGoalSubmit} />}

          {currentStep === "consulting" && goalData && (
            <Consulting goal={goalData.goal} questions={goalData.questions} onComplete={handleConsultingComplete} />
          )}

          {currentStep === "overview" && consultingData && (
            <PlanOverview
              goal={consultingData.goal}
              answers={consultingData.answers}
              onApprove={handleOverviewApprove}
              onBack={() => setCurrentStep("consulting")}
            />
          )}

          {currentStep === "timeline" && consultingData && overviewData && (
            <TimelineSelector
              goal={consultingData.goal}
              answers={consultingData.answers}
              overview={overviewData}
              onConfirm={handleTimelineConfirm}
              onBack={() => setCurrentStep("overview")}
              onGeneratePlan={(plan) => {
                setPlanData(plan)
                setCurrentStep("plan")
              }}
            />
          )}

          {currentStep === "plan" && planData && <PlanDisplay plan={planData} onReset={resetApp} />}
        </AnimatedWrapper>
      </div>
    </div>
  )
}
