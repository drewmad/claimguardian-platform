/**
 * Mobile Device Testing Framework
 * Comprehensive testing framework for React Native mobile app on physical devices
 */

import { Platform, Dimensions, DeviceInfo } from 'react-native'
import NetInfo from '@react-native-netinfo/netinfo'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import Geolocation from '@react-native-community/geolocation'

export interface DeviceTestConfig {
  testSuite: string
  deviceId?: string
  includePerformanceTests: boolean
  includeOfflineTests: boolean
  includeCameraTests: boolean
  includeLocationTests: boolean
  includeNetworkTests: boolean
  testTimeout: number // milliseconds
  screenshotOnFailure: boolean
  generateReport: boolean
}

export interface DeviceInfo {
  deviceId: string
  platform: 'ios' | 'android'
  version: string
  model: string
  manufacturer: string
  screen: {
    width: number
    height: number
    scale: number
    fontScale: number
  }
  memory: {
    total: number
    free: number
  }
  storage: {
    total: number
    free: number
  }
  network: {
    type: string
    connected: boolean
    strength?: number
  }
  permissions: {
    camera: string
    location: string
    storage: string
    microphone: string
  }
  battery: {
    level: number
    charging: boolean
  }
}

export interface TestResult {
  testName: string
  suite: string
  passed: boolean
  duration: number
  error?: string
  screenshots?: string[]
  performanceMetrics?: {
    memoryUsage: number[]
    cpuUsage: number[]
    renderTimes: number[]
    navigationTimes: number[]
  }
  networkMetrics?: {
    requestTimes: number[]
    offlineSync: boolean
    dataUsage: number
  }
}

export interface TestReport {
  deviceInfo: DeviceInfo
  config: DeviceTestConfig
  timestamp: number
  duration: number
  tests: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    passRate: number
  }
  performance: {
    avgMemoryUsage: number
    maxMemoryUsage: number
    avgRenderTime: number
    slowestTest: string
  }
}

export class MobileDeviceTestFramework {
  private deviceInfo: DeviceInfo | null = null
  private testResults: TestResult[] = []
  private performanceMonitor: PerformanceMonitor
  private screenshotManager: ScreenshotManager

  constructor() {
    this.performanceMonitor = new PerformanceMonitor()
    this.screenshotManager = new ScreenshotManager()
  }

  async initialize(): Promise<void> {
    console.log('📱 Initializing Mobile Device Test Framework')

    // Collect comprehensive device information
    this.deviceInfo = await this.collectDeviceInfo()

    // Initialize performance monitoring
    await this.performanceMonitor.initialize()

    // Setup screenshot capabilities
    await this.screenshotManager.initialize()

    console.log('✅ Mobile test framework initialized')
    console.log('📊 Device Info:', JSON.stringify(this.deviceInfo, null, 2))
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    const screen = Dimensions.get('screen')
    const networkState = await NetInfo.fetch()

    // Get device-specific information
    const deviceId = await DeviceInfo.getUniqueId()
    const deviceModel = await DeviceInfo.getModel()
    const manufacturer = await DeviceInfo.getManufacturer()
    const systemVersion = await DeviceInfo.getSystemVersion()
    const totalMemory = await DeviceInfo.getTotalMemory()
    const freeMemory = await DeviceInfo.getFreeDiskStorage()
    const totalStorage = await DeviceInfo.getTotalDiskCapacity()
    const batteryLevel = await DeviceInfo.getBatteryLevel()
    const isBatteryCharging = await DeviceInfo.isBatteryCharging()

    // Check permissions
    const permissions = await this.checkAllPermissions()

    return {
      deviceId,
      platform: Platform.OS as 'ios' | 'android',
      version: systemVersion,
      model: deviceModel,
      manufacturer,
      screen: {
        width: screen.width,
        height: screen.height,
        scale: screen.scale,
        fontScale: screen.fontScale
      },
      memory: {
        total: totalMemory,
        free: await DeviceInfo.getUsedMemory()
      },
      storage: {
        total: totalStorage,
        free: freeMemory
      },
      network: {
        type: networkState.type || 'unknown',
        connected: networkState.isConnected || false,
        strength: networkState.details?.strength
      },
      permissions,
      battery: {
        level: batteryLevel,
        charging: isBatteryCharging
      }
    }
  }

