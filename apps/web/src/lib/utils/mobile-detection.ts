/**
 * @fileMetadata
 * @purpose "Mobile device detection and PWA utilities"
 * @dependencies []
 * @owner mobile-team
 * @status stable
 */

export interface MobileDeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isPWA: boolean
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  hasCamera: boolean
  hasGPS: boolean
  hasMicrophone: boolean
  hasAccelerometer: boolean
  hasGyroscope: boolean
  supportsServiceWorker: boolean
  supportsNotifications: boolean
  screenSize: {
    width: number
    height: number
    orientation: 'portrait' | 'landscape'
  }
}

export class MobileDetectionService {
  private static deviceInfo: MobileDeviceInfo | null = null

  /**
   * Detect device capabilities and type
   */
  static async detectDevice(): Promise<MobileDeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    // Basic device type detection
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || screenWidth <= 768
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent) || (screenWidth > 768 && screenWidth <= 1024)
    const isDesktop = !isMobile && !isTablet

    // Platform detection
    let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown'
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios'
    } else if (/android/.test(userAgent)) {
      platform = 'android'
    } else if (isDesktop) {
      platform = 'desktop'
    }

    // PWA detection
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as unknown).standalone === true

    // Capability detection
    const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    const hasGPS = 'geolocation' in navigator
    const hasMicrophone = hasCamera // Usually same permission
    const hasAccelerometer = 'DeviceMotionEvent' in window
    const hasGyroscope = 'DeviceOrientationEvent' in window
    const supportsServiceWorker = 'serviceWorker' in navigator
    const supportsNotifications = 'Notification' in window

    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait'

    this.deviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      isPWA,
      platform,
      hasCamera,
      hasGPS,
      hasMicrophone,
      hasAccelerometer,
      hasGyroscope,
      supportsServiceWorker,
      supportsNotifications,
      screenSize: {
        width: screenWidth,
        height: screenHeight,
        orientation
      }
    }

    return this.deviceInfo
  }

  /**
   * Check if device is suitable for field documentation
   */
  static async canDoFieldWork(): Promise<{ suitable: boolean; issues: string[] }> {
    const device = await this.detectDevice()
    const issues: string[] = []

    if (!device.hasCamera) {
      issues.push('Camera not available for photo documentation')
    }

    if (!device.hasGPS) {
      issues.push('GPS not available for location tracking')
    }

    if (!device.isMobile && !device.isTablet) {
      issues.push('Desktop device - mobile device recommended for field work')
    }

    if (device.screenSize.width < 360) {
      issues.push('Screen too small for optimal field documentation')
    }

    return {
      suitable: issues.length === 0,
      issues
    }
  }

  /**
   * Redirect to mobile app if on mobile device
   */
  static async redirectToMobileApp(currentPath: string) {
    const device = await this.detectDevice()
    
    if (device.isMobile && !currentPath.startsWith('/mobile/')) {
      // Only redirect certain paths to mobile versions
      const mobileCompatiblePaths = [
        '/dashboard/property',
        '/dashboard/claims',
        '/ai-tools/damage-analyzer',
        '/ai-tools/inventory-scanner'
      ]

      if (mobileCompatiblePaths.some(path => currentPath.startsWith(path))) {
        const mobileUrl = `/mobile/field?redirect=${encodeURIComponent(currentPath)}`
        window.location.href = mobileUrl
        return true
      }
    }

    return false
  }

  /**
   * Request necessary permissions for field work
   */
  static async requestFieldPermissions(): Promise<{
    camera: boolean
    microphone: boolean
    location: boolean
    notifications: boolean
  }> {
    const permissions = {
      camera: false,
      microphone: false,
      location: false,
      notifications: false
    }

    try {
      // Request camera and microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      permissions.camera = true
      permissions.microphone = true
      
      // Stop the stream immediately
      mediaStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.warn('Camera/microphone permission denied:', error)
    }

    try {
      // Request location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000
        })
      })
      permissions.location = true
    } catch (error) {
      console.warn('Location permission denied:', error)
    }

    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        permissions.notifications = permission === 'granted'
      }
    } catch (error) {
      console.warn('Notification permission denied:', error)
    }

    return permissions
  }

  /**
   * Install PWA prompt
   */
  static setupPWAInstall() {
    let deferredPrompt: unknown = null

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      
      // Show custom install button
      this.showPWAInstallBanner(deferredPrompt)
    })

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully')
      deferredPrompt = null
      this.hidePWAInstallBanner()
    })
  }

  private static showPWAInstallBanner(deferredPrompt: unknown) {
    const banner = document.createElement('div')
    banner.id = 'pwa-install-banner'
    banner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between'
    banner.innerHTML = `
      <div>
        <h4 class="font-semibold">Install ClaimGuardian</h4>
        <p class="text-sm opacity-90">Get the app for better field documentation</p>
      </div>
      <div class="flex gap-2">
        <button id="pwa-install-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
          Install
        </button>
        <button id="pwa-dismiss-btn" class="text-white opacity-75 hover:opacity-100">
          ×
        </button>
      </div>
    `

    document.body.appendChild(banner)

    // Handle install button click
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log('PWA install outcome:', outcome)
        deferredPrompt = null
      }
      this.hidePWAInstallBanner()
    })

    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hidePWAInstallBanner()
    })
  }

  private static hidePWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner')
    if (banner) {
      banner.remove()
    }
  }

  /**
   * Get device-specific recommendations
   */
  static async getDeviceRecommendations(): Promise<string[]> {
    const device = await this.detectDevice()
    const recommendations: string[] = []

    if (device.isMobile) {
      recommendations.push('Use landscape mode for better photo composition')
      
      if (device.platform === 'ios') {
        recommendations.push('Add to Home Screen for app-like experience')
      }
      
      if (device.platform === 'android') {
        recommendations.push('Install the web app for offline functionality')
      }
    }

    if (!device.hasGPS) {
      recommendations.push('Enable location services for automatic property location')
    }

    if (!device.hasCamera) {
      recommendations.push('Connect external camera for documentation')
    }

    if (device.screenSize.width < 400) {
      recommendations.push('Consider using a tablet for easier data entry')
    }

    if (!device.supportsServiceWorker) {
      recommendations.push('Update your browser for offline functionality')
    }

    return recommendations
  }

  /**
   * Check network status and quality
   */
  static getNetworkInfo(): {
    online: boolean
    type: string
    effectiveType: string
    downlink: number
    rtt: number
  } {
    const connection = (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection

    return {
      online: navigator.onLine,
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    }
  }

  /**
   * Monitor device orientation changes
   */
  static setupOrientationListener(callback: (orientation: 'portrait' | 'landscape') => void) {
    const handleOrientationChange = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      callback(orientation)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }

  /**
   * Clear cached device info (for testing)
   */
  static clearCache() {
    this.deviceInfo = null
  }
}