import { FliorDataType, RateLimiter } from "./types.ts"
import { FLOIR_PORTALS } from "./config.ts"

export class FLOIRCrawler {
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private playwright: any = null

  constructor() {
    // Initialize rate limiters for each domain
    Object.values(FLOIR_PORTALS).forEach(config => {
      const domain = new URL(config.site.baseUrl).hostname
      this.rateLimiters.set(domain, {
        domain,
        requestsPerSecond: config.site.rateLimit,
        lastRequestTime: 0,
        queue: []
      })
    })
  }

  private async ensurePlaywright() {
    if (!this.playwright) {
      // Dynamic import of Playwright for Deno
      const { chromium } = await import("https://deno.land/x/playwright@1.40.0/mod.ts")
      this.playwright = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
    }
    return this.playwright
  }

  private async rateLimit(domain: string): Promise<void> {
    const limiter = this.rateLimiters.get(domain)
    if (!limiter) return

    const now = Date.now()
    const timeSinceLastRequest = now - limiter.lastRequestTime
    const minInterval = 1000 / limiter.requestsPerSecond

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    limiter.lastRequestTime = Date.now()
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  async crawl(dataType: FliorDataType, query: Record<string, any> = {}): Promise<any[]> {
    const config = FLOIR_PORTALS[dataType]
    if (!config) {
      throw new Error(`No configuration found for data type: ${dataType}`)
    }

    const domain = new URL(config.site.baseUrl).hostname
    const browser = await this.ensurePlaywright()
    const context = await browser.newContext({
      userAgent: config.site.antiBot.userAgent,
      extraHTTPHeaders: config.site.antiBot.headers
    })

    try {
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Starting crawl for ${dataType} on ${domain}`
      }));

      // Apply rate limiting
      await this.rateLimit(domain)

      const page = await context.newPage()

      // Add random delay to avoid detection
      await this.randomDelay(
        config.site.antiBot.delays.min,
        config.site.antiBot.delays.max
      )

      // Route based on data type
      switch (dataType) {
        case FliorDataType.CATASTROPHE:
          return await this.crawlCatastrophe(page, config, query)
        case FliorDataType.INDUSTRY_REPORTS:
          return await this.crawlIndustryReports(page, config, query)
        case FliorDataType.PROFESSIONAL_LIABILITY:
          return await this.crawlProfessionalLiability(page, config, query)
        case FliorDataType.DATA_CALL:
          return await this.crawlDataCall(page, config, query)
        case FliorDataType.LICENSEE_SEARCH:
          return await this.crawlLicenseeSearch(page, config, query)
        case FliorDataType.RATE_FILINGS:
          return await this.crawlRateFilings(page, config, query)
        case FliorDataType.RECEIVERSHIP:
          return await this.crawlReceivership(page, config, query)
        case FliorDataType.FINANCIAL_REPORTS:
          return await this.crawlFinancialReports(page, config, query)
        case FliorDataType.NEWS_BULLETINS:
          return await this.crawlNewsBulletins(page, config, query)
        case FliorDataType.SURPLUS_LINES:
          return await this.crawlSurplusLines(page, config, query)
        default:
          throw new Error(`Crawl method not implemented for ${dataType}`)
      }
    } finally {
      await context.close()
    }
  }

  private async crawlCatastrophe(page: any, config: any, query: any): Promise<any[]> {
    const url = `${config.site.baseUrl}${config.endpoints.main}`
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Navigating to: ${url}`
    }));

    await page.goto(url, { waitUntil: 'networkidle' })