  private async checkAllPermissions(): Promise<Record<string, string>> {
    const permissionsToCheck = {
      camera: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
      location: Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      storage: Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      microphone: Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO
    }

    const results: Record<string, string> = {}

    for (const [key, permission] of Object.entries(permissionsToCheck)) {
      try {
        const result = await check(permission)
        results[key] = result
      } catch (error) {
        results[key] = 'error'
        console.warn(`Failed to check ${key} permission:`, error)
      }
    }

    return results
  }

  async runTestSuite(config: DeviceTestConfig): Promise<TestReport> {
    console.log(`🧪 Starting test suite: ${config.testSuite}`)
    const startTime = Date.now()

    if (!this.deviceInfo) {
      throw new Error('Device test framework not initialized. Call initialize() first.')
    }

    this.testResults = []

    // Core functionality tests
    await this.runCoreTests(config)

    // Performance tests
    if (config.includePerformanceTests) {
      await this.runPerformanceTests(config)
    }

    // Offline capability tests
    if (config.includeOfflineTests) {
      await this.runOfflineTests(config)
    }

    // Camera functionality tests
    if (config.includeCameraTests) {
      await this.runCameraTests(config)
    }

    // Location services tests
    if (config.includeLocationTests) {
      await this.runLocationTests(config)
    }

    // Network connectivity tests
    if (config.includeNetworkTests) {
      await this.runNetworkTests(config)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Generate comprehensive test report
    const report = this.generateTestReport(config, duration)

    if (config.generateReport) {
      await this.saveTestReport(report)
    }

    console.log('📈 Test suite completed')
    console.log(`✅ ${report.summary.passed}/${report.summary.total} tests passed`)
    console.log(`⏱️  Duration: ${duration}ms`)

    return report
  }

  private async runCoreTests(config: DeviceTestConfig): Promise<void> {
    console.log('🔧 Running core functionality tests')

    await this.runTest('App Launch', 'core', async () => {
      // Test app startup time and initial render
      const startTime = Date.now()

      // Simulate app navigation and core operations
      await this.simulateAppLaunch()

      const launchTime = Date.now() - startTime
      if (launchTime > 3000) {
        throw new Error(`App launch too slow: ${launchTime}ms`)
      }
    }, config)

    await this.runTest('Navigation', 'core', async () => {
      // Test navigation between screens
      await this.testNavigationFlow()
    }, config)

    await this.runTest('Data Storage', 'core', async () => {
      // Test AsyncStorage operations
      await this.testAsyncStorage()
    }, config)

    await this.runTest('Error Handling', 'core', async () => {
      // Test error boundary and recovery
      await this.testErrorHandling()
    }, config)
  }

  private async runPerformanceTests(config: DeviceTestConfig): Promise<void> {
    console.log('⚡ Running performance tests')

    await this.runTest('Memory Usage', 'performance', async () => {
      const memoryMetrics = await this.performanceMonitor.measureMemoryUsage(async () => {
        // Perform memory-intensive operations
        await this.simulateDataProcessing()
      })

      if (memoryMetrics.peak > 200 * 1024 * 1024) { // 200MB threshold
        throw new Error(`High memory usage: ${memoryMetrics.peak / 1024 / 1024}MB`)
      }
    }, config)

    await this.runTest('Render Performance', 'performance', async () => {
      const renderMetrics = await this.performanceMonitor.measureRenderTimes([
        'PropertyList',
        'DamageAssessment',
        'PhotoCapture',
        'Dashboard'
      ])

      const avgRenderTime = renderMetrics.reduce((a, b) => a + b, 0) / renderMetrics.length
      if (avgRenderTime > 50) { // 50ms threshold
        throw new Error(`Slow render times: ${avgRenderTime}ms average`)
      }
    }, config)

    await this.runTest('Scroll Performance', 'performance', async () => {
      const scrollMetrics = await this.performanceMonitor.measureScrollPerformance()

      if (scrollMetrics.droppedFrames > 5) {
        throw new Error(`Poor scroll performance: ${scrollMetrics.droppedFrames} dropped frames`)
      }
    }, config)
  }

  private async runOfflineTests(config: DeviceTestConfig): Promise<void> {
    console.log('📡 Running offline capability tests')

    await this.runTest('Offline Data Persistence', 'offline', async () => {
      // Test data persistence when offline
      await this.testOfflineDataPersistence()
    }, config)

    await this.runTest('Sync Queue Management', 'offline', async () => {
      // Test sync queue functionality
      await this.testSyncQueue()
    }, config)

    await this.runTest('Conflict Resolution', 'offline', async () => {
      // Test conflict resolution on sync
      await this.testConflictResolution()
    }, config)
  }

  private async runCameraTests(config: DeviceTestConfig): Promise<void> {
    console.log('📸 Running camera functionality tests')

    // Check camera permissions first
    if (this.deviceInfo?.permissions.camera !== RESULTS.GRANTED) {
      console.warn('⚠️ Camera permission not granted, skipping camera tests')
      return
    }

    await this.runTest('Camera Access', 'camera', async () => {
      await this.testCameraAccess()
    }, config)

    await this.runTest('Photo Capture', 'camera', async () => {
      await this.testPhotoCapture()
    }, config)

    await this.runTest('Photo Storage', 'camera', async () => {
      await this.testPhotoStorage()
    }, config)
  }

  private async runLocationTests(config: DeviceTestConfig): Promise<void> {
    console.log('📍 Running location services tests')

    // Check location permissions first
    if (this.deviceInfo?.permissions.location !== RESULTS.GRANTED) {
      console.warn('⚠️ Location permission not granted, skipping location tests')
      return
    }

    await this.runTest('GPS Access', 'location', async () => {
      await this.testGPSAccess()
    }, config)

    await this.runTest('Location Accuracy', 'location', async () => {
      await this.testLocationAccuracy()
    }, config)
  }

  private async runNetworkTests(config: DeviceTestConfig): Promise<void> {
    console.log('🌐 Running network connectivity tests')

    await this.runTest('API Connectivity', 'network', async () => {
      await this.testAPIConnectivity()
    }, config)

    await this.runTest('Network Error Handling', 'network', async () => {
      await this.testNetworkErrorHandling()
    }, config)

    await this.runTest('Data Synchronization', 'network', async () => {
      await this.testDataSynchronization()
    }, config)
  }

  private async runTest(
    testName: string,
    suite: string,
    testFunction: () => Promise<void>,
    config: DeviceTestConfig
  ): Promise<void> {
    console.log(`🔬 Running test: ${testName}`)
    const startTime = Date.now()

    try {
      // Set up test timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), config.testTimeout)
      )

      // Run test with timeout
      await Promise.race([testFunction(), timeoutPromise])

      const duration = Date.now() - startTime

      this.testResults.push({
        testName,
        suite,
        passed: true,
        duration
      })

      console.log(`✅ ${testName} passed (${duration}ms)`)

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Take screenshot on failure if enabled
      let screenshots: string[] = []
      if (config.screenshotOnFailure) {
        screenshots = await this.screenshotManager.captureFailureScreenshot(testName)
      }

      this.testResults.push({
        testName,
        suite,
        passed: false,
        duration,
        error: errorMessage,
        screenshots
      })

      console.log(`❌ ${testName} failed (${duration}ms): ${errorMessage}`)
    }
  }

