declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'consent',
      ...args: any[]
    ) => void
  }
}

export {}