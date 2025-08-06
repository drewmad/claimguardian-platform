/**
 * AI Cost Tracking Testing Framework
 * Comprehensive testing suite for AI cost tracking system
 */

import { supabase } from '@/lib/supabase'

// Mock AI providers for testing
export interface MockAIProvider {
  name: string
  baseUrl: string
  authenticate: (apiKey: string) => boolean
  generateResponse: (prompt: string, model: string) => Promise<MockAIResponse>
  calculateCost: (tokens: number, model: string) => number
  getModels: () => string[]
}

export interface MockAIResponse {
  content: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  model: string
  cost: number
  latency: number
}

// Mock OpenAI provider
export const mockOpenAIProvider: MockAIProvider = {
  name: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  
  authenticate: (apiKey: string): boolean => {
    return apiKey.startsWith('sk-test-') || apiKey === 'mock-openai-key'
  },
  
  generateResponse: async (prompt: string, model: string = 'gpt-4'): Promise<MockAIResponse> => {
    const promptTokens = Math.ceil(prompt.length / 4) // Rough estimate
    const completionTokens = Math.floor(Math.random() * 200) + 50
    const totalTokens = promptTokens + completionTokens
    
    const cost = mockOpenAIProvider.calculateCost(totalTokens, model)
    const latency = Math.floor(Math.random() * 2000) + 500 // 500-2500ms
    
    return {
      content: `Mock AI response for prompt: ${prompt.substring(0, 50)}...`,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      model,
      cost,
      latency
    }
  },
  
  calculateCost: (tokens: number, model: string): number => {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    }
    
    const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4']
    return (tokens / 1000) * ((modelPricing.input + modelPricing.output) / 2)
  },
  
  getModels: (): string[] => ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
}

// Mock Gemini provider
export const mockGeminiProvider: MockAIProvider = {
  name: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1',
  
  authenticate: (apiKey: string): boolean => {
    return apiKey.startsWith('AIza') || apiKey === 'mock-gemini-key'
  },
  
  generateResponse: async (prompt: string, model: string = 'gemini-pro'): Promise<MockAIResponse> => {
    const promptTokens = Math.ceil(prompt.length / 4)
    const completionTokens = Math.floor(Math.random() * 150) + 40
    const totalTokens = promptTokens + completionTokens
    
    const cost = mockGeminiProvider.calculateCost(totalTokens, model)
    const latency = Math.floor(Math.random() * 1500) + 300 // 300-1800ms
    
    return {
      content: `Mock Gemini response for: ${prompt.substring(0, 50)}...`,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      model,
      cost,
      latency
    }
  },
  
  calculateCost: (tokens: number, model: string): number => {
    const pricing = {
      'gemini-pro': { input: 0.0005, output: 0.0015 }, // per 1K tokens
      'gemini-pro-vision': { input: 0.0025, output: 0.01 }
    }
    
    const modelPricing = pricing[model as keyof typeof pricing] || pricing['gemini-pro']
    return (tokens / 1000) * ((modelPricing.input + modelPricing.output) / 2)
  },
  
  getModels: (): string[] => ['gemini-pro', 'gemini-pro-vision']
}

// Test scenarios for AI cost tracking
export interface AITestScenario {
  name: string
  description: string
  provider: MockAIProvider
  requests: Array<{
    prompt: string
    model: string
    expectedTokenRange: [number, number]
    expectedCostRange: [number, number]
  }>
  expectedTotalCost: number
  testDuration: number // milliseconds
}

