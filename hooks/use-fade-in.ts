import { useState, useEffect } from "react"

interface UseFadeInOptions {
  delay?: number
  duration?: number
  staggerDelay?: number
}

export function useFadeIn(options: UseFadeInOptions = {}) {
  const { delay = 100, duration = 1000, staggerDelay = 200 } = options
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])

  const getAnimationClasses = (index: number = 0) => {
    const totalDelay = delay + (index * staggerDelay)
    return {
      className: `transition-all ease-out ${
        isLoaded 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-8'
      }`,
      style: {
        transitionDuration: `${duration}ms`,
        transitionDelay: `${totalDelay}ms`,
        transitionProperty: 'all',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }

  return {
    isLoaded,
    getAnimationClasses
  }
} 