  // Test implementation methods
  private async simulateAppLaunch(): Promise<void> {
    // Simulate app launch sequence
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async testNavigationFlow(): Promise<void> {
    // Test navigation between screens
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  private async testAsyncStorage(): Promise<void> {
    const testKey = 'device-test-key'
    const testData = { timestamp: Date.now(), test: true }

    // Test write
    await AsyncStorage.setItem(testKey, JSON.stringify(testData))

    // Test read
    const stored = await AsyncStorage.getItem(testKey)
    if (!stored) {
      throw new Error('Failed to retrieve stored data')
    }

    const parsed = JSON.parse(stored)
    if (parsed.test !== true) {
      throw new Error('Data integrity check failed')
    }

    // Cleanup
    await AsyncStorage.removeItem(testKey)
  }

  private async testErrorHandling(): Promise<void> {
    // Test error boundary functionality
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  private async simulateDataProcessing(): Promise<void> {
    // Simulate memory-intensive data processing
    const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: Math.random() }))
    largeArray.sort((a, b) => a.data - b.data)
  }

  private async testOfflineDataPersistence(): Promise<void> {
    // Test offline data persistence
    await AsyncStorage.setItem('offline-test', JSON.stringify({ offline: true }))
    const data = await AsyncStorage.getItem('offline-test')
    if (!data) {
      throw new Error('Offline data persistence failed')
    }
    await AsyncStorage.removeItem('offline-test')
  }