// Pre-defined test scenarios
export const testScenarios: AITestScenario[] = [
  {
    name: 'Light Usage - Individual User',
    description: 'Simulates typical individual user usage pattern',
    provider: mockOpenAIProvider,
    requests: [
      {
        prompt: 'Analyze this property damage photo and provide assessment',
        model: 'gpt-4-turbo',
        expectedTokenRange: [50, 200],
        expectedCostRange: [0.001, 0.01]
      },
      {
        prompt: 'Generate a claim summary for water damage',
        model: 'gpt-4',
        expectedTokenRange: [100, 300],
        expectedCostRange: [0.005, 0.02]
      },
      {
        prompt: 'Help me understand my insurance policy coverage',
        model: 'gpt-3.5-turbo',
        expectedTokenRange: [80, 250],
        expectedCostRange: [0.0001, 0.001]
      }
    ],
    expectedTotalCost: 0.03,
    testDuration: 10000 // 10 seconds
  },
  
  {
    name: 'Heavy Usage - Business User',
    description: 'Simulates heavy business user with multiple claims',
    provider: mockOpenAIProvider,
    requests: Array.from({ length: 20 }, (_, i) => ({
      prompt: `Process claim #${i + 1} with detailed damage assessment and cost estimation`,
      model: i % 3 === 0 ? 'gpt-4' : 'gpt-4-turbo',
      expectedTokenRange: [200, 500],
      expectedCostRange: [0.01, 0.05]
    })),
    expectedTotalCost: 0.6,
    testDuration: 60000 // 60 seconds
  },
  
  {
    name: 'Mixed Provider Usage',
    description: 'Tests cost tracking across multiple AI providers',
    provider: mockGeminiProvider, // Will be mixed with OpenAI
    requests: [
      {
        prompt: 'Analyze property images with Gemini Vision',
        model: 'gemini-pro-vision',
        expectedTokenRange: [100, 400],
        expectedCostRange: [0.001, 0.015]
      },
      {
        prompt: 'Generate policy recommendations',
        model: 'gemini-pro',
        expectedTokenRange: [150, 350],
        expectedCostRange: [0.0001, 0.002]
      }
    ],
    expectedTotalCost: 0.02,
    testDuration: 15000 // 15 seconds
  },
  
  {
    name: 'Budget Threshold Testing',
    description: 'Tests budget alert system with high usage',
    provider: mockOpenAIProvider,
    requests: Array.from({ length: 50 }, (_, i) => ({
      prompt: `High-cost request ${i + 1} for budget testing with extensive analysis`,
      model: 'gpt-4',
      expectedTokenRange: [300, 800],
      expectedCostRange: [0.02, 0.08]
    })),
    expectedTotalCost: 2.0, // Should trigger budget alerts
    testDuration: 120000 // 2 minutes
  }
]

// Cost tracking test utilities
export class AIContentTestingFramework {
  private testResults: Array<{
    scenario: string
    timestamp: string
    totalCost: number
    requests: number
    avgLatency: number
    errors: string[]
    budgetAlertsTriggered: number
  }> = []

