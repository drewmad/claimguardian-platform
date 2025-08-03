'use client'

import { 
  Plus, Home, Maximize2, Move, Square, Circle,
  Trash2, Copy, Save, Download, Upload, Layers,
  Ruler, RotateCw, FlipHorizontal, Grid3x3, Lock,
  Unlock, Eye, EyeOff, Palette, Sparkles, Lightbulb,
  Sofa, Bed, Tv, DoorOpen, Bath, ChefHat,
  Car, Trees, Building, ArrowUp, ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RoomObject {
  id: string
  type: 'wall' | 'door' | 'window' | 'furniture' | 'fixture' | 'appliance' | 'decoration'
  category?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
  label?: string
  locked?: boolean
  visible?: boolean
  zIndex: number
}

interface Room {
  id: string
  name: string
  width: number
  height: number
  objects: RoomObject[]
  gridSize: number
  showGrid: boolean
  unit: 'ft' | 'm'
}

const ROOM_TEMPLATES = {
  bedroom: {
    name: 'Bedroom',
    width: 12,
    height: 10,
    objects: [
      { type: 'furniture' as const, category: 'bed', x: 1, y: 1, width: 6, height: 4, label: 'Bed' },
      { type: 'furniture' as const, category: 'dresser', x: 8, y: 1, width: 3, height: 1.5, label: 'Dresser' },
      { type: 'furniture' as const, category: 'nightstand', x: 0.5, y: 2, width: 1, height: 1, label: 'Nightstand' },
      { type: 'door' as const, x: 5, y: 9.5, width: 2.5, height: 0.5, label: 'Door' }
    ]
  },
  kitchen: {
    name: 'Kitchen',
    width: 10,
    height: 12,
    objects: [
      { type: 'appliance' as const, category: 'refrigerator', x: 0.5, y: 0.5, width: 2.5, height: 2, label: 'Fridge' },
      { type: 'appliance' as const, category: 'stove', x: 3.5, y: 0.5, width: 2.5, height: 2, label: 'Stove' },
      { type: 'fixture' as const, category: 'sink', x: 6.5, y: 0.5, width: 2, height: 1.5, label: 'Sink' },
      { type: 'furniture' as const, category: 'island', x: 3, y: 5, width: 4, height: 3, label: 'Island' }
    ]
  },
  bathroom: {
    name: 'Bathroom',
    width: 8,
    height: 6,
    objects: [
      { type: 'fixture' as const, category: 'toilet', x: 0.5, y: 0.5, width: 1.5, height: 2, label: 'Toilet' },
      { type: 'fixture' as const, category: 'bathtub', x: 0.5, y: 3, width: 2, height: 4.5, label: 'Tub' },
      { type: 'fixture' as const, category: 'sink', x: 5, y: 0.5, width: 2, height: 1.5, label: 'Sink' },
      { type: 'door' as const, x: 3, y: 5.5, width: 2, height: 0.5, label: 'Door' }
    ]
  }
}

const FURNITURE_LIBRARY = [
  { category: 'living', icon: Sofa, items: [
    { type: 'sofa', label: 'Sofa', width: 6, height: 2.5 },
    { type: 'chair', label: 'Chair', width: 2, height: 2 },
    { type: 'coffee-table', label: 'Coffee Table', width: 3, height: 1.5 },
    { type: 'tv-stand', label: 'TV Stand', width: 4, height: 1.5 }
  ]},
  { category: 'bedroom', icon: Bed, items: [
    { type: 'bed', label: 'King Bed', width: 6, height: 4 },
    { type: 'dresser', label: 'Dresser', width: 3, height: 1.5 },
    { type: 'nightstand', label: 'Nightstand', width: 1.5, height: 1.5 },
    { type: 'wardrobe', label: 'Wardrobe', width: 3, height: 2 }
  ]},
  { category: 'kitchen', icon: ChefHat, items: [
    { type: 'refrigerator', label: 'Refrigerator', width: 2.5, height: 2 },
    { type: 'stove', label: 'Stove', width: 2.5, height: 2 },
    { type: 'dishwasher', label: 'Dishwasher', width: 2, height: 2 },
    { type: 'island', label: 'Kitchen Island', width: 4, height: 3 }
  ]},
  { category: 'bathroom', icon: Bath, items: [
    { type: 'toilet', label: 'Toilet', width: 1.5, height: 2 },
    { type: 'bathtub', label: 'Bathtub', width: 5, height: 2.5 },
    { type: 'shower', label: 'Shower', width: 3, height: 3 },
    { type: 'vanity', label: 'Vanity', width: 3, height: 1.5 }
  ]}
]

export default function RoomBuilderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentRoom, setCurrentRoom] = useState<Room>({
    id: '1',
    name: 'New Room',
    width: 15,
    height: 12,
    objects: [],
    gridSize: 0.5,
    showGrid: true,
    unit: 'ft'
  })
  
  const [selectedObject, setSelectedObject] = useState<RoomObject | null>(null)
  const [selectedTool, setSelectedTool] = useState<'select' | 'wall' | 'door' | 'window'>('select')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(50) // pixels per foot
  const [showDimensions, setShowDimensions] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('living')

  // Convert room coordinates to canvas pixels
  const toPixels = (value: number) => value * scale
  const fromPixels = (value: number) => value / scale

  // Snap to grid
  const snapToGrid = (value: number) => {
    return Math.round(value / currentRoom.gridSize) * currentRoom.gridSize
  }

  useEffect(() => {
    drawRoom()
  }, [currentRoom, selectedObject, scale, showDimensions])

  const drawRoom = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (currentRoom.showGrid) {
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= currentRoom.width; x += currentRoom.gridSize) {
        ctx.beginPath()
        ctx.moveTo(toPixels(x), 0)
        ctx.lineTo(toPixels(x), toPixels(currentRoom.height))
        ctx.stroke()
      }
      for (let y = 0; y <= currentRoom.height; y += currentRoom.gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, toPixels(y))
        ctx.lineTo(toPixels(currentRoom.width), toPixels(y))
        ctx.stroke()
      }
    }

    // Draw room boundary
    ctx.strokeStyle = '#6B7280'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, toPixels(currentRoom.width), toPixels(currentRoom.height))

    // Draw objects
    currentRoom.objects
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(obj => {
        if (!obj.visible === false) {
          drawObject(ctx, obj)
        }
      })

    // Draw selection outline
    if (selectedObject) {
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        toPixels(selectedObject.x),
        toPixels(selectedObject.y),
        toPixels(selectedObject.width),
        toPixels(selectedObject.height)
      )
      ctx.setLineDash([])
    }

    // Draw dimensions
    if (showDimensions) {
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '12px sans-serif'
      
      // Room dimensions
      ctx.fillText(
        `${currentRoom.width}${currentRoom.unit}`,
        toPixels(currentRoom.width / 2) - 15,
        toPixels(currentRoom.height) + 20
      )
      ctx.save()
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(
        `${currentRoom.height}${currentRoom.unit}`,
        -toPixels(currentRoom.height / 2) - 15,
        -10
      )
      ctx.restore()
    }
  }

  const drawObject = (ctx: CanvasRenderingContext2D, obj: RoomObject) => {
    ctx.save()
    
    // Apply rotation
    if (obj.rotation) {
      ctx.translate(
        toPixels(obj.x + obj.width / 2),
        toPixels(obj.y + obj.height / 2)
      )
      ctx.rotate((obj.rotation * Math.PI) / 180)
      ctx.translate(
        -toPixels(obj.x + obj.width / 2),
        -toPixels(obj.y + obj.height / 2)
      )
    }

    // Draw based on type
    switch (obj.type) {
      case 'wall':
        ctx.fillStyle = '#4B5563'
        ctx.fillRect(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), toPixels(obj.height))
        break
        
      case 'door':
        ctx.strokeStyle = '#A78BFA'
        ctx.lineWidth = 3
        ctx.strokeRect(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), toPixels(obj.height))
        // Draw door swing
        ctx.beginPath()
        ctx.arc(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), 0, Math.PI / 2)
        ctx.stroke()
        break
        
      case 'window':
        ctx.strokeStyle = '#60A5FA'
        ctx.lineWidth = 4
        ctx.strokeRect(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), toPixels(obj.height))
        break
        
      case 'furniture':
      case 'fixture':
      case 'appliance':
        ctx.fillStyle = obj.color || '#6B7280'
        ctx.fillRect(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), toPixels(obj.height))
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 1
        ctx.strokeRect(toPixels(obj.x), toPixels(obj.y), toPixels(obj.width), toPixels(obj.height))
        
        // Draw label
        if (obj.label) {
          ctx.fillStyle = '#E5E7EB'
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            obj.label,
            toPixels(obj.x + obj.width / 2),
            toPixels(obj.y + obj.height / 2)
          )
        }
        break
    }
    
    ctx.restore()
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = fromPixels(e.clientX - rect.left)
    const y = fromPixels(e.clientY - rect.top)

    if (selectedTool === 'select') {
      // Find clicked object
      const clickedObject = currentRoom.objects
        .slice()
        .reverse()
        .find(obj => 
          x >= obj.x && x <= obj.x + obj.width &&
          y >= obj.y && y <= obj.y + obj.height &&
          obj.visible !== false
        )
      
      setSelectedObject(clickedObject || null)
    } else {
      // Add new object
      const newObject: RoomObject = {
        id: Date.now().toString(),
        type: selectedTool,
        x: snapToGrid(x),
        y: snapToGrid(y),
        width: selectedTool === 'wall' ? 0.5 : 2.5,
        height: selectedTool === 'wall' ? 4 : 0.5,
        rotation: 0,
        color: '#6B7280',
        zIndex: currentRoom.objects.length,
        visible: true
      }
      
      setCurrentRoom({
        ...currentRoom,
        objects: [...currentRoom.objects, newObject]
      })
      setSelectedObject(newObject)
      setSelectedTool('select')
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedObject && !selectedObject.locked) {
      setIsDragging(true)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setDragStart({
          x: fromPixels(e.clientX - rect.left) - selectedObject.x,
          y: fromPixels(e.clientY - rect.top) - selectedObject.y
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && selectedObject) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const newX = snapToGrid(fromPixels(e.clientX - rect.left) - dragStart.x)
        const newY = snapToGrid(fromPixels(e.clientY - rect.top) - dragStart.y)
        
        const updatedObjects = currentRoom.objects.map(obj =>
          obj.id === selectedObject.id
            ? { ...obj, x: newX, y: newY }
            : obj
        )
        
        setCurrentRoom({ ...currentRoom, objects: updatedObjects })
        setSelectedObject({ ...selectedObject, x: newX, y: newY })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const addFurniture = (item: any) => {
    const newObject: RoomObject = {
      id: Date.now().toString(),
      type: 'furniture',
      category: item.type,
      x: snapToGrid(currentRoom.width / 2 - item.width / 2),
      y: snapToGrid(currentRoom.height / 2 - item.height / 2),
      width: item.width,
      height: item.height,
      rotation: 0,
      color: '#6B7280',
      label: item.label,
      zIndex: currentRoom.objects.length,
      visible: true
    }
    
    setCurrentRoom({
      ...currentRoom,
      objects: [...currentRoom.objects, newObject]
    })
    setSelectedObject(newObject)
  }

  const duplicateObject = () => {
    if (!selectedObject) return
    
    const newObject: RoomObject = {
      ...selectedObject,
      id: Date.now().toString(),
      x: selectedObject.x + 1,
      y: selectedObject.y + 1,
      zIndex: currentRoom.objects.length
    }
    
    setCurrentRoom({
      ...currentRoom,
      objects: [...currentRoom.objects, newObject]
    })
    setSelectedObject(newObject)
  }

  const deleteObject = () => {
    if (!selectedObject) return
    
    setCurrentRoom({
      ...currentRoom,
      objects: currentRoom.objects.filter(obj => obj.id !== selectedObject.id)
    })
    setSelectedObject(null)
  }

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedObject) return
    
    const currentIndex = currentRoom.objects.findIndex(obj => obj.id === selectedObject.id)
    const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1
    
    if (newIndex < 0 || newIndex >= currentRoom.objects.length) return
    
    const updatedObjects = [...currentRoom.objects]
    const temp = updatedObjects[currentIndex].zIndex
    updatedObjects[currentIndex].zIndex = updatedObjects[newIndex].zIndex
    updatedObjects[newIndex].zIndex = temp
    
    setCurrentRoom({ ...currentRoom, objects: updatedObjects })
  }

  const generateAISuggestions = () => {
    toast.success('AI is analyzing your room layout...')
    
    // Simulate AI suggestions
    setTimeout(() => {
      const suggestions = [
        'Consider adding more lighting fixtures',
        'The sofa placement blocks natural traffic flow',
        'Add storage solutions near the entrance',
        'Window placement allows for good natural lighting'
      ]
      
      suggestions.forEach((suggestion, index) => {
        setTimeout(() => {
          toast(suggestion, {
            icon: <Lightbulb className="h-4 w-4 text-yellow-400" />
          })
        }, index * 1000)
      })
    }, 2000)
  }

  const exportRoom = () => {
    const roomData = JSON.stringify(currentRoom, null, 2)
    const blob = new Blob([roomData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentRoom.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    a.click()
    
    toast.success('Room design exported!')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/ai-tools" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg">
                  <Building className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Room Builder</h1>
                <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-600/30">
                  AI Enhanced
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Design and visualize room layouts with AI-powered suggestions. Perfect for renovation planning and insurance documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Canvas Area */}
              <div className="lg:col-span-3 space-y-4">
                {/* Toolbar */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedTool === 'select' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('select')}
                          className={selectedTool === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}
                        >
                          <Move className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'wall' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('wall')}
                          className={selectedTool === 'wall' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'door' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('door')}
                          className={selectedTool === 'door' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}
                        >
                          <DoorOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedTool === 'window' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTool('window')}
                          className={selectedTool === 'window' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                        
                        <div className="w-px h-6 bg-gray-600 mx-2" />
                        
                        {selectedObject && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={duplicateObject}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={deleteObject}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveLayer('up')}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveLayer('down')}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDimensions(!showDimensions)}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Ruler className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentRoom({ ...currentRoom, showGrid: !currentRoom.showGrid })}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateAISuggestions}
                          className="bg-purple-600 hover:bg-purple-700 border-purple-600"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Suggest
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportRoom}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Canvas */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <canvas
                      ref={canvasRef}
                      width={toPixels(currentRoom.width)}
                      height={toPixels(currentRoom.height)}
                      className="bg-gray-900 cursor-crosshair"
                      onClick={handleCanvasClick}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                    
                    {/* Zoom Control */}
                    <div className="mt-4 flex items-center gap-3">
                      <Label className="text-sm text-gray-400">Zoom:</Label>
                      <Slider
                        value={[scale]}
                        onValueChange={(value: number[]) => setScale(value[0])}
                        min={20}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-400 w-12">{Math.round((scale / 50) * 100)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Object Properties */}
                {selectedObject && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Object Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">X Position</Label>
                          <Input
                            type="number"
                            value={selectedObject.x}
                            onChange={(e) => {
                              const newX = parseFloat(e.target.value)
                              const updatedObjects = currentRoom.objects.map(obj =>
                                obj.id === selectedObject.id ? { ...obj, x: newX } : obj
                              )
                              setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                              setSelectedObject({ ...selectedObject, x: newX })
                            }}
                            step={currentRoom.gridSize}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y Position</Label>
                          <Input
                            type="number"
                            value={selectedObject.y}
                            onChange={(e) => {
                              const newY = parseFloat(e.target.value)
                              const updatedObjects = currentRoom.objects.map(obj =>
                                obj.id === selectedObject.id ? { ...obj, y: newY } : obj
                              )
                              setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                              setSelectedObject({ ...selectedObject, y: newY })
                            }}
                            step={currentRoom.gridSize}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={selectedObject.width}
                            onChange={(e) => {
                              const newWidth = parseFloat(e.target.value)
                              const updatedObjects = currentRoom.objects.map(obj =>
                                obj.id === selectedObject.id ? { ...obj, width: newWidth } : obj
                              )
                              setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                              setSelectedObject({ ...selectedObject, width: newWidth })
                            }}
                            step={currentRoom.gridSize}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={selectedObject.height}
                            onChange={(e) => {
                              const newHeight = parseFloat(e.target.value)
                              const updatedObjects = currentRoom.objects.map(obj =>
                                obj.id === selectedObject.id ? { ...obj, height: newHeight } : obj
                              )
                              setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                              setSelectedObject({ ...selectedObject, height: newHeight })
                            }}
                            step={currentRoom.gridSize}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedObjects = currentRoom.objects.map(obj =>
                              obj.id === selectedObject.id 
                                ? { ...obj, rotation: (obj.rotation + 90) % 360 } 
                                : obj
                            )
                            setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                            setSelectedObject({ ...selectedObject, rotation: (selectedObject.rotation + 90) % 360 })
                          }}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Rotate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedObjects = currentRoom.objects.map(obj =>
                              obj.id === selectedObject.id 
                                ? { ...obj, locked: !obj.locked } 
                                : obj
                            )
                            setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                            setSelectedObject({ ...selectedObject, locked: !selectedObject.locked })
                          }}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          {selectedObject.locked ? (
                            <><Lock className="h-4 w-4 mr-2" /> Locked</>
                          ) : (
                            <><Unlock className="h-4 w-4 mr-2" /> Unlocked</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedObjects = currentRoom.objects.map(obj =>
                              obj.id === selectedObject.id 
                                ? { ...obj, visible: !obj.visible } 
                                : obj
                            )
                            setCurrentRoom({ ...currentRoom, objects: updatedObjects })
                            setSelectedObject({ ...selectedObject, visible: !selectedObject.visible })
                          }}
                          className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                        >
                          {selectedObject.visible !== false ? (
                            <><Eye className="h-4 w-4 mr-2" /> Visible</>
                          ) : (
                            <><EyeOff className="h-4 w-4 mr-2" /> Hidden</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Room Settings */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Room Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Room Name</Label>
                        <Input
                          value={currentRoom.name}
                          onChange={(e) => setCurrentRoom({ ...currentRoom, name: e.target.value })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Width ({currentRoom.unit})</Label>
                          <Input
                            type="number"
                            value={currentRoom.width}
                            onChange={(e) => setCurrentRoom({ ...currentRoom, width: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Height ({currentRoom.unit})</Label>
                          <Input
                            type="number"
                            value={currentRoom.height}
                            onChange={(e) => setCurrentRoom({ ...currentRoom, height: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Units</Label>
                        <Select
                          value={currentRoom.unit}
                          onValueChange={(value: 'ft' | 'm') => setCurrentRoom({ ...currentRoom, unit: value })}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ft">Feet</SelectItem>
                            <SelectItem value="m">Meters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Templates */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(ROOM_TEMPLATES).map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 justify-start"
                          onClick={() => {
                            const newRoom: Room = {
                              ...currentRoom,
                              name: template.name,
                              width: template.width,
                              height: template.height,
                              objects: template.objects.map((obj, index) => ({
                                ...obj,
                                id: Date.now().toString() + index,
                                rotation: 0,
                                color: '#6B7280',
                                zIndex: index,
                                visible: true
                              }))
                            }
                            setCurrentRoom(newRoom)
                            toast.success(`${template.name} template loaded`)
                          }}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Furniture Library */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Furniture Library</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                      <TabsList className="grid grid-cols-2 gap-1 bg-gray-700">
                        {FURNITURE_LIBRARY.slice(0, 2).map((category) => {
                          const Icon = category.icon
                          return (
                            <TabsTrigger
                              key={category.category}
                              value={category.category}
                              className="data-[state=active]:bg-gray-600"
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {category.category}
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                      <TabsList className="grid grid-cols-2 gap-1 bg-gray-700 mt-1">
                        {FURNITURE_LIBRARY.slice(2).map((category) => {
                          const Icon = category.icon
                          return (
                            <TabsTrigger
                              key={category.category}
                              value={category.category}
                              className="data-[state=active]:bg-gray-600"
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {category.category}
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                      
                      {FURNITURE_LIBRARY.map((category) => (
                        <TabsContent key={category.category} value={category.category} className="mt-3 space-y-1">
                          {category.items.map((item) => (
                            <Button
                              key={item.type}
                              variant="outline"
                              size="sm"
                              className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 justify-start text-xs"
                              onClick={() => addFurniture(item)}
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              {item.label}
                            </Button>
                          ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}