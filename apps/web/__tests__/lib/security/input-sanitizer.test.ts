/**
 * @fileMetadata
 * @purpose "Tests for input sanitization security features"
 * @dependencies ["@/lib"]
 * @owner platform-team
 * @complexity medium
 * @tags ["testing", "security", "sanitization", "xss-prevention"]
 * @status stable
 */

import { inputSanitizer } from '@/lib/security/input-sanitizer'

describe('InputSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>'
      const result = inputSanitizer.sanitizeHtml(maliciousInput)
      
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert("XSS")')
      expect(result).toContain('Safe content')
    })

    it('should remove dangerous event handlers', () => {
      const maliciousInput = '<div onclick="alert(\'XSS\')">Click me</div>'
      const result = inputSanitizer.sanitizeHtml(maliciousInput)
      
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
      expect(result).toContain('Click me')
    })

    it('should allow safe HTML tags', () => {
      const safeInput = '<p>Hello <strong>world</strong>!</p><br><em>Safe content</em>'
      const result = inputSanitizer.sanitizeHtml(safeInput)
      
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<br>')
      expect(result).toContain('<em>')
      expect(result).toContain('Hello world!')
    })

    it('should strip all tags when stripTags is true', () => {
      const input = '<p>Hello <strong>world</strong>!</p>'
      const result = inputSanitizer.sanitizeHtml(input, { stripTags: true })
      
      expect(result).toBe('Hello world!')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should truncate long content', () => {
      const longInput = 'a'.repeat(15000)
      const result = inputSanitizer.sanitizeHtml(longInput, { maxLength: 100 })
      
      expect(result.length).toBe(100)
    })

    it('should handle null and undefined inputs', () => {
      expect(inputSanitizer.sanitizeHtml(null as any)).toBe('')
      expect(inputSanitizer.sanitizeHtml(undefined as any)).toBe('')
      expect(inputSanitizer.sanitizeHtml('')).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00\x1F\x7F\x9FWorld'
      const result = inputSanitizer.sanitizeText(input)
      
      expect(result).toBe('HelloWorld')
    })

    it('should trim whitespace', () => {
      const input = '   Hello World   '
      const result = inputSanitizer.sanitizeText(input)
      
      expect(result).toBe('Hello World')
    })

    it('should respect max length', () => {
      const input = 'a'.repeat(2000)
      const result = inputSanitizer.sanitizeText(input, 100)
      
      expect(result.length).toBe(100)
    })

    it('should handle non-string inputs', () => {
      expect(inputSanitizer.sanitizeText(null as any)).toBe('')
      expect(inputSanitizer.sanitizeText(123 as any)).toBe('')
      expect(inputSanitizer.sanitizeText({} as any)).toBe('')
    })
  })

  describe('sanitizeEmail', () => {
    it('should validate and clean valid emails', () => {
      expect(inputSanitizer.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
      expect(inputSanitizer.sanitizeEmail('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk')
    })

    it('should reject invalid emails', () => {
      expect(inputSanitizer.sanitizeEmail('invalid-email')).toBe('')
      expect(inputSanitizer.sanitizeEmail('user@')).toBe('')
      expect(inputSanitizer.sanitizeEmail('@domain.com')).toBe('')
      expect(inputSanitizer.sanitizeEmail('user..name@domain.com')).toBe('')
    })

    it('should handle non-string inputs', () => {
      expect(inputSanitizer.sanitizeEmail(null as any)).toBe('')
      expect(inputSanitizer.sanitizeEmail(123 as any)).toBe('')
    })
  })

  describe('sanitizeUrl', () => {
    it('should validate and accept valid URLs', () => {
      expect(inputSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(inputSanitizer.sanitizeUrl('http://subdomain.example.com/path?query=1')).toBe('http://subdomain.example.com/path?query=1')
    })

    it('should reject invalid URLs', () => {
      expect(inputSanitizer.sanitizeUrl('not-a-url')).toBe('')
      expect(inputSanitizer.sanitizeUrl('ftp://example.com')).toBe('')
      expect(inputSanitizer.sanitizeUrl('javascript:alert("xss")')).toBe('')
      expect(inputSanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    })

    it('should require protocol', () => {
      expect(inputSanitizer.sanitizeUrl('example.com')).toBe('')
      expect(inputSanitizer.sanitizeUrl('//example.com')).toBe('')
    })
  })

  describe('sanitizePhone', () => {
    it('should clean and validate phone numbers', () => {
      expect(inputSanitizer.sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567')
      expect(inputSanitizer.sanitizePhone('555.123.4567')).toBe('5551234567')
      expect(inputSanitizer.sanitizePhone('+44 20 7946 0958')).toBe('+442079460958')
    })

    it('should reject invalid phone numbers', () => {
      expect(inputSanitizer.sanitizePhone('123')).toBe('') // Too short
      expect(inputSanitizer.sanitizePhone('123456789012345678')).toBe('') // Too long
      expect(inputSanitizer.sanitizePhone('abc-def-ghij')).toBe('')
    })

    it('should handle non-string inputs', () => {
      expect(inputSanitizer.sanitizePhone(null as any)).toBe('')
      expect(inputSanitizer.sanitizePhone(123 as any)).toBe('')
    })
  })

  describe('sanitizeFileName', () => {
    it('should clean file names', () => {
      expect(inputSanitizer.sanitizeFileName('my file.txt')).toBe('my_file.txt')
      expect(inputSanitizer.sanitizeFileName('document/with\\invalid:chars.pdf')).toBe('document_with_invalid_chars.pdf')
    })

    it('should remove leading dots', () => {
      expect(inputSanitizer.sanitizeFileName('...hidden-file.txt')).toBe('hidden-file.txt')
    })

    it('should respect length limits', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const result = inputSanitizer.sanitizeFileName(longName)
      
      expect(result.length).toBeLessThanOrEqual(255)
    })

    it('should preserve valid characters', () => {
      expect(inputSanitizer.sanitizeFileName('valid-file_name.123.txt')).toBe('valid-file_name.123.txt')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should clean search queries', () => {
      expect(inputSanitizer.sanitizeSearchQuery('search term')).toBe('search term')
      expect(inputSanitizer.sanitizeSearchQuery('  search   term  ')).toBe('search   term')
    })

    it('should remove dangerous characters', () => {
      expect(inputSanitizer.sanitizeSearchQuery('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
      expect(inputSanitizer.sanitizeSearchQuery('search "term"')).toBe('search term')
      expect(inputSanitizer.sanitizeSearchQuery("search 'term'")).toBe('search term')
    })

    it('should respect length limits', () => {
      const longQuery = 'a'.repeat(200)
      const result = inputSanitizer.sanitizeSearchQuery(longQuery)
      
      expect(result.length).toBe(100)
    })
  })

  describe('sanitizeFormData', () => {
    it('should sanitize form data based on field names', () => {
      const formData = {
        email: '  TEST@EXAMPLE.COM  ',
        website: 'https://example.com',
        phone: '+1 (555) 123-4567',
        description: '<script>alert("xss")</script>Safe content',
        search_query: 'search "term"',
        name: 'John Doe',
      }

      const result = inputSanitizer.sanitizeFormData(formData)

      expect(result.email).toBe('test@example.com')
      expect(result.website).toBe('https://example.com')
      expect(result.phone).toBe('+15551234567')
      expect(result.description).not.toContain('<script>')
      expect(result.description).toContain('Safe content')
      expect(result.search_query).toBe('search term')
      expect(result.name).toBe('John Doe')
    })

    it('should handle nested objects', () => {
      const formData = {
        user: {
          name: '<script>alert(1)</script>John',
          email: '  TEST@EXAMPLE.COM  ',
        },
        preferences: {
          notifications: true,
        },
      }

      const result = inputSanitizer.sanitizeFormData(formData)

      expect((result.user as any).name).not.toContain('<script>')
      expect((result.user as any).email).toBe('test@example.com')
      expect((result.preferences as any).notifications).toBe(true)
    })

    it('should handle arrays', () => {
      const formData = {
        tags: ['<script>tag1</script>', 'tag2', 'tag3'],
        numbers: [1, 2, 3],
      }

      const result = inputSanitizer.sanitizeFormData(formData)

      expect((result.tags as string[])[0]).not.toContain('<script>')
      expect((result.tags as string[])[1]).toBe('tag2')
      expect(result.numbers).toEqual([1, 2, 3])
    })
  })

  describe('sanitizeSqlSearchTerm', () => {
    it('should remove SQL injection patterns', () => {
      expect(inputSanitizer.sanitizeSqlSearchTerm("test'; DROP TABLE users; --")).toBe('test DROP TABLE users')
      expect(inputSanitizer.sanitizeSqlSearchTerm('UNION SELECT * FROM passwords')).toBe('')
      expect(inputSanitizer.sanitizeSqlSearchTerm('normal search term')).toBe('normal search term')
    })

    it('should remove dangerous SQL keywords', () => {
      const dangerousQueries = [
        'SELECT * FROM users',
        'INSERT INTO table',
        'UPDATE users SET',
        'DELETE FROM table',
        'DROP TABLE users',
        'CREATE TABLE evil',
        'ALTER TABLE modify',
        'EXEC malicious',
      ]

      dangerousQueries.forEach(query => {
        const result = inputSanitizer.sanitizeSqlSearchTerm(query)
        expect(result).toBe('')
      })
    })

    it('should preserve safe search terms', () => {
      const safeQueries = [
        'search term',
        'product name',
        'category filter',
        'user query',
      ]

      safeQueries.forEach(query => {
        const result = inputSanitizer.sanitizeSqlSearchTerm(query)
        expect(result).toBe(query)
      })
    })

    it('should respect length limits', () => {
      const longQuery = 'a'.repeat(200)
      const result = inputSanitizer.sanitizeSqlSearchTerm(longQuery)
      
      expect(result.length).toBe(100)
    })
  })
})