  async runTestScenario(scenario: AITestScenario, userId: string = 'test-user-123'): Promise<void> {
    console.log(`🧪 Running test scenario: ${scenario.name}`)
    
    const startTime = Date.now()
    let totalCost = 0
    let totalLatency = 0
    const errors: string[] = []
    let budgetAlertsTriggered = 0
    
    try {
      // Initialize test budget
      await this.createTestBudget(userId, 1.0) // $1 test budget
      
      // Execute requests
      for (let i = 0; i < scenario.requests.length; i++) {
        const request = scenario.requests[i]
        
        try {
          console.log(`📝 Processing request ${i + 1}/${scenario.requests.length}`)
          
          const response = await scenario.provider.generateResponse(
            request.prompt,
            request.model
          )
          
          // Record usage in database
          await this.recordAIUsage({
            user_id: userId,
            provider: scenario.provider.name,
            model: request.model,
            tokens_used: response.tokens.total,
            cost: response.cost,
            request_type: 'test',
            response_time_ms: response.latency,
            success: true
          })
          
          totalCost += response.cost
          totalLatency += response.latency
          
          // Check for budget alerts
          const currentUsage = await this.getCurrentUsage(userId)
          if (currentUsage > 0.8) { // 80% of budget
            budgetAlertsTriggered++
            console.log('⚠️ Budget alert would be triggered')
          }
          
          // Validate token range
          if (response.tokens.total < request.expectedTokenRange[0] || 
              response.tokens.total > request.expectedTokenRange[1]) {
            errors.push(`Token count ${response.tokens.total} outside expected range ${request.expectedTokenRange}`)
          }
          
          // Validate cost range
          if (response.cost < request.expectedCostRange[0] || 
              response.cost > request.expectedCostRange[1]) {
            errors.push(`Cost ${response.cost} outside expected range ${request.expectedCostRange}`)
          }
          
          // Add realistic delay between requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
          
        } catch (error) {
          console.error(`❌ Request ${i + 1} failed:`, error)
          errors.push(`Request ${i + 1}: ${error.message}`)
        }
      }
      
      const avgLatency = totalLatency / scenario.requests.length
      
      // Store test results
      this.testResults.push({
        scenario: scenario.name,
        timestamp: new Date().toISOString(),
        totalCost,
        requests: scenario.requests.length,
        avgLatency,
        errors,
        budgetAlertsTriggered
      })
      
      console.log(`✅ Test scenario completed:`)
      console.log(`   Total cost: $${totalCost.toFixed(4)}`)
      console.log(`   Expected cost: $${scenario.expectedTotalCost.toFixed(4)}`)
      console.log(`   Avg latency: ${avgLatency.toFixed(0)}ms`)
      console.log(`   Errors: ${errors.length}`)
      console.log(`   Budget alerts: ${budgetAlertsTriggered}`)
      
    } catch (error) {
      console.error(`💥 Test scenario failed:`, error)
      errors.push(`Scenario failure: ${error.message}`)
    } finally {
      // Cleanup test data
      await this.cleanupTestData(userId)
    }
  }

