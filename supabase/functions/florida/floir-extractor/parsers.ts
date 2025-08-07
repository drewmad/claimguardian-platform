import { FliorDataType, ParsedRecord } from "./types.ts";

export async function parseFlioirData(
  dataType: FliorDataType,
  rawData: any,
  openai: any,
): Promise<ParsedRecord> {
  // Generate primary key based on data type
  const primaryKey = generatePrimaryKey(dataType, rawData);

  // Normalize the data using GPT-4o-mini
  const normalized = await normalizeWithGPT(dataType, rawData, openai);

  // Extract content for embedding
  const contentForEmbedding = extractContentForEmbedding(dataType, normalized);

  return {
    primary_key: primaryKey,
    normalized,
    source_url: rawData._source_url,
    pdf_content: rawData.pdf_content || null,
    content_for_embedding: contentForEmbedding,
  };
}

function generatePrimaryKey(dataType: FliorDataType, rawData: any): string {
  switch (dataType) {
    case FliorDataType.CATASTROPHE:
      return `${dataType}_${rawData.Event?.replace(/\s+/g, "_").toLowerCase()}`;

    case FliorDataType.INDUSTRY_REPORTS:
      return `${dataType}_${rawData.Year}`;

    case FliorDataType.PROFESSIONAL_LIABILITY:
      return `${dataType}_${rawData.CaseNo}`;

    case FliorDataType.DATA_CALL:
      return `${dataType}_${rawData.Year}_${rawData.DataType?.replace(/\s+/g, "_").toLowerCase()}`;

    case FliorDataType.LICENSEE_SEARCH:
      return `${dataType}_${rawData.LicenseeId}`;

    case FliorDataType.RATE_FILINGS:
      return `${dataType}_${rawData.FileLogNumber || rawData.FilingId}`;

    case FliorDataType.RECEIVERSHIP:
      return `${dataType}_${rawData.CompanyName?.replace(/\s+/g, "_").toLowerCase()}`;

    case FliorDataType.FINANCIAL_REPORTS:
      return `${dataType}_${rawData.NAICCode}`;

    case FliorDataType.NEWS_BULLETINS:
      return `${dataType}_${rawData.Published}_${rawData.Title?.slice(0, 50).replace(/\s+/g, "_").toLowerCase()}`;

    case FliorDataType.SURPLUS_LINES:
      return `${dataType}_${rawData.CompanyName?.replace(/\s+/g, "_").toLowerCase()}`;

    default:
      return `${dataType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

async function normalizeWithGPT(
  dataType: FliorDataType,
  rawData: any,
  openai: any,
): Promise<Record<string, any>> {
  const prompt = createNormalizationPrompt(dataType, rawData);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a data normalization expert for Florida insurance regulation data. Convert raw scraped data into clean, structured JSON format. Focus on standardizing dates, numbers, currency amounts, and categorical values. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from GPT");
    }

    // Parse the JSON response
    const normalized = JSON.parse(content);

    // Add metadata
    normalized._data_type = dataType;
    normalized._normalized_at = new Date().toISOString();
    normalized._source_url = rawData._source_url;

    return normalized;
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Failed to normalize ${dataType} data:`,
        error,
      }),
    );

    // Fallback to basic normalization
    return basicNormalization(dataType, rawData);
  }
}

function createNormalizationPrompt(
  dataType: FliorDataType,
  rawData: any,
): string {
  const basePrompt = `
Normalize this ${dataType} data from Florida Office of Insurance Regulation:

Raw Data:
${JSON.stringify(rawData, null, 2)}

Requirements:
`;

  const typeSpecificRequirements = getNormalizationRequirements(dataType);

  return (
    basePrompt +
    typeSpecificRequirements +
    `

Return clean JSON with standardized field names and properly typed values.`
  );
}

