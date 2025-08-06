/**
 * @fileMetadata
 * @purpose "Demo page showcasing touch interactions and mobile gestures"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "lucide-react"]
 * @exports ["TouchDemoPage"]
 * @complexity high
 * @tags ["demo", "touch", "gestures", "mobile", "ui"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, Hand, Zap, Heart, Share, Bookmark, 
  Trash2, Edit, Archive, Star, MessageCircle, 
  ArrowLeft, CheckCircle, AlertCircle, Info
} from 'lucide-react'
import { toast } from 'sonner'

import { TouchButton } from '@/components/ui/touch-button'
import { TouchCard, TouchCardHeader, TouchCardContent, TouchCardFooter } from '@/components/ui/touch-card'
import { SwipeAction, SwipeActionPresets, SwipeActionItem } from '@/components/ui/swipe-action'
import { useTouchGestures, usePinchGesture } from '@/hooks/use-touch-gestures'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const demoItems = [
  { id: '1', title: 'Property Insurance Policy', subtitle: 'Swipe left to edit, right to delete' },
  { id: '2', title: 'Home Inventory Report', subtitle: 'Long press for menu, double tap to favorite' },
  { id: '3', title: 'Damage Assessment', subtitle: 'Try different touch gestures' },
  { id: '4', title: 'Claim Documentation', subtitle: 'Pinch to zoom, swipe to navigate' }
]

const touchFeatures = [
  {
    icon: Hand,
    title: 'Touch Gestures',
    description: 'Tap, double-tap, long press, swipe, and pinch gestures',
    examples: ['Single tap to select', 'Double tap to favorite', 'Long press for menu', 'Swipe to navigate']
  },
  {
    icon: Zap,
    title: 'Haptic Feedback',
    description: 'Tactile response for user actions (iOS and Android)',
    examples: ['Light tap feedback', 'Medium press response', 'Heavy action confirmation']
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Touch targets sized for mobile usability',
    examples: ['44px minimum touch targets', 'Gesture-friendly spacing', 'Thumb-friendly layouts']
  }
]

export default function TouchDemoPage() {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [gestureLog, setGestureLog] = useState<string[]>([])
  const [buttonPresses, setButtonPresses] = useState(0)
  const [swipeCount, setSwipeCount] = useState({ left: 0, right: 0 })

  const addToLog = (message: string) => {
    setGestureLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 4)])
  }

  const { elementRef: gestureTestRef } = useTouchGestures({
    onTap: () => addToLog('Tap detected'),
    onDoubleTap: () => addToLog('Double tap detected'),
    onLongPress: () => addToLog('Long press detected'),
    onSwipeLeft: () => {
      addToLog('Swipe left detected')
      setSwipeCount(prev => ({ ...prev, left: prev.left + 1 }))
    },
    onSwipeRight: () => {
      addToLog('Swipe right detected')
      setSwipeCount(prev => ({ ...prev, right: prev.right + 1 }))
    },
    onSwipeUp: () => addToLog('Swipe up detected'),
    onSwipeDown: () => addToLog('Swipe down detected'),
    enableHapticFeedback: true
  })

  const { gestureRef: pinchRef, scale, resetScale } = usePinchGesture(
    (newScale, isZooming) => {
      addToLog(`Pinch ${isZooming ? 'zoom in' : 'zoom out'} - Scale: ${newScale.toFixed(2)}`)
    }
  )

  const handleCardSelection = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedCards)
    if (selected) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    setSelectedCards(newSelection)
    addToLog(`Card ${id} ${selected ? 'selected' : 'deselected'}`)
  }

  const handleSwipeAction = (direction: 'left' | 'right', actionId: string, itemTitle: string) => {
    addToLog(`Swiped ${direction} on "${itemTitle}" - Action: ${actionId}`)
    toast.success(`${actionId} action triggered on ${itemTitle}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Touch Interactions Demo
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Experience enhanced touch interactions with haptic feedback, 
            gesture recognition, and mobile-optimized components.
          </p>
        </motion.div>

        {/* Touch Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {touchFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg w-fit">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.examples.map((example, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {/* Interactive Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Touch Buttons Demo */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Touch Buttons
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Try different button variants with haptic feedback
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <TouchButton 
                  variant="default" 
                  size="touch"
                  onClick={() => {
                    setButtonPresses(prev => prev + 1)
                    addToLog('Default button pressed')
                  }}
                >
                  Default
                </TouchButton>
                <TouchButton 
                  variant="gradient" 
                  size="touch"
                  onLongPress={() => addToLog('Gradient button long pressed')}
                  longPressDelay={500}
                >
                  Gradient
                </TouchButton>
                <TouchButton 
                  variant="success" 
                  size="touch"
                  onDoubleClick={() => addToLog('Success button double clicked')}
                  hapticFeedback="medium"
                >
                  Success
                </TouchButton>
                <TouchButton 
                  variant="danger" 
                  size="touch"
                  preventDoubleClick
                  hapticFeedback="heavy"
                  onClick={() => addToLog('Danger button (double-click protected)')}
                >
                  Danger
                </TouchButton>
              </div>
              
              <div className="text-center">
                <TouchButton 
                  variant="outline" 
                  size="fab"
                  className="text-white border-white/30"
                  onClick={() => addToLog('FAB clicked')}
                >
                  <Heart className="w-6 h-6" />
                </TouchButton>
              </div>

              <div className="text-center text-gray-300 text-sm">
                Button presses: {buttonPresses}
              </div>
            </CardContent>
          </Card>

          {/* Gesture Testing Area */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Hand className="w-5 h-5" />
                Gesture Testing
              </CardTitle>
              <p className="text-gray-300 text-sm">
                Try tapping, swiping, and long pressing in the area below
              </p>
            </CardHeader>
            <CardContent>
              <div
                ref={gestureTestRef as React.RefObject<HTMLDivElement>}
                className="bg-white/5 border border-white/20 rounded-lg p-8 mb-4 min-h-[200px] flex flex-col items-center justify-center cursor-pointer"
              >
                <Hand className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-white font-medium">Touch Test Area</p>
                <p className="text-gray-400 text-sm text-center">
                  Tap, double-tap, long press, or swipe here
                </p>
                
                <div className="mt-4 flex gap-4 text-sm">
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                    ← {swipeCount.left}
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    {swipeCount.right} →
                  </Badge>
                </div>
              </div>

              {/* Gesture Log */}
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {gestureLog.map((log, index) => (
                  <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Touch Cards Demo */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5" />
              Interactive Cards
            </CardTitle>
            <p className="text-gray-300 text-sm">
              Cards with selection, favoriting, and sharing capabilities
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoItems.slice(0, 4).map((item, index) => (
                <TouchCard
                  key={item.id}
                  variant="elevated"
                  interactive="both"
                  selectable="multiple"
                  selected={selectedCards.has(item.id)}
                  onSelectionChange={(selected) => handleCardSelection(item.id, selected)}
                  favoritable
                  onFavorite={(favorited) => addToLog(`${item.title} ${favorited ? 'favorited' : 'unfavorited'}`)}
                  shareable
                  onShare={() => addToLog(`Shared ${item.title}`)}
                  bookmarkable
                  onBookmark={(bookmarked) => addToLog(`${item.title} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`)}
                  showMenu
                  onMenuClick={() => addToLog(`Menu opened for ${item.title}`)}
                  className="min-h-[120px]"
                >
                  <TouchCardContent>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.subtitle}
                    </p>
                  </TouchCardContent>
                </TouchCard>
              ))}
            </div>
            
            <div className="mt-4 text-center text-gray-300 text-sm">
              Selected cards: {selectedCards.size}
            </div>
          </CardContent>
        </Card>

        {/* Swipe Actions Demo */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Swipe Actions
            </CardTitle>
            <p className="text-gray-300 text-sm">
              Swipe left to reveal edit/share actions, right to delete
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {demoItems.map((item) => (
              <SwipeActionItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                onDelete={() => {
                  addToLog(`Deleted ${item.title}`)
                  toast.error(`${item.title} deleted`)
                }}
                onEdit={() => {
                  addToLog(`Editing ${item.title}`)
                  toast.info(`Editing ${item.title}`)
                }}
                onShare={() => {
                  addToLog(`Shared ${item.title}`)
                  toast.success(`${item.title} shared`)
                }}
                className="bg-white/5"
              />
            ))}
          </CardContent>
        </Card>

        {/* Pinch to Zoom Demo */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pinch to Zoom
            </CardTitle>
            <p className="text-gray-300 text-sm">
              Use two fingers to pinch and zoom the area below (mobile only)
            </p>
          </CardHeader>
          <CardContent>
            <div
              ref={pinchRef as React.RefObject<HTMLDivElement>}
              className="bg-white/5 border border-white/20 rounded-lg p-8 min-h-[200px] flex items-center justify-center overflow-hidden"
            >
              <motion.div
                style={{ scale }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-medium">Pinch to Zoom</p>
                <p className="text-gray-400 text-sm">Scale: {scale.toFixed(2)}x</p>
              </motion.div>
            </div>
            
            <div className="text-center mt-4">
              <TouchButton 
                variant="outline" 
                size="sm"
                onClick={resetScale}
                className="text-white border-white/30"
              >
                Reset Zoom
              </TouchButton>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5" />
              Touch Interaction Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="text-white font-medium mb-2">Basic Gestures:</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Single tap - Select/activate</li>
                  <li>• Double tap - Favorite/special action</li>
                  <li>• Long press - Context menu</li>
                  <li>• Swipe left/right - Navigation/actions</li>
                  <li>• Pinch - Zoom in/out</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">Haptic Feedback:</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Light - Tap confirmation</li>
                  <li>• Medium - Important actions</li>
                  <li>• Heavy - Destructive actions</li>
                  <li>• Works on iOS Safari & Android Chrome</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <TouchButton
            onClick={() => window.history.back()}
            variant="outline"
            className="text-white border-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </TouchButton>
        </motion.div>
      </div>
    </div>
  )
}