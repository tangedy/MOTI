"use client"

import { AnimatedWrapper } from "@/components/ui/animated-wrapper"

export default function TestAnimation() {
  return (
    <div className="p-8 space-y-4">
      <AnimatedWrapper index={0}>
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          First element - should fade in first
        </div>
      </AnimatedWrapper>
      
      <AnimatedWrapper index={1}>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          Second element - should fade in 200ms later
        </div>
      </AnimatedWrapper>
      
      <AnimatedWrapper index={2}>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          Third element - should fade in 400ms later
        </div>
      </AnimatedWrapper>
    </div>
  )
} 