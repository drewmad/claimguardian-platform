/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
export interface PromptTemplate {
  id: string;
  description: string;
  version: string;
  template: string;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // Inventory & Asset Analysis
  quickInventoryScan: {
    id: "quickInventoryScan",
    description:
      "Analyzes one or more images to identify multiple items in bulk.",
    version: "1.0",
    template: `From the provided image(s), identify all distinct personal property items. For each item, provide its name, a suitable category, an estimated value, a brief description, and your confidence score from 0.0 to 1.0. Return this as a JSON array.`,
  },
  detailedItemAnalysis: {
    id: "detailedItemAnalysis",
    description:
      "Analyzes multiple images of a single item for a detailed record.",
    version: "1.0",
    template: `Using all the provided images of a single item ({itemName}), create a comprehensive insurance-grade inventory record. Extract all details like brand, model, serial number, condition, estimated value, and write a detailed description.`,
  },
  guidedInventoryFrame: {
    id: "guidedInventoryFrame",
    description:
      "Provides real-time guidance during a live video scan of an item.",
    version: "1.0",
    template: `You are an insurance AI guiding a user. Analyze the image. If a clear object is presented, provide instruction for the next angle (e.g., 'Great, now show me the back'). If ready for a photo, set isReadyToCapture to true and provide a unique shotIdentifier (e.g., 'front_view'). After 3-5 good shots, set shotIdentifier to 'done'. If no object is clear, instruct "Please present one item clearly".`,
  },
  simpleItemScan: {
    id: "simpleItemScan",
    description: "A simpler, faster scan for a single item from one photo.",
    version: "1.0",
    template: `Analyze the attached image. Identify the main personal property item. Provide its name, a suggested category (e.g., Electronics, Furniture, Appliance), an estimated replacement value as a number, a detailed description including brand, model, and key visual features, and a serial number if visible.`,
  },

  // Construction & Damage Analysis
  materialAnalysis: {
    id: "materialAnalysis",
    description: "Identifies a construction material from a close-up image.",
    version: "1.0",
    template: `Analyze the provided image of a construction material. Identify its specific name and classify it into one of the given types.`,
  },
  damageAssessment: {
    id: "damageAssessment",
    description:
      "Analyzes damage to property from images for insurance claims.",
    version: "1.0",
    template: `Analyze the provided image(s) for visible damage. Identify the type of damage (water, wind, fire, etc.), estimate the severity (minor, moderate, severe), describe the affected area and materials, and provide repair recommendations.`,
  },

  // Document Processing
  documentSorter: {
    id: "documentSorter",
    description:
      "Classifies a document and extracts key information (e.g., warranty details).",
    version: "1.0",
    template: `Analyze the document in the image. Determine its type (e.g., Warranty, Receipt, Policy). If it's a warranty, extract the provider, expiration date, and a summary of the details.`,
  },
  policyOcr: {
    id: "policyOcr",
    description:
      "Extracts key fields from an insurance declarations page image.",
    version: "1.0",
    template: `From the attached image of an insurance policy declarations page, perform OCR and extract the required fields.`,
  },

  // Claim Analysis
  settlementAnalysis: {
    id: "settlementAnalysis",
    description:
      "Compares an insurance settlement offer against the user's claim data.",
    version: "1.0",
    template: `
      You are an expert public adjuster AI. Your task is to analyze the provided insurance settlement offer against the user's documented claim data.
      Provide a detailed, structured analysis in JSON format based on the provided schema.

      CONTEXT:
      - **Settlement Offer Text**: """{offerText}"""
      - **User's Claim Data**: {claimJson}
      - **Affected Asset Data**: {assetJson}
      - **Applicable Policy**: {policyJson}

      INSTRUCTIONS:
      1. Parse the settlement offer to identify line items and amounts.
      2. Compare each offer item to the user's claim evidence and inventory.
      3. Identify any omissions (items in claim but not in offer) or significant under-evaluations.
      4. Consider the quality of materials from the user's data (e.g., 'Quartz Countertop' vs. a generic countertop allowance).
      5. Formulate a clear summary, a detailed comparison, and actionable recommendations for the user.
      6. Return the analysis as a valid JSON object adhering to the schema.
    `,
  },
  claimNarrative: {
    id: "claimNarrative",
    description: "Generates a comprehensive narrative for an insurance claim.",
    version: "1.0",
    template: `Based on the provided claim data, generate a professional insurance claim narrative that includes: the date and cause of loss, detailed description of damages, affected property areas, immediate actions taken, and current status of the property.`,
  },

  // Maintenance & Recommendations
  maintenanceSuggestions: {
    id: "maintenanceSuggestions",
    description:
      "Generates maintenance suggestions for a specific home system.",
    version: "1.0",
    template: `Given this home system: {systemJson}, generate a list of 3 relevant maintenance suggestions suitable for Florida.`,
  },

  // Communication Assistance
  emailDraft: {
    id: "emailDraft",
    description: "Drafts professional emails for insurance communication.",
    version: "1.0",
    template: `Draft a professional email to {recipient} regarding {subject}. Context: {context}. Tone should be {tone}. Include relevant claim details and maintain a clear call to action.`,
  },
  responseAnalysis: {
    id: "responseAnalysis",
    description:
      "Analyzes insurance company responses for key points and red flags.",
    version: "1.0",
    template: `Analyze this insurance company communication: {message}. Identify key points, commitments made, potential red flags, and recommended actions for the policyholder.`,
  },
};
