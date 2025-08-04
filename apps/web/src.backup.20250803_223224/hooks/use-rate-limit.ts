/**
 * @fileMetadata
 * @purpose Rate limiting hook with countdown timer
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["useRateLimit"]
 * @complexity low
 * @tags ["hook", "rate-limit", "timer"]
 * @status active
 */

import { useState, useEffect, useCallback } from 'react'

interface UseRateLimitOptions {
  cooldownMs?: number
  key?: string
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const { cooldownMs = 60000, key = 'default' } = options
  const storageKey = `rateLimit_${key}`
  
  const [isLimited, setIsLimited] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  
  // Check if we're still in cooldown on mount
  useEffect(() => {
    const lastAttempt = localStorage.getItem(storageKey)
    if (lastAttempt) {
      const timePassed = Date.now() - parseInt(lastAttempt, 10)
      if (timePassed < cooldownMs) {
        setIsLimited(true)
        setSecondsRemaining(Math.ceil((cooldownMs - timePassed) / 1000))
      }
    }
  }, [storageKey, cooldownMs])
  
  // Countdown timer
  useEffect(() => {
    if (secondsRemaining > 0) {
      const timer = setTimeout(() => {
        setSecondsRemaining(prev => prev - 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (isLimited && secondsRemaining === 0) {
      setIsLimited(false)
      localStorage.removeItem(storageKey)
    }
    
    // Ensure all code paths return a value
    return undefined
  }, [secondsRemaining, isLimited, storageKey])
  
  const checkLimit = useCallback(() => {
    if (isLimited) {
      return false
    }
    
    // Set the limit
    localStorage.setItem(storageKey, Date.now().toString())
    setIsLimited(true)
    setSecondsRemaining(Math.ceil(cooldownMs / 1000))
    
    return true
  }, [isLimited, storageKey, cooldownMs])
  
  const reset = useCallback(() => {
    localStorage.removeItem(storageKey)
    setIsLimited(false)
    setSecondsRemaining(0)
  }, [storageKey])
  
  return {
    isLimited,
    secondsRemaining,
    checkLimit,
    reset
  }
}