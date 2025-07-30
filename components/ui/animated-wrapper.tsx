"use client"

import React, { ReactNode } from "react"
import { useFadeIn } from "@/hooks/use-fade-in"

interface AnimatedWrapperProps {
  children: ReactNode
  index?: number
  className?: string
  style?: React.CSSProperties
  delay?: number
  duration?: number
  staggerDelay?: number
}

export function AnimatedWrapper({ 
  children, 
  index = 0, 
  className = "",
  style: customStyle,
  delay,
  duration,
  staggerDelay
}: AnimatedWrapperProps) {
  const { getAnimationClasses } = useFadeIn({ delay, duration, staggerDelay })
  const { className: animationClasses, style: animationStyle } = getAnimationClasses(index)

  return (
    <div 
      className={`${animationClasses} ${className}`} 
      style={{ ...animationStyle, ...customStyle }}
    >
      {children}
    </div>
  )
}

interface StaggeredContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  staggerDelay?: number
}

export function StaggeredContainer({ 
  children, 
  className = "",
  delay = 100,
  duration = 1000,
  staggerDelay = 200
}: StaggeredContainerProps) {
  const { isLoaded, getAnimationClasses } = useFadeIn({ delay, duration, staggerDelay })

  // Clone children and add animation props
  const animatedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      const { className: animationClasses, style } = getAnimationClasses(index)
      return React.cloneElement(child, {
        className: `${child.props.className || ''} ${animationClasses}`,
        style: { ...child.props.style, ...style }
      })
    }
    return child
  })

  return (
    <div className={className}>
      {animatedChildren}
    </div>
  )
} 