function getNormalizationRequirements(dataType: FliorDataType): string {
  switch (dataType) {
    case FliorDataType.CATASTROPHE:
      return `
- Convert Claims to integer (extract numbers from text)
- Convert Losses to float dollar amount (handle $, commas, M/B suffixes)
- Standardize Event name (proper case, consistent naming)
- Extract year from Event name if present
- Add risk_level based on loss amounts (low/medium/high/catastrophic)`;

    case FliorDataType.INDUSTRY_REPORTS:
      return `
- Ensure Year is integer
- Standardize report title
- Extract report type/category from title
- Add file_size if available`;

    case FliorDataType.PROFESSIONAL_LIABILITY:
      return `
- Convert Paid to float dollar amount
- Parse CloseDate to ISO date format
- Extract case type from CaseNo if pattern exists
- Add status field based on close date (open/closed)`;

    case FliorDataType.RATE_FILINGS:
      return `
- Parse ReceivedDate to ISO format
- Standardize FilingStatus values
- Extract company type/category
- Convert any numeric fields to proper types
- Add days_since_received calculation`;

    case FliorDataType.RECEIVERSHIP:
      return `
- Parse DateReceived to ISO format
- Standardize Status values (active/inactive/resolved)
- Extract company type from name
- Add urgency_level based on status and date`;

    case FliorDataType.NEWS_BULLETINS:
      return `
- Parse Published to ISO date format
- Extract news category from title/content
- Add urgency based on keywords (urgent/normal/informational)
- Standardize title formatting`;

    default:
      return `
- Convert dates to ISO format
- Convert numbers to appropriate types
- Standardize categorical values
- Remove extra whitespace and formatting`;
  }
}

function basicNormalization(
  dataType: FliorDataType,
  rawData: any,
): Record<string, any> {
  const normalized: Record<string, any> = { ...rawData };

  // Remove internal fields
  Object.keys(normalized).forEach((key) => {
    if (key.startsWith("_")) {
      delete normalized[key];
    }
  });

  // Basic type conversions
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (typeof value === "string") {
      // Try to convert obvious numbers
      if (/^\d+$/.test(value.trim())) {
        normalized[key] = parseInt(value);
      } else if (/^\d+\.\d+$/.test(value.trim())) {
        normalized[key] = parseFloat(value);
      } else if (value.includes("$")) {
        // Try to extract dollar amounts
        const amount = value.replace(/[$,]/g, "").match(/[\d.]+/);
        if (amount) {
          normalized[key] = parseFloat(amount[0]);
        }
      }
    }
  });

  normalized._data_type = dataType;
  normalized._normalized_at = new Date().toISOString();
  normalized._fallback_normalization = true;

  return normalized;
}

function extractContentForEmbedding(
  dataType: FliorDataType,
  normalized: any,
): string {
  // Create a searchable text representation for embedding
  const contentParts: string[] = [];

  // Add data type context
  contentParts.push(
    `Florida Insurance Regulation ${dataType.replace("_", " ")} data:`,
  );

  // Extract key text fields based on data type
  switch (dataType) {
    case FliorDataType.CATASTROPHE:
      contentParts.push(`Event: ${normalized.Event || ""}`);
      contentParts.push(`Claims: ${normalized.Claims || ""}`);
      contentParts.push(`Losses: ${normalized.Losses || ""}`);
      break;

    case FliorDataType.INDUSTRY_REPORTS:
      contentParts.push(`Year: ${normalized.Year || ""}`);
      contentParts.push(`Report: ${normalized.Title || ""}`);
      break;

    case FliorDataType.PROFESSIONAL_LIABILITY:
      contentParts.push(`Case: ${normalized.CaseNo || ""}`);
      contentParts.push(`Paid: ${normalized.Paid || ""}`);
      break;

    case FliorDataType.RATE_FILINGS:
      contentParts.push(
        `Company: ${normalized.CompanyName || normalized.Company || ""}`,
      );
      contentParts.push(
        `Filing ID: ${normalized.FilingId || normalized.FileLogNumber || ""}`,
      );
      contentParts.push(
        `Status: ${normalized.FilingStatus || normalized.Status || ""}`,
      );
      break;

    case FliorDataType.NEWS_BULLETINS:
      contentParts.push(`Title: ${normalized.Title || ""}`);
      contentParts.push(`Summary: ${normalized.Summary || ""}`);
      break;

    default:
      // Generic extraction for other types
      Object.entries(normalized).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          value.length > 0 &&
          !key.startsWith("_")
        ) {
          contentParts.push(`${key}: ${value}`);
        }
      });
  }

  return contentParts.join(" ").trim();
}
