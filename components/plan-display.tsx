"use client"

import { useState } from "react"

interface PlanDisplayProps {
  plan: {
    summary: string
    phases: Array<{
      title: string
      description: string
      tasks: Array<{
        title: string
        description: string
        subtasks: string[]
      }>
    }>
    estimated_timeline: string
    minimum_timeline: string
    raw_response?: any
  }
  onReset: () => void
}

export default function PlanDisplay({ plan, onReset }: PlanDisplayProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [completedSubtasks, setCompletedSubtasks] = useState<Set<string>>(new Set())
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]))

  if (!plan || !Array.isArray((plan as any).phases)) {
    return (
      <div className="max-w-2xl mx-auto border border-gray-300 p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">We couldn't generate a structured plan</h2>
        <p className="mb-4">
          The AI response didn't include the expected "phases" data. Please refine your goal or try again.
        </p>
        {"raw_response" in plan && (
          <pre className="p-4 bg-gray-100 border border-gray-300 text-left text-sm overflow-x-auto mb-4">
            {JSON.stringify((plan as any).raw_response ?? plan, null, 2)}
          </pre>
        )}
        <button onClick={onReset} className="bg-blue-600 text-white px-6 py-2">
          Start Over
        </button>
      </div>
    )
  }

  const phases = plan.phases

  const togglePhase = (phaseIndex: number) => {
    const newOpenPhases = new Set(openPhases)
    if (newOpenPhases.has(phaseIndex)) {
      newOpenPhases.delete(phaseIndex)
    } else {
      newOpenPhases.add(phaseIndex)
    }
    setOpenPhases(newOpenPhases)
  }

  const toggleTask = (taskId: string) => {
    const newCompletedTasks = new Set(completedTasks)
    if (newCompletedTasks.has(taskId)) {
      newCompletedTasks.delete(taskId)
    } else {
      newCompletedTasks.add(taskId)
    }
    setCompletedTasks(newCompletedTasks)
  }

  const toggleSubtask = (subtaskId: string) => {
    const newCompletedSubtasks = new Set(completedSubtasks)
    if (newCompletedSubtasks.has(subtaskId)) {
      newCompletedSubtasks.delete(subtaskId)
    } else {
      newCompletedSubtasks.add(subtaskId)
    }
    setCompletedSubtasks(newCompletedSubtasks)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Your Personalized Plan</h2>
            <p className="text-gray-700">{plan.summary}</p>
          </div>
          <button onClick={onReset} className="bg-gray-600 hover:bg-gray-700 transition text-white font-semibold rounded-lg px-4 py-2">
            New Goal
          </button>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="bg-gray-50 px-3 py-1 border border-gray-200 rounded-lg">Estimated: {plan.estimated_timeline}</span>
          <span className="bg-gray-50 px-3 py-1 border border-gray-200 rounded-lg">Minimum: {plan.minimum_timeline}</span>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((phase, phaseIndex) => {
          const isOpen = openPhases.has(phaseIndex)
          const phaseProgress = phase.tasks.reduce((acc, task, taskIndex) => {
            const taskId = `${phaseIndex}-${taskIndex}`
            return acc + (completedTasks.has(taskId) ? 1 : 0)
          }, 0)
          const phaseTotal = phase.tasks.length
          const phaseComplete = phaseProgress === phaseTotal

          return (
            <div key={phaseIndex} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${phaseComplete ? "bg-green-50" : ""}`}>
              <div className="p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg" onClick={() => togglePhase(phaseIndex)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xl">{isOpen ? " −" : "+"}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Phase {phaseIndex + 1}: {phase.title}
                      </h3>
                      <p className="text-gray-700">{phase.description}</p>
                    </div>
                  </div>
                  <span className="bg-gray-50 px-2 py-1 text-sm border border-gray-200 rounded-lg">
                    {phaseProgress}/{phaseTotal} tasks
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-200 p-4 rounded-b-lg">
                  <div className="space-y-4">
                    {phase.tasks.map((task, taskIndex) => {
                      const taskId = `${phaseIndex}-${taskIndex}`
                      const isTaskComplete = completedTasks.has(taskId)
                      const completedSubtaskCount = task.subtasks.reduce((acc, _, subtaskIndex) => {
                        const subtaskId = `${taskId}-${subtaskIndex}`
                        return acc + (completedSubtasks.has(subtaskId) ? 1 : 0)
                      }, 0)

                      return (
                        <div
                          key={taskIndex}
                          className={`border border-gray-200 rounded-lg p-4 ${isTaskComplete ? "bg-green-50" : ""}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <input
                              type="checkbox"
                              checked={isTaskComplete}
                              onChange={() => toggleTask(taskId)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4
                                className={`text-lg font-medium text-gray-900 ${isTaskComplete ? "line-through text-gray-500" : ""}`}
                              >
                                {task.title}
                              </h4>
                              <p className={`text-gray-700 ${isTaskComplete ? "line-through" : ""}`}>
                                {task.description}
                              </p>
                            </div>
                            <span className="bg-gray-50 px-2 py-1 text-sm border border-gray-200 rounded-lg">
                              {completedSubtaskCount}/{task.subtasks.length}
                            </span>
                          </div>

                          <div className="ml-6 space-y-2">
                            {task.subtasks.map((subtask, subtaskIndex) => {
                              const subtaskId = `${taskId}-${subtaskIndex}`
                              const isSubtaskComplete = completedSubtasks.has(subtaskId)

                              return (
                                <div key={subtaskIndex} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSubtaskComplete}
                                    onChange={() => toggleSubtask(subtaskId)}
                                  />
                                  <span className={`text-sm ${isSubtaskComplete ? "line-through text-gray-500" : ""}`}>
                                    {subtask}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
