/**
 * AI Communication Helper Service
 * Advanced AI-powered assistance for writing professional insurance communications
 * Replaces mock implementations with real AI-generated content
 */

import { enhancedAIClient } from "@/lib/ai/enhanced-client";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger/production-logger";
import { toError } from "@claimguardian/utils";

export interface CommunicationRequest {
  type: "email" | "letter" | "appeal" | "followup" | "demand" | "negotiation";
  recipient:
    | "adjuster"
    | "carrier"
    | "agent"
    | "contractor"
    | "lawyer"
    | "other";
  purpose: string;
  context: {
    claimNumber?: string;
    policyNumber?: string;
    damageType?: string;
    estimatedAmount?: number;
    currentOffer?: number;
    timesSent?: number;
    previousResponse?: string;
    urgency: "low" | "medium" | "high" | "urgent";
  };
  tone:
    | "professional"
    | "firm"
    | "friendly"
    | "formal"
    | "urgent"
    | "diplomatic";
  keyPoints: string[];
  attachments?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface GeneratedCommunication {
  subject: string;
  content: string;
  tone: string;
  keyStrategies: string[];
  followupSuggestions: string[];
  legalConsiderations: string[];
  timing: {
    bestTimeToSend: string;
    followupIn: string;
    escalationTimeline: string;
  };
  templates: {
    email: string;
    letter: string;
    shortForm: string;
  };
  negotiationTips: string[];
}

export interface NegotiationStrategy {
  approach:
    | "collaborative"
    | "assertive"
    | "evidence-based"
    | "deadline-driven";
  tactics: string[];
  concessionPoints: Array<{
    item: string;
    importance: "high" | "medium" | "low";
    fallbackPosition: string;
  }>;
  walkAwayPoint: string;
  strongestArguments: string[];
  anticipatedObjections: Array<{
    objection: string;
    response: string;
  }>;
}

export class AICommunicationHelper {
  private supabase = createClient();

  /**
   * Generate professional insurance communication
   */
  async generateCommunication(request: CommunicationRequest): Promise<{
    success: boolean;
    communication?: GeneratedCommunication;
    error?: string;
  }> {
    try {
      logger.info("Generating AI communication", {
        type: request.type,
        recipient: request.recipient,
        urgency: request.context.urgency,
      });

      // Get communication templates and best practices
      const templates = await this.getCommunicationTemplates(
        request.type,
        request.recipient,
      );

      // Generate personalized content using AI
      const aiGenerated = await this.generateWithAI(request, templates);

      // Add negotiation insights if applicable
      const negotiationTips =
        request.type === "negotiation" || request.context.currentOffer
          ? await this.generateNegotiationTips(request)
          : [];

      // Calculate optimal timing
      const timing = await this.calculateOptimalTiming(request);

      const communication: GeneratedCommunication = {
        subject: aiGenerated.subject,
        content: aiGenerated.content,
        tone: request.tone,
        keyStrategies: aiGenerated.strategies,
        followupSuggestions: aiGenerated.followups,
        legalConsiderations: aiGenerated.legalNotes,
        timing,
        templates: {
          email: aiGenerated.emailVersion,
          letter: aiGenerated.letterVersion,
          shortForm: aiGenerated.shortVersion,
        },
        negotiationTips,
      };

      // Store communication for analytics and learning
      await this.storeCommunication(request, communication);

      return { success: true, communication };
    } catch (error) {
      const err = toError(error);
      logger.error("Communication generation failed", { error: err, request });
      return { success: false, error: err.message };
    }
  }