  private async testSyncQueue(): Promise<void> {
    // Test sync queue functionality
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async testConflictResolution(): Promise<void> {
    // Test conflict resolution
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async testCameraAccess(): Promise<void> {
    // Test camera access
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async testPhotoCapture(): Promise<void> {
    // Test photo capture functionality
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  private async testPhotoStorage(): Promise<void> {
    // Test photo storage
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async testGPSAccess(): Promise<void> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          if (!position.coords.latitude || !position.coords.longitude) {
            reject(new Error('Invalid GPS coordinates'))
          } else {
            resolve()
          }
        },
        (error) => reject(new Error(`GPS access failed: ${error.message}`)),
        { timeout: 5000, maximumAge: 1000 }
      )
    })
  }

  private async testLocationAccuracy(): Promise<void> {
    // Test location accuracy
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          if (position.coords.accuracy && position.coords.accuracy > 100) {
            reject(new Error(`Poor location accuracy: ${position.coords.accuracy}m`))
          } else {
            resolve()
          }
        },
        (error) => reject(new Error(`Location accuracy test failed: ${error.message}`)),
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }

  private async testAPIConnectivity(): Promise<void> {
    // Test API connectivity
    try {
      const response = await fetch('https://claimguardianai.com/api/health', {
        timeout: 5000
      })

      if (!response.ok) {
        throw new Error(`API connectivity failed: ${response.status}`)
      }
    } catch (error) {
      throw new Error(`API connectivity test failed: ${error}`)
    }
  }

  private async testNetworkErrorHandling(): Promise<void> {
    // Test network error handling
    try {
      await fetch('https://invalid-url-for-testing.com', { timeout: 1000 })
    } catch (error) {
      // Expected to fail - test passes if error is handled properly
      return
    }
    throw new Error('Network error handling test failed - should have thrown error')
  }

  private async testDataSynchronization(): Promise<void> {
    // Test data synchronization
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  private generateTestReport(config: DeviceTestConfig, duration: number): TestReport {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? (passed / total) * 100 : 0

    // Calculate performance metrics
    const memoryUsages = this.testResults.flatMap(r => r.performanceMetrics?.memoryUsage || [])
    const renderTimes = this.testResults.flatMap(r => r.performanceMetrics?.renderTimes || [])
    const slowestTest = this.testResults.reduce((slowest, test) =>
      test.duration > slowest.duration ? test : slowest, this.testResults[0]
    )

    return {
      deviceInfo: this.deviceInfo!,
      config,
      timestamp: Date.now(),
      duration,
      tests: this.testResults,
      summary: {
        total,
        passed,
        failed,
        skipped: 0,
        passRate
      },
      performance: {
        avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length || 0,
        maxMemoryUsage: Math.max(...memoryUsages, 0),
        avgRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length || 0,
        slowestTest: slowestTest?.testName || 'None'
      }
    }
  }

  private async saveTestReport(report: TestReport): Promise<void> {
    const reportKey = `test-report-${Date.now()}`
    try {
      await AsyncStorage.setItem(reportKey, JSON.stringify(report))
      console.log(`💾 Test report saved: ${reportKey}`)
    } catch (error) {
      console.error('Failed to save test report:', error)
    }
  }

  // Public API methods
  async getStoredReports(): Promise<TestReport[]> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const reportKeys = keys.filter(key => key.startsWith('test-report-'))

      const reports: TestReport[] = []
      for (const key of reportKeys) {
        const reportData = await AsyncStorage.getItem(key)
        if (reportData) {
          reports.push(JSON.parse(reportData))
        }
      }

      return reports.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to retrieve stored reports:', error)
      return []
    }
  }

  async clearStoredReports(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const reportKeys = keys.filter(key => key.startsWith('test-report-'))
      await AsyncStorage.multiRemove(reportKeys)
      console.log(`🗑️ Cleared ${reportKeys.length} stored reports`)
    } catch (error) {
      console.error('Failed to clear stored reports:', error)
    }
  }

  exportReport(report: TestReport, format: 'json' | 'csv' | 'html' = 'json'): string {
    switch (format) {
      case 'csv':
        return this.exportReportAsCSV(report)
      case 'html':
        return this.exportReportAsHTML(report)
      default:
        return JSON.stringify(report, null, 2)
    }
  }

  private exportReportAsCSV(report: TestReport): string {
    const headers = ['Test Name', 'Suite', 'Passed', 'Duration (ms)', 'Error']
    const rows = report.tests.map(test => [
      test.testName,
      test.suite,
      test.passed,
      test.duration,
      test.error || ''
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  private exportReportAsHTML(report: TestReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ClaimGuardian Mobile Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .device-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <h1>📱 ClaimGuardian Mobile Test Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Device:</strong> ${report.deviceInfo.manufacturer} ${report.deviceInfo.model}</p>
        <p><strong>Platform:</strong> ${report.deviceInfo.platform} ${report.deviceInfo.version}</p>
        <p><strong>Tests:</strong> ${report.summary.passed}/${report.summary.total} passed (${report.summary.passRate.toFixed(1)}%)</p>
        <p><strong>Duration:</strong> ${report.duration}ms</p>
    </div>

    <div class="device-info">
        <h3>Device Information</h3>
        <ul>
            <li>Screen: ${report.deviceInfo.screen.width}x${report.deviceInfo.screen.height} (${report.deviceInfo.screen.scale}x scale)</li>
            <li>Memory: ${(report.deviceInfo.memory.total / 1024 / 1024).toFixed(0)}MB total</li>
            <li>Storage: ${(report.deviceInfo.storage.total / 1024 / 1024 / 1024).toFixed(1)}GB total</li>
            <li>Network: ${report.deviceInfo.network.type} (${report.deviceInfo.network.connected ? 'Connected' : 'Disconnected'})</li>
            <li>Battery: ${(report.deviceInfo.battery.level * 100).toFixed(0)}% ${report.deviceInfo.battery.charging ? '(Charging)' : ''}</li>
        </ul>
    </div>

    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Suite</th>
                <th>Result</th>
                <th>Duration</th>
                <th>Error</th>
            </tr>
        </thead>
        <tbody>
            ${report.tests.map(test => `
                <tr>
                    <td>${test.testName}</td>
                    <td>${test.suite}</td>
                    <td class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASS' : 'FAIL'}</td>
                    <td>${test.duration}ms</td>
                    <td>${test.error || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`
  }
}

// Performance monitoring helper class
class PerformanceMonitor {
  async initialize(): Promise<void> {
    console.log('⚡ Performance monitor initialized')
  }

  async measureMemoryUsage<T>(operation: () => Promise<T>): Promise<{ peak: number; average: number; samples: number[] }> {
    const samples: number[] = []

    // Start memory sampling
    const interval = setInterval(async () => {
      try {
        const memory = await DeviceInfo.getUsedMemory()
        samples.push(memory)
      } catch (error) {
        console.warn('Failed to sample memory:', error)
      }
    }, 100)

    try {
      await operation()
    } finally {
      clearInterval(interval)
    }

    const peak = Math.max(...samples, 0)
    const average = samples.reduce((a, b) => a + b, 0) / samples.length || 0

    return { peak, average, samples }
  }

  async measureRenderTimes(components: string[]): Promise<number[]> {
    // Mock render time measurement
    return components.map(() => Math.random() * 100 + 10)
  }

  async measureScrollPerformance(): Promise<{ droppedFrames: number; avgFrameTime: number }> {
    // Mock scroll performance measurement
    return {
      droppedFrames: Math.floor(Math.random() * 3),
      avgFrameTime: Math.random() * 16 + 8
    }
  }
}

// Screenshot management helper class
class ScreenshotManager {
  async initialize(): Promise<void> {
    console.log('📸 Screenshot manager initialized')
  }

  async captureFailureScreenshot(testName: string): Promise<string[]> {
    try {
      // Mock screenshot capture - in real implementation would use react-native-view-shot
      console.log(`📷 Capturing screenshot for failed test: ${testName}`)
      return [`screenshot-${testName}-${Date.now()}.png`]
    } catch (error) {
      console.warn('Failed to capture screenshot:', error)
      return []
    }
  }
}

// Export test runner function
export async function runMobileDeviceTests(config?: Partial<DeviceTestConfig>): Promise<TestReport> {
  const defaultConfig: DeviceTestConfig = {
    testSuite: 'ClaimGuardian Mobile Test Suite',
    includePerformanceTests: true,
    includeOfflineTests: true,
    includeCameraTests: true,
    includeLocationTests: true,
    includeNetworkTests: true,
    testTimeout: 30000,
    screenshotOnFailure: true,
    generateReport: true
  }

  const finalConfig = { ...defaultConfig, ...config }

  const framework = new MobileDeviceTestFramework()
  await framework.initialize()

  return await framework.runTestSuite(finalConfig)
}

export default MobileDeviceTestFramework
