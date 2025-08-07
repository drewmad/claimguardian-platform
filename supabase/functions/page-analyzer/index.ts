import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PageAnalysisRequest {
  url: string;
  analysisType: "comprehensive" | "seo" | "accessibility" | "performance";
  userId?: string;
}

interface PageAnalysisResult {
  seo: {
    score: number;
    title: string;
    description: string;
    headings: { h1: number; h2: number; h3: number };
    keywords: string[];
    issues: string[];
    recommendations: string[];
  };
  accessibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  performance: {
    score: number;
    loadTime: number;
    pageSize: string;
    issues: string[];
    recommendations: string[];
  };
  content: {
    wordCount: number;
    readabilityScore: number;
    language: string;
    summary: string;
    mainTopics: string[];
  };
  insurance?: {
    relevantTopics: string[];
    insuranceTerms: string[];
    claimRelated: boolean;
  };
}

interface PageAnalysisResponse {
  success: boolean;
  analysis?: PageAnalysisResult;
  abTestInfo?: {
    testId: string;
    variant: "A" | "B";
    modelUsed: string;
  };
  error?: string;
  processingTime?: number;
}

// Initialize AI clients
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "");

// Helper function to fetch page content
async function fetchPageContent(
  url: string,
): Promise<{ html: string; metadata: any }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ClaimGuardian-PageAnalyzer/1.0 (compatible; bot)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    const html = await response.text();

    // Basic metadata extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    );

    return {
      html,
      metadata: {
        url,
        title: titleMatch?.[1] || "",
        description: descriptionMatch?.[1] || "",
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching page:", error);
    throw new Error(`Failed to fetch page content: ${error.message}`);
  }
}

// Helper function to extract text content from HTML
function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Helper function to analyze page with AI
async function analyzePageWithAI(
  content: { html: string; metadata: any; text: string },
  analysisType: string,
): Promise<PageAnalysisResult> {
  const prompt = `
You are an expert web analyst. Analyze the following webpage content and provide a comprehensive analysis.

URL: ${content.metadata.url}
Page Title: ${content.metadata.title}
Meta Description: ${content.metadata.description}

Content (first 5000 characters):
${content.text.substring(0, 5000)}

HTML Structure (first 3000 characters):
${content.html.substring(0, 3000)}

Provide a ${analysisType} analysis with the following structure:

{
  "seo": {
    "score": [0-100 score],
    "title": "[extracted title]",
    "description": "[extracted meta description]",
    "headings": { "h1": [count], "h2": [count], "h3": [count] },
    "keywords": ["top", "5", "keywords"],
    "issues": ["list", "of", "seo", "issues"],
    "recommendations": ["actionable", "seo", "improvements"]
  },
  "accessibility": {
    "score": [0-100 score],
    "issues": ["accessibility", "problems"],
    "recommendations": ["accessibility", "fixes"]
  },
  "performance": {
    "score": [0-100 score],
    "loadTime": [estimated seconds],
    "pageSize": "[estimated size like '1.2MB']",
    "issues": ["performance", "issues"],
    "recommendations": ["performance", "improvements"]
  },
  "content": {
    "wordCount": [number],
    "readabilityScore": [0-100],
    "language": "[detected language]",
    "summary": "[2-3 sentence summary]",
    "mainTopics": ["main", "content", "topics"]
  },
  "insurance": {
    "relevantTopics": ["insurance", "related", "topics"],
    "insuranceTerms": ["found", "insurance", "terms"],
    "claimRelated": [true/false]
  }
}

Focus on ${analysisType === "comprehensive" ? "all aspects" : analysisType} but provide complete data.
Return ONLY valid JSON, no additional text.`;

  try {
    // Use OpenAI by default, with Gemini as fallback
    let result: string;

    if (OPENAI_API_KEY) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are a web analysis expert. Always respond with valid JSON only.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      result = data.choices[0].message.content;
    } else if (GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const geminiResult = await model.generateContent(prompt);
      result = geminiResult.response.text();
    } else {
      // Mock analysis for demo purposes
      return {
        seo: {
          score: 85,
          title: content.metadata.title || "No title found",
          description: content.metadata.description || "No description found",
          headings: { h1: 1, h2: 5, h3: 10 },
          keywords: ["insurance", "claims", "property", "florida", "coverage"],
          issues: ["Missing alt text on images", "No schema markup detected"],
          recommendations: [
            "Add schema markup",
            "Optimize images",
            "Improve meta descriptions",
          ],
        },
        accessibility: {
          score: 78,
          issues: ["Low contrast text detected", "Missing ARIA labels"],
          recommendations: [
            "Increase text contrast",
            "Add ARIA labels to interactive elements",
          ],
        },
        performance: {
          score: 72,
          loadTime: 3.2,
          pageSize: "2.1MB",
          issues: ["Large image files", "No lazy loading detected"],
          recommendations: [
            "Compress images",
            "Implement lazy loading",
            "Enable caching",
          ],
        },
        content: {
          wordCount: Math.floor(content.text.length / 5),
          readabilityScore: 82,
          language: "en",
          summary:
            "This webpage provides information about insurance claims and property damage assessment.",
          mainTopics: [
            "Insurance",
            "Claims",
            "Property Damage",
            "Florida",
            "Hurricane",
          ],
        },
        insurance: {
          relevantTopics: [
            "Property Insurance",
            "Claim Filing",
            "Damage Assessment",
          ],
          insuranceTerms: [
            "deductible",
            "coverage",
            "claim",
            "policy",
            "premium",
          ],
          claimRelated: true,
        },
      };
    }

    // Parse the AI response
    try {
      return JSON.parse(result);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// Helper function to track usage
async function trackUsage(
  userId: string | undefined,
  url: string,
  analysisType: string,
  success: boolean,
  processingTime: number,
) {
  try {
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      feature_id: "page-analyzer",
      operation_type: analysisType,
      metadata: {
        url,
        success,
        processingTime,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track usage:", error);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body: PageAnalysisRequest = await req.json();

    // Validate URL
    if (!body.url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`Analyzing page: ${body.url} (type: ${body.analysisType})`);

    // Fetch page content
    const pageContent = await fetchPageContent(body.url);

    // Extract text content
    const textContent = extractTextContent(pageContent.html);

    // Analyze with AI
    const analysis = await analyzePageWithAI(
      { ...pageContent, text: textContent },
      body.analysisType,
    );

    const processingTime = Date.now() - startTime;

    // Track usage
    await trackUsage(
      body.userId,
      body.url,
      body.analysisType,
      true,
      processingTime,
    );

    // Prepare response
    const response: PageAnalysisResponse = {
      success: true,
      analysis,
      processingTime,
      abTestInfo: {
        testId: `test_${Date.now()}`,
        variant: Math.random() > 0.5 ? "A" : "B",
        modelUsed: OPENAI_API_KEY ? "gpt-4-turbo" : "gemini-1.5-flash",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Page analysis error:", error);

    const processingTime = Date.now() - startTime;

    // Track failed usage
    await trackUsage(undefined, "", "error", false, processingTime);

    const errorResponse: PageAnalysisResponse = {
      success: false,
      error: error.message || "Internal server error",
      processingTime,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