  /**
   * Analyze received response and suggest reply strategy
   */
  async analyzeResponseAndSuggestReply(
    originalMessage: string,
    receivedResponse: string,
    communicationContext: Partial<CommunicationRequest>,
  ): Promise<{
    analysis: {
      sentiment: "positive" | "negative" | "neutral";
      tone: string;
      keyPoints: string[];
      concerns: string[];
      opportunities: string[];
    };
    suggestedReply: {
      strategy: string;
      keyMessages: string[];
      draftContent: string;
      urgency: "immediate" | "within_24h" | "within_week" | "no_rush";
    };
    nextSteps: string[];
  }> {
    try {
      const analysisPrompt = `Analyze this insurance communication response and provide strategic reply guidance:

ORIGINAL MESSAGE CONTEXT:
${originalMessage.substring(0, 500)}...

RECEIVED RESPONSE:
${receivedResponse}

CONTEXT:
- Claim Number: ${communicationContext.context?.claimNumber || "Unknown"}
- Damage Type: ${communicationContext.context?.damageType || "Unknown"}
- Current Offer: ${communicationContext.context?.currentOffer ? `$${communicationContext.context.currentOffer.toLocaleString()}` : "None"}
- Estimated Amount: ${communicationContext.context?.estimatedAmount ? `$${communicationContext.context.estimatedAmount.toLocaleString()}` : "Unknown"}

Provide analysis in JSON format:
{
  "analysis": {
    "sentiment": "positive|negative|neutral",
    "tone": "description of tone",
    "keyPoints": ["main points from response"],
    "concerns": ["red flags or concerning elements"],
    "opportunities": ["positive opportunities identified"]
  },
  "suggestedReply": {
    "strategy": "recommended approach",
    "keyMessages": ["key points to emphasize in reply"],
    "draftContent": "suggested reply content",
    "urgency": "immediate|within_24h|within_week|no_rush"
  },
  "nextSteps": ["recommended next actions"]
}`;

      const response = await enhancedAIClient.enhancedChat({
        messages: [
          {
            role: "system",
            content:
              "You are a Florida property insurance claims expert specializing in communication strategy and negotiation.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        featureId: "response-analysis",
      });

      return JSON.parse(response);
    } catch (error) {
      logger.error("Response analysis failed", { error: toError(error) });

      // Fallback analysis
      return {
        analysis: {
          sentiment: "neutral",
          tone: "Unable to analyze",
          keyPoints: ["Analysis unavailable"],
          concerns: ["Manual review recommended"],
          opportunities: ["Consult with professional"],
        },
        suggestedReply: {
          strategy: "Follow up professionally",
          keyMessages: [
            "Acknowledge receipt",
            "Request clarification if needed",
          ],
          draftContent:
            "Thank you for your response. We will review and follow up accordingly.",
          urgency: "within_24h",
        },
        nextSteps: [
          "Review response manually",
          "Consider professional consultation",
        ],
      };
    }
  }

  /**
   * Generate negotiation strategy
   */
  async generateNegotiationStrategy(claimDetails: {
    estimatedDamage: number;
    currentOffer: number;
    damageType: string;
    evidenceStrength: "weak" | "moderate" | "strong";
    timelineUrgency: "low" | "medium" | "high";
  }): Promise<NegotiationStrategy> {
    try {
      const strategyPrompt = `Create a comprehensive negotiation strategy for this Florida property insurance claim:

CLAIM DETAILS:
- Estimated Damage: $${claimDetails.estimatedDamage.toLocaleString()}
- Current Offer: $${claimDetails.currentOffer.toLocaleString()}
- Damage Type: ${claimDetails.damageType}
- Evidence Strength: ${claimDetails.evidenceStrength}
- Timeline Urgency: ${claimDetails.timelineUrgency}
- Gap: $${(claimDetails.estimatedDamage - claimDetails.currentOffer).toLocaleString()}

Provide strategy in JSON format:
{
  "approach": "collaborative|assertive|evidence-based|deadline-driven",
  "tactics": ["specific negotiation tactics"],
  "concessionPoints": [
    {"item": "concession item", "importance": "high|medium|low", "fallbackPosition": "fallback"}
  ],
  "walkAwayPoint": "minimum acceptable settlement",
  "strongestArguments": ["most compelling arguments"],
  "anticipatedObjections": [
    {"objection": "expected objection", "response": "prepared response"}
  ]
}`;

      const response = await enhancedAIClient.enhancedChat({
        messages: [
          {
            role: "system",
            content:
              "You are an expert insurance claim negotiator with 20+ years of experience in Florida property claims.",
          },
          {
            role: "user",
            content: strategyPrompt,
          },
        ],
        featureId: "negotiation-strategy",
      });

      return JSON.parse(response);
    } catch (error) {
      logger.error("Negotiation strategy generation failed", { error: toError(error) });

      // Fallback strategy
      const gap = claimDetails.estimatedDamage - claimDetails.currentOffer;
      const gapPercentage = (gap / claimDetails.estimatedDamage) * 100;

      return {
        approach: gapPercentage > 50 ? "evidence-based" : "collaborative",
        tactics: [
          "Present additional evidence",
          "Reference comparable settlements",
          "Highlight policy coverage",
        ],
        concessionPoints: [
          {
            item: "Timeline flexibility",
            importance: "low",
            fallbackPosition: "Accept reasonable timeline adjustments",
          },
        ],
        walkAwayPoint: `Minimum $${Math.round(claimDetails.estimatedDamage * 0.7).toLocaleString()}`,
        strongestArguments: [
          "Policy coverage supports higher settlement",
          "Evidence demonstrates full extent of damage",
        ],
        anticipatedObjections: [
          {
            objection: "Estimate seems high",
            response:
              "Provide independent contractor quotes and market rate documentation",
          },
        ],
      };
    }
  }

  /**
   * Generate templates for different communication types
   */
  private async getCommunicationTemplates(
    type: string,
    recipient: string,
  ): Promise<{
    structure: string[];
    keyPhrases: string[];
    legalConsiderations: string[];
    bestPractices: string[];
  }> {
    try {
      const { data: templates, error } = await this.supabase
        .from("communication_templates")
        .select("template_data")
        .eq("communication_type", type)
        .eq("recipient_type", recipient)
        .single();

      if (!error && templates?.template_data) {
        return templates.template_data;
      }
    } catch (error) {
      logger.warn("Failed to fetch templates", { error: toError(error) });
    }

    // Fallback templates
    return {
      structure: [
        "Opening/Greeting",
        "Reference (claim/policy numbers)",
        "Main message/request",
        "Supporting evidence/reasoning",
        "Desired action/outcome",
        "Professional closing",
      ],
      keyPhrases: [
        "I am writing regarding...",
        "Please review the attached...",
        "I request your prompt attention to...",
        "Looking forward to your response",
      ],
      legalConsiderations: [
        "Document all communications",
        "Reference policy provisions when applicable",
        "Maintain professional tone",
        "Set reasonable deadlines",
      ],
      bestPractices: [
        "Be specific and factual",
        "Include relevant documentation",
        "Follow up appropriately",
        "Keep copies of all correspondence",
      ],
    };
  }

  /**
   * Generate communication with AI
   */
  private async generateWithAI(
    request: CommunicationRequest,
    templates: any,
  ): Promise<{
    subject: string;
    content: string;
    strategies: string[];
    followups: string[];
    legalNotes: string[];
    emailVersion: string;
    letterVersion: string;
    shortVersion: string;
  }> {
    const prompt = `Generate professional insurance communication for Florida property claim:

COMMUNICATION TYPE: ${request.type}
RECIPIENT: ${request.recipient}
PURPOSE: ${request.purpose}
TONE: ${request.tone}
URGENCY: ${request.context.urgency}

CONTEXT:
- Claim Number: ${request.context.claimNumber || "N/A"}
- Policy Number: ${request.context.policyNumber || "N/A"}
- Damage Type: ${request.context.damageType || "N/A"}
- Estimated Amount: ${request.context.estimatedAmount ? `$${request.context.estimatedAmount.toLocaleString()}` : "N/A"}
- Current Offer: ${request.context.currentOffer ? `$${request.context.currentOffer.toLocaleString()}` : "N/A"}
- Previous Attempts: ${request.context.timesSent || 0}

KEY POINTS TO INCLUDE:
${request.keyPoints.map((point) => `- ${point}`).join("\n")}

${
  request.attachments?.length
    ? `ATTACHMENTS REFERENCED:\n${request.attachments.map((att) => `- ${att.name}: ${att.description}`).join("\n")}`
    : ""
}

Generate comprehensive response in JSON format:
{
  "subject": "email subject line",
  "content": "main communication content (email/letter body)",
  "strategies": ["key communication strategies used"],
  "followups": ["suggested follow-up actions"],
  "legalNotes": ["important legal considerations"],
  "emailVersion": "formatted for email",
  "letterVersion": "formatted as formal letter",
  "shortVersion": "concise version for quick communication"
}`;

    const response = await enhancedAIClient.enhancedChat({
      messages: [
        {
          role: "system",
          content: `You are a Florida property insurance communication expert. Create professional, effective communications that:
          - Follow Florida insurance law and best practices
          - Are appropriate for the recipient and situation
          - Include proper legal language and documentation references
          - Maintain the requested tone while being effective
          - Include strategic elements for successful claim resolution`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      featureId: "communication-generation",
    });

    return JSON.parse(response);
  }

  /**
   * Generate negotiation tips
   */
  private async generateNegotiationTips(
    request: CommunicationRequest,
  ): Promise<string[]> {
    if (!request.context.currentOffer || !request.context.estimatedAmount) {
      return [
        "Gather all supporting documentation",
        "Research comparable settlements in your area",
        "Consider consulting with a public adjuster",
      ];
    }

    try {
      const gap =
        request.context.estimatedAmount - request.context.currentOffer;
      const gapPercentage = (gap / request.context.estimatedAmount) * 100;

      const tips = [
        `Current gap: $${gap.toLocaleString()} (${gapPercentage.toFixed(1)}%)`,
        gapPercentage > 30
          ? "Significant gap suggests need for strong evidence"
          : "Reasonable starting point for negotiation",
        "Document all damage with professional photos",
        "Get multiple contractor estimates",
        "Reference similar settled claims in your area",
        "Know your policy coverage limits and exclusions",
        "Set reasonable deadlines for responses",
        "Consider escalation timeline if no progress",
      ];

      return tips;
    } catch (error) {
      return ["Negotiation analysis unavailable - consult with professional"];
    }
  }

  /**
   * Calculate optimal timing for communication
   */
  private async calculateOptimalTiming(
    request: CommunicationRequest,
  ): Promise<GeneratedCommunication["timing"]> {
    const urgencyMap = {
      urgent: {
        bestTimeToSend: "Immediately (business hours)",
        followupIn: "24-48 hours",
        escalationTimeline: "3-5 business days",
      },
      high: {
        bestTimeToSend: "Next business day morning",
        followupIn: "3-5 business days",
        escalationTimeline: "1-2 weeks",
      },
      medium: {
        bestTimeToSend: "Within 2-3 business days",
        followupIn: "1 week",
        escalationTimeline: "2-3 weeks",
      },
      low: {
        bestTimeToSend: "Within 1 week",
        followupIn: "2 weeks",
        escalationTimeline: "1 month",
      },
    };

    return urgencyMap[request.context.urgency] || urgencyMap.medium;
  }

  /**
   * Store communication for analytics
   */
  private async storeCommunication(
    request: CommunicationRequest,
    communication: GeneratedCommunication,
  ): Promise<void> {
    try {
      await this.supabase.from("ai_communications").insert({
        communication_type: request.type,
        recipient_type: request.recipient,
        purpose: request.purpose,
        tone: request.tone,
        urgency: request.context.urgency,
        generated_content: communication,
        context_data: request.context,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn("Failed to store communication", { error: toError(error) });
    }
  }

  /**
   * Get communication history and analytics
   */
  async getCommunicationInsights(claimId?: string): Promise<{
    totalCommunications: number;
    responseRates: Record<string, number>;
    avgResponseTime: number;
    successfulStrategies: string[];
    improvementSuggestions: string[];
  }> {
    try {
      let query = this.supabase
        .from("ai_communications")
        .select("*")
        .order("created_at", { ascending: false });

      if (claimId) {
        query = query.eq("context_data->>claimNumber", claimId);
      }

      const { data: communications, error } = await query.limit(100);

      if (error) throw error;

      // Analyze communication patterns
      const totalCommunications = communications?.length || 0;
      const responseRates = this.calculateResponseRates(communications || []);
      const avgResponseTime = this.calculateAvgResponseTime(
        communications || [],
      );
      const successfulStrategies = this.identifySuccessfulStrategies(
        communications || [],
      );

      return {
        totalCommunications,
        responseRates,
        avgResponseTime,
        successfulStrategies,
        improvementSuggestions: [
          "Follow up within recommended timeframes",
          "Use evidence-based arguments for higher success rates",
          "Maintain professional tone even in difficult negotiations",
        ],
      };
    } catch (error) {
      logger.error("Failed to get communication insights", { error: toError(error) });
      return {
        totalCommunications: 0,
        responseRates: {},
        avgResponseTime: 0,
        successfulStrategies: [],
        improvementSuggestions: [],
      };
    }
  }

  private calculateResponseRates(
    communications: any[],
  ): Record<string, number> {
    const rates: Record<string, number> = {};
    const typeGroups = communications.reduce(
      (groups, comm) => {
        const type = comm.communication_type;
        groups[type] = groups[type] || [];
        groups[type].push(comm);
        return groups;
      },
      {} as Record<string, any[]>,
    );

    Object.entries(typeGroups).forEach(([type, comms]) => {
      const responded = (comms as any[]).filter(
        (comm) => comm.received_response,
      ).length;
      rates[type] = responded / (comms as any[]).length;
    });

    return rates;
  }

  private calculateAvgResponseTime(communications: any[]): number {
    const responseTimes = communications
      .filter((comm) => comm.response_received_at && comm.created_at)
      .map((comm) => {
        const sent = new Date(comm.created_at).getTime();
        const received = new Date(comm.response_received_at).getTime();
        return (received - sent) / (1000 * 60 * 60); // Hours
      });

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
      : 0;
  }

  private identifySuccessfulStrategies(communications: any[]): string[] {
    // Analyze which communication strategies led to successful outcomes
    const successful = communications.filter(
      (comm) => comm.outcome_rating && comm.outcome_rating >= 4,
    );

    const strategies = new Map<string, number>();
    successful.forEach((comm) => {
      comm.generated_content?.keyStrategies?.forEach((strategy: string) => {
        strategies.set(strategy, (strategies.get(strategy) || 0) + 1);
      });
    });

    return Array.from(strategies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);
  }
}

// Export singleton instance
export const aiCommunicationHelper = new AICommunicationHelper();
