/**
 * @fileMetadata
 * @purpose "Basic test to verify Jest setup is working"
 * @dependencies []
 * @owner platform-team
 * @complexity low
 * @tags ["testing", "setup", "basic"]
 * @status stable
 */

describe('Basic Setup Test', () => {
  it('should verify Jest is working', () => {
    expect(true).toBe(true)
  })

  it('should verify math operations', () => {
    expect(2 + 2).toBe(4)
    expect(5 * 3).toBe(15)
  })
})