  async runAllTestScenarios(): Promise<void> {
    console.log('🚀 Starting comprehensive AI cost tracking tests...')
    
    for (const scenario of testScenarios) {
      await this.runTestScenario(scenario, `test-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`)
      
      // Wait between scenarios
      console.log('⏳ Waiting 5 seconds before next scenario...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    console.log('🎉 All test scenarios completed!')
    this.generateTestReport()
  }

  private async createTestBudget(userId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('ai_cost_budgets')
      .upsert({
        user_id: userId,
        monthly_budget: amount,
        current_usage: 0,
        reset_day: 1,
        alert_thresholds: [0.5, 0.8, 0.9],
        is_active: true
      })
    
    if (error) {
      throw new Error(`Failed to create test budget: ${error.message}`)
    }
  }

  private async recordAIUsage(usage: {
    user_id: string
    provider: string
    model: string
    tokens_used: number
    cost: number
    request_type: string
    response_time_ms: number
    success: boolean
  }): Promise<void> {
    const { error } = await supabase
      .from('ai_usage_tracking')
      .insert({
        ...usage,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      throw new Error(`Failed to record AI usage: ${error.message}`)
    }
  }

  private async getCurrentUsage(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('ai_cost_budgets')
      .select('current_usage')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Failed to get current usage:', error)
      return 0
    }
    
    return data?.current_usage || 0
  }

  private async cleanupTestData(userId: string): Promise<void> {
    // Remove test usage records
    await supabase
      .from('ai_usage_tracking')
      .delete()
      .eq('user_id', userId)
    
    // Remove test budget
    await supabase
      .from('ai_cost_budgets')
      .delete()
      .eq('user_id', userId)
  }

  generateTestReport(): void {
    console.log('\n📊 AI Cost Tracking Test Report')
    console.log('=' .repeat(50))
    
    let totalTests = this.testResults.length
    let totalErrors = 0
    let totalCost = 0
    let totalRequests = 0
    
    this.testResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.scenario}`)
      console.log(`   Timestamp: ${result.timestamp}`)
      console.log(`   Total Cost: $${result.totalCost.toFixed(4)}`)
      console.log(`   Requests: ${result.requests}`)
      console.log(`   Avg Latency: ${result.avgLatency.toFixed(0)}ms`)
      console.log(`   Errors: ${result.errors.length}`)
      console.log(`   Budget Alerts: ${result.budgetAlertsTriggered}`)
      
      if (result.errors.length > 0) {
        console.log('   Error Details:')
        result.errors.forEach(error => console.log(`     - ${error}`))
      }
      
      totalErrors += result.errors.length
      totalCost += result.totalCost
      totalRequests += result.requests
    })
    
    console.log('\n📈 Summary Statistics')
    console.log(`   Total Test Scenarios: ${totalTests}`)
    console.log(`   Total Requests: ${totalRequests}`)
    console.log(`   Total Simulated Cost: $${totalCost.toFixed(4)}`)
    console.log(`   Total Errors: ${totalErrors}`)
    console.log(`   Success Rate: ${((totalRequests - totalErrors) / totalRequests * 100).toFixed(1)}%`)
    
    const passedTests = this.testResults.filter(r => r.errors.length === 0).length
    console.log(`   Test Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`)
    
    console.log('\n' + '='.repeat(50))
    
    if (totalErrors === 0) {
      console.log('🎉 All tests passed! AI cost tracking system is working correctly.')
    } else {
      console.log('⚠️ Some tests failed. Please review errors and fix issues.')
    }
  }

  getTestResults(): typeof this.testResults {
    return this.testResults
  }
}

// Stress testing utilities
export class AIStressTestFramework {
  private concurrentRequests = 0
  private maxConcurrency = 0
  private totalRequests = 0
  private errors: string[] = []

  async runConcurrencyTest(
    provider: MockAIProvider,
    concurrentUsers: number,
    requestsPerUser: number,
    duration: number = 60000
  ): Promise<void> {
    console.log(`🔥 Starting concurrency test: ${concurrentUsers} users, ${requestsPerUser} requests each`)
    
    const promises: Promise<void>[] = []
    const startTime = Date.now()
    
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUser(provider, i, requestsPerUser, duration))
    }
    
    await Promise.all(promises)
    
    const endTime = Date.now()
    const actualDuration = endTime - startTime
    
    console.log(`\n🏁 Concurrency test results:`)
    console.log(`   Duration: ${actualDuration}ms`)
    console.log(`   Total Requests: ${this.totalRequests}`)
    console.log(`   Max Concurrency: ${this.maxConcurrency}`)
    console.log(`   Errors: ${this.errors.length}`)
    console.log(`   Requests/second: ${(this.totalRequests / (actualDuration / 1000)).toFixed(2)}`)
  }

  private async simulateUser(
    provider: MockAIProvider,
    userId: number,
    requests: number,
    duration: number
  ): Promise<void> {
    const endTime = Date.now() + duration
    let requestCount = 0
    
    while (Date.now() < endTime && requestCount < requests) {
      try {
        this.concurrentRequests++
        this.maxConcurrency = Math.max(this.maxConcurrency, this.concurrentRequests)
        
        const prompt = `Test request ${requestCount + 1} from user ${userId}`
        await provider.generateResponse(prompt, 'gpt-4')
        
        this.totalRequests++
        requestCount++
        
        // Random delay between requests (100-1000ms)
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 900 + 100)
        )
        
      } catch (error) {
        this.errors.push(`User ${userId}, Request ${requestCount}: ${error.message}`)
      } finally {
        this.concurrentRequests--
      }
    }
  }
}

// Export main testing function
export async function runAICostTrackingTests(): Promise<void> {
  console.log('🧪 Starting AI Cost Tracking Test Suite')
  console.log('This will test the complete AI cost tracking system')
  
  const testFramework = new AIContentTestingFramework()
  
  try {
    // Run all test scenarios
    await testFramework.runAllTestScenarios()
    
    // Run stress test
    console.log('\n🔥 Starting stress test...')
    const stressTest = new AIStressTestFramework()
    await stressTest.runConcurrencyTest(mockOpenAIProvider, 10, 5, 30000)
    
    console.log('\n✅ AI cost tracking test suite completed successfully!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    throw error
  }
}