    // Extract table data
    const data = await page.evaluate((fieldMapping: any) => {
      const rows = document.querySelectorAll('table tr')
      const results: any[] = []

      rows.forEach((row, index) => {
        if (index === 0) return // Skip header

        const result: any = {}
        const cells = row.querySelectorAll('td')

        if (cells.length >= 3) {
          result.Event = cells[0]?.textContent?.trim() || ''
          result.Claims = cells[1]?.textContent?.trim() || ''
          result.Losses = cells[2]?.textContent?.trim() || ''

          // Look for PDF links
          const pdfLink = row.querySelector('a[href$=".pdf"]')
          if (pdfLink) {
            result.PdfLink = pdfLink.getAttribute('href')
          }

          result._source_url = window.location.href
          result._extracted_at = new Date().toISOString()
          results.push(result)
        }
      })

      return results
    }, config.fieldMapping)

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} catastrophe records`
    }));
    return data
  }

  private async crawlIndustryReports(page: any, config: any, query: any): Promise<any[]> {
    const url = `${config.site.baseUrl}${config.endpoints.main}`
    await page.goto(url, { waitUntil: 'networkidle' })

    const data = await page.evaluate(() => {
      const results: any[] = []
      const pdfLinks = document.querySelectorAll('a[href$=".pdf"]')

      pdfLinks.forEach(link => {
        const href = link.getAttribute('href')
        const text = link.textContent?.trim() || ''
        const yearMatch = text.match(/(\d{4})/)

        if (href && yearMatch) {
          results.push({
            Year: yearMatch[1],
            ReportPDF: href.startsWith('http') ? href : `${window.location.origin}${href}`,
            Title: text,
            _source_url: window.location.href,
            _extracted_at: new Date().toISOString()
          })
        }
      })

      return results
    })

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} industry report records`
    }));
    return data
  }

  private async crawlProfessionalLiability(page: any, config: any, query: any): Promise<any[]> {
    // This requires form submission and pagination
    const url = `${config.site.baseUrl}${config.endpoints.main}`
    await page.goto(url, { waitUntil: 'networkidle' })

    // Submit search form (if needed)
    const hasSearchForm = await page.$('form')
    if (hasSearchForm) {
      await page.click('input[type="submit"]')
      await page.waitForSelector('table', { timeout: 10000 })
    }

    const data = await page.evaluate(() => {
      const results: any[] = []
      const rows = document.querySelectorAll('table tr')

      rows.forEach((row, index) => {
        if (index === 0) return // Skip header

        const cells = row.querySelectorAll('td')
        if (cells.length >= 7) {
          results.push({
            CaseNo: cells[0]?.textContent?.trim() || '',
            Paid: cells[5]?.textContent?.trim() || '',
            CloseDate: cells[6]?.textContent?.trim() || '',
            _source_url: window.location.href,
            _extracted_at: new Date().toISOString()
          })
        }
      })

      return results
    })

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} professional liability records`
    }));
    return data
  }

  private async crawlRateFilings(page: any, config: any, query: any): Promise<any[]> {
    // This is a JSON API endpoint
    const url = `${config.site.baseUrl}${config.endpoints.main}`

    const requestBody = {
      PageSize: query.PageSize || 100,
      PageNumber: query.PageNumber || 1,
      SortColumn: "ReceivedDate",
      SortDirection: "desc",
      ...query
    }

    const response = await page.evaluate(async (url: string, body: any) => {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      })
      return await resp.json()
    }, url, requestBody)

    const data = response.data || []
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} rate filing records`
    }));

    // Add metadata to each record
    return data.map((record: any) => ({
      ...record,
      _source_url: url,
      _extracted_at: new Date().toISOString()
    }))
  }

  private async crawlReceivership(page: any, config: any, query: any): Promise<any[]> {
    const url = `${config.site.baseUrl}${config.endpoints.main}`
    await page.goto(url, { waitUntil: 'networkidle' })

    const data = await page.evaluate(() => {
      const results: any[] = []
      const rows = document.querySelectorAll('table tr')

      rows.forEach((row, index) => {
        if (index === 0) return // Skip header

        const cells = row.querySelectorAll('td')
        if (cells.length >= 3) {
          results.push({
            CompanyName: cells[0]?.textContent?.trim() || '',
            Status: cells[1]?.textContent?.trim() || '',
            DateReceived: cells[2]?.textContent?.trim() || '',
            _source_url: window.location.href,
            _extracted_at: new Date().toISOString()
          })
        }
      })

      return results
    })

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} receivership records`
    }));
    return data
  }

  private async crawlNewsBulletins(page: any, config: any, query: any): Promise<any[]> {
    // This is an Atom feed
    const url = `${config.site.baseUrl}${config.endpoints.main}`

    const response = await page.evaluate(async (feedUrl: string) => {
      const resp = await fetch(feedUrl)
      const text = await resp.text()
      return text
    }, url)

    // Parse Atom feed
    const parser = new DOMParser()
    const doc = parser.parseFromString(response, 'application/xml')
    const entries = doc.querySelectorAll('entry')

    const data: any[] = []
    entries.forEach(entry => {
      data.push({
        Title: entry.querySelector('title')?.textContent?.trim() || '',
        Published: entry.querySelector('published')?.textContent?.trim() || '',
        Link: entry.querySelector('link')?.getAttribute('href') || '',
        Summary: entry.querySelector('summary')?.textContent?.trim() || '',
        _source_url: url,
        _extracted_at: new Date().toISOString()
      })
    })

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Extracted ${data.length} news bulletin records`
    }));
    return data
  }

  // Implement remaining crawl methods similarly...
  private async crawlDataCall(page: any, config: any, query: any): Promise<any[]> {
    // Implementation similar to other HTML table crawlers
    return []
  }

  private async crawlLicenseeSearch(page: any, config: any, query: any): Promise<any[]> {
    // Implementation with form submission and session handling
    return []
  }

  private async crawlFinancialReports(page: any, config: any, query: any): Promise<any[]> {
    // Implementation similar to other HTML table crawlers
    return []
  }

  private async crawlSurplusLines(page: any, config: any, query: any): Promise<any[]> {
    // Implementation with XLS export handling
    return []
  }

  async close(): Promise<void> {
    if (this.playwright) {
      await this.playwright.close()
      this.playwright = null
    }
  }
}
