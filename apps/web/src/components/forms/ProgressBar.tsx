'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-400">
          {Math.round(progress)}% complete
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div
              key={stepNumber}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isCompleted && "bg-green-500 text-white",
                isCurrent && "bg-cyan-500 text-white",
                !isCompleted && !isCurrent && "bg-gray-700 text-gray-400"
              )}
            >
              {stepNumber}
            </div>
          )
        })}
      </div>
    </div>
  )
}