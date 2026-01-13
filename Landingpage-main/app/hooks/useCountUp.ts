import { useEffect, useState, useRef } from 'react'

interface UseCountUpOptions {
  end: number
  start?: number
  duration?: number
  decimals?: number
  enableScrollSpy?: boolean
}

export const useCountUp = ({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  enableScrollSpy = true,
}: UseCountUpOptions) => {
  const [count, setCount] = useState(start)
  const [hasStarted, setHasStarted] = useState(!enableScrollSpy)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!enableScrollSpy) {
      setHasStarted(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [enableScrollSpy, hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const currentCount = start + (end - start) * easeOutQuart
      setCount(currentCount)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [hasStarted, start, end, duration])

  const formattedValue = count.toFixed(decimals)

  return { value: formattedValue, count, elementRef }
}

