/**
 * @fileMetadata
 * @owner @engagement-team
 * @purpose "Display user achievements with progress tracking and animations"
 * @dependencies ["@claimguardian/ui", "react", "lucide-react", "framer-motion"]
 * @status stable
 * @ai-integration none
 * @insurance-context gamification
 */

'use client'

import { useState, useEffect } from 'react'
import { Trophy, Star, Target, Zap, Shield, Users, FileCheck, Clock, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  code: string
  name: string
  description: string
  category: 'evidence' | 'speed' | 'community' | 'learning' | 'claims'
  currentLevel: number
  maxLevel: number
  currentPoints: number
  nextLevelPoints: number
  levelNames: string[]
  icon?: string
  earnedAt?: string[]
  isNew?: boolean
}

interface AchievementCardProps {
  achievement: Achievement
  size?: 'small' | 'medium' | 'large'
  showProgress?: boolean
  animate?: boolean
  onClick?: () => void
}

const iconMap = {
  evidence: FileCheck,
  speed: Clock,
  community: Users,
  learning: TrendingUp,
  claims: Shield,
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  award: Award
}

const levelColors = {
  0: 'border-gray-600 bg-gray-900/50',
  1: 'border-orange-600 bg-orange-900/20',
  2: 'border-gray-400 bg-gray-800/50',
  3: 'border-yellow-500 bg-yellow-900/20',
  4: 'border-purple-500 bg-purple-900/20'
}

const levelGlows = {
  0: '',
  1: 'shadow-lg shadow-orange-500/20',
  2: 'shadow-lg shadow-gray-400/20',
  3: 'shadow-lg shadow-yellow-500/30',
  4: 'shadow-xl shadow-purple-500/40'
}

export function AchievementCard({
  achievement,
  size = 'medium',
  showProgress = true,
  animate = true,
  onClick
}: AchievementCardProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const progress = achievement.nextLevelPoints > 0 
    ? (achievement.currentPoints / achievement.nextLevelPoints) * 100 
    : 100

  const Icon = iconMap[achievement.icon as keyof typeof iconMap] || iconMap[achievement.category]
  const levelColor = levelColors[Math.min(achievement.currentLevel, 4) as keyof typeof levelColors]
  const levelGlow = levelGlows[Math.min(achievement.currentLevel, 4) as keyof typeof levelGlows]
  const currentLevelName = achievement.levelNames[achievement.currentLevel - 1] || 'Locked'

  useEffect(() => {
    if (achievement.isNew && animate) {
      setShowAnimation(true)
      const timer = setTimeout(() => setShowAnimation(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [achievement.isNew, animate])

  const cardContent = (
    <Card 
      className={cn(
        "bg-gray-800 border-gray-700 transition-all duration-300 cursor-pointer",
        "hover:border-gray-600 hover:shadow-lg hover:scale-[1.02]",
        levelColor,
        levelGlow,
        size === 'small' && "p-3",
        size === 'large' && "p-6"
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        "pb-3",
        size === 'small' && "p-0 pb-2"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              achievement.currentLevel === 0 && "from-gray-700 to-gray-800",
              achievement.currentLevel === 1 && "from-orange-600/30 to-orange-700/20",
              achievement.currentLevel === 2 && "from-gray-500/30 to-gray-600/20",
              achievement.currentLevel === 3 && "from-yellow-600/30 to-yellow-700/20",
              achievement.currentLevel === 4 && "from-purple-600/30 to-purple-700/20",
              size === 'small' && "p-2",
              size === 'medium' && "p-3",
              size === 'large' && "p-4"
            )}>
              <Icon className={cn(
                "text-white",
                size === 'small' && "h-4 w-4",
                size === 'medium' && "h-5 w-5",
                size === 'large' && "h-6 w-6"
              )} />
            </div>
            <div>
              <CardTitle className={cn(
                "text-white",
                size === 'small' && "text-sm",
                size === 'medium' && "text-base",
                size === 'large' && "text-lg"
              )}>
                {achievement.name}
              </CardTitle>
              {size !== 'small' && (
                <CardDescription className="text-gray-400 text-sm mt-1">
                  {achievement.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {achievement.currentLevel > 0 && (
              <Badge 
                className={cn(
                  "font-semibold",
                  achievement.currentLevel === 1 && "bg-orange-600/20 text-orange-400 border-orange-600/30",
                  achievement.currentLevel === 2 && "bg-gray-600/20 text-gray-300 border-gray-600/30",
                  achievement.currentLevel === 3 && "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
                  achievement.currentLevel === 4 && "bg-purple-600/20 text-purple-400 border-purple-600/30"
                )}
              >
                {currentLevelName}
              </Badge>
            )}
            {achievement.isNew && (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30 animate-pulse">
                NEW!
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {showProgress && size !== 'small' && (
        <CardContent className="pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Level {achievement.currentLevel} / {achievement.maxLevel}
              </span>
              <span className="text-gray-300 font-medium">
                {achievement.currentPoints} / {achievement.nextLevelPoints} points
              </span>
            </div>
            
            <Progress 
              value={progress} 
              className={cn(
                "h-2 bg-gray-700",
                achievement.currentLevel === 0 && "[&>div]:bg-gray-500",
                achievement.currentLevel === 1 && "[&>div]:bg-orange-500",
                achievement.currentLevel === 2 && "[&>div]:bg-gray-400",
                achievement.currentLevel === 3 && "[&>div]:bg-yellow-500",
                achievement.currentLevel === 4 && "[&>div]:bg-purple-500"
              )}
            />
            
            {achievement.currentLevel < achievement.maxLevel && (
              <p className="text-xs text-gray-500">
                {achievement.nextLevelPoints - achievement.currentPoints} points to{' '}
                {achievement.levelNames[achievement.currentLevel] || 'next level'}
              </p>
            )}
          </div>

          {achievement.earnedAt && achievement.earnedAt.length > 0 && size === 'large' && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Earned:</p>
              <div className="flex flex-wrap gap-2">
                {achievement.earnedAt.map((date, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    {new Date(date).toLocaleDateString()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )

  return (
    <AnimatePresence>
      {showAnimation ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: 1
          }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {cardContent}
        </motion.div>
      ) : (
        cardContent
      )}
    </AnimatePresence>
  )
}

// Achievement Grid Component for displaying multiple achievements
export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const categorizedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div className="space-y-6">
      {Object.entries(categorizedAchievements).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-white mb-3 capitalize">
            {category} Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                size="medium"
                showProgress
                animate
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}