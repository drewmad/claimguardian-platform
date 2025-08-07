import { FliorDataType, FliorPortalConfig } from "./types.ts"

export const FLOIR_PORTALS: FliorPortalConfig = {
  [FliorDataType.CATASTROPHE]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1, // 1 req/s
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        delays: { min: 1000, max: 3000 }
      }
    },
    endpoints: {
      main: "/tools-and-data/catastrophe-reporting"
    },
    fieldMapping: {
      "Event": { selector: "table tr td:nth-child(1)" },
      "Claims": { selector: "table tr td:nth-child(2)" },
      "Losses": { selector: "table tr td:nth-child(3)" },
      "PdfLink": { selector: "a[href$='.pdf']", attribute: "href" }
    }
  },

  [FliorDataType.INDUSTRY_REPORTS]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1,
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        delays: { min: 1000, max: 2000 }
      }
    },
    endpoints: {
      main: "/resources-and-reports/industry-reports"
    },
    fieldMapping: {
      "Year": { regex: "(\\d{4})" },
      "ReportPDF": { selector: "a[href$='.pdf']", attribute: "href" }
    }
  },

  [FliorDataType.PROFESSIONAL_LIABILITY]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1,
      requiresSession: true, // ASP.NET session required
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        delays: { min: 2000, max: 4000 }
      }
    },
    endpoints: {
      main: "/tools-and-data/professional-liability-tracking-system",
      search: "/SearchResults.aspx"
    },
    fieldMapping: {
      "CaseNo": { selector: "tr td:nth-child(1)" },
      "Paid": { selector: "tr td:nth-child(6)" },
      "CloseDate": { selector: "tr td:nth-child(7)" }
    },
    pagination: {
      type: "query",
      params: { page: 1 }
    }
  },

  [FliorDataType.DATA_CALL]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1,
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {},
        delays: { min: 1000, max: 2000 }
      }
    },
    endpoints: {
      main: "/tools-and-data/data-call-reporting"
    },
    fieldMapping: {
      "Year": { selector: "select option[selected]" },
      "DataType": { selector: "table tr td:nth-child(1)" },
      "Status": { selector: "table tr td:nth-child(2)" }
    },
    pagination: {
      type: "query",
      params: { year: new Date().getFullYear() }
    }
  },

  [FliorDataType.LICENSEE_SEARCH]: {
    site: {
      baseUrl: "https://licenseesearch.fldfs.com",
      rateLimit: 0.5, // 30 req/min = 0.5 req/s
      requiresSession: true,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {
          "Referer": "https://licenseesearch.fldfs.com/"
        },
        delays: { min: 2000, max: 5000 }
      }
    },
    endpoints: {
      main: "/",
      search: "/results.aspx"
    },
    fieldMapping: {
      "LicenseeId": { selector: "tr td:nth-child(1)" },
      "Name": { selector: "tr td:nth-child(2)" },
      "LicenseType": { selector: "tr td:nth-child(3)" },
      "Status": { selector: "tr td:nth-child(4)" }
    }
  },

  [FliorDataType.RATE_FILINGS]: {
    site: {
      baseUrl: "https://irfssearch.fldfs.com",
      rateLimit: 2, // 120 calls / 2 min = 1 req/s, but we'll be conservative
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        delays: { min: 500, max: 1000 }
      }
    },
    endpoints: {
      main: "/FilingSearch/GetFilings"
    },
    fieldMapping: {
      "FilingId": { json_key: "FileLogNumber" },
      "Company": { json_key: "CompanyName" },
      "Status": { json_key: "FilingStatus" },
      "Received": { json_key: "ReceivedDate" }
    },
    pagination: {
      type: "json",
      params: { PageSize: 100, PageNumber: 1 }
    }
  },

  [FliorDataType.RECEIVERSHIP]: {
    site: {
      baseUrl: "https://myfloridacfo.com",
      rateLimit: 1,
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {},
        delays: { min: 1000, max: 2000 }
      }
    },
    endpoints: {
      main: "/division/receiver/companies"
    },
    fieldMapping: {
      "CompanyName": { selector: "table tr td:nth-child(1)" },
      "Status": { selector: "table tr td:nth-child(2)" },
      "DateReceived": { selector: "table tr td:nth-child(3)" }
    }
  },

  [FliorDataType.FINANCIAL_REPORTS]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1,
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {},
        delays: { min: 1000, max: 2000 }
      }
    },
    endpoints: {
      main: "/property-casualty/property-casualty-financial-oversight"
    },
    fieldMapping: {
      "NAICCode": { selector: "table tr td:nth-child(1)" },
      "CompanyName": { selector: "table tr td:nth-child(2)" },
      "StatementPDF": { selector: "a[href$='.pdf']", attribute: "href" }
    }
  },

  [FliorDataType.NEWS_BULLETINS]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 2, // RSS feeds can handle higher rates
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (compatible; FeedReader/1.0)",
        headers: {
          "Accept": "application/rss+xml, application/atom+xml, text/xml"
        },
        delays: { min: 500, max: 1000 }
      }
    },
    endpoints: {
      main: "/newsroom/news?format=atom"
    },
    fieldMapping: {
      "Title": { selector: "entry title" },
      "Published": { selector: "entry published" },
      "Link": { selector: "entry link", attribute: "href" },
      "Summary": { selector: "entry summary" }
    }
  },

  [FliorDataType.SURPLUS_LINES]: {
    site: {
      baseUrl: "https://floir.com",
      rateLimit: 1,
      requiresSession: false,
      antiBot: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        headers: {},
        delays: { min: 1000, max: 2000 }
      }
    },
    endpoints: {
      main: "/resources-and-reports/surplus-lines-search"
    },
    fieldMapping: {
      "CompanyName": { selector: "table tr td:nth-child(1)" },
      "State": { selector: "table tr td:nth-child(2)" },
      "Lines": { selector: "table tr td:nth-child(3)" }
    },
    pagination: {
      type: "query",
      params: { export: "xls" }
    }
  }
}
