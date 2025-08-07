import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// =====================================================
// SECURE EDGE FUNCTION TEMPLATE
// Use this template for all new Edge Functions
// =====================================================

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://claimguardianai.com",
  "https://app.claimguardianai.com",
  "http://localhost:3000", // Development only
];

// Input validation schema
const RequestSchema = z.object({
  // Define your request structure with validation
  resourceId: z.string().uuid(),
  action: z.enum(["create", "read", "update", "delete"]),
  data: z.record(z.unknown()).optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// Response schema
const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  requestId: z.string().uuid(),
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Security headers
function getSecurityHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'",
  };

  // Validate origin for CORS
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  headers["Access-Control-Allow-Headers"] =
    "authorization, x-client-info, apikey, content-type";
  headers["Access-Control-Max-Age"] = "86400"; // 24 hours

  return headers;
}

// Secure logging function (redacts sensitive data)
function logSecure(
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>,
  requestId?: string,
) {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId,
      function: "secure-edge-function",
      data: sanitizedData,
    }),
  );
}

// Sanitize data for logging
function sanitizeLogData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sensitive = [
    "password",
    "token",
    "apiKey",
    "ssn",
    "email",
    "phone",
    "creditCard",
  ];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Rate limiting check
async function checkRateLimit(
  supabase: any,
  userId: string,
  functionName: string,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Get current request count
  const { data: limits, error } = await supabase
    .from("api_rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .gte("window_start", windowStart.toISOString())
    .single();

  if (error && error.code !== "PGRST116") {
    // Not found is ok
    logSecure("error", "Rate limit check failed", { error: error.message });
    return false; // Fail closed
  }

  const currentCount = limits?.request_count || 0;

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Update or insert rate limit record
  await supabase.from("api_rate_limits").upsert(
    {
      user_id: userId,
      function_name: functionName,
      request_count: currentCount + 1,
      window_start: windowStart.toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,function_name,window_start",
    },
  );

  return true;
}

// Verify resource ownership
async function verifyResourceOwnership(
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(resourceType)
    .select("id")
    .eq("id", resourceId)
    .eq("user_id", userId)
    .single();

  return !error && data !== null;
}

// Audit data access
async function auditDataAccess(
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  ipAddress?: string,
) {
  await supabase.from("data_access_audit").insert({
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    ip_address: ipAddress,
  });
}

// Main handler
Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const origin = req.headers.get("origin");
  const headers = getSecurityHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
        requestId,
      }),
      { status: 405, headers },
    );
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logSecure("warn", "Missing authorization header", {}, requestId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
          requestId,
        }),
        { status: 401, headers },
      );
    }

    // Validate token and get user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logSecure(
        "warn",
        "Invalid authentication",
        { error: authError?.message },
        requestId,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid authentication",
          requestId,
        }),
        { status: 401, headers },
      );
    }

    logSecure("info", "Request authenticated", { userId: user.id }, requestId);

    // Check rate limiting
    const rateLimitOk = await checkRateLimit(
      supabase,
      user.id,
      "secure-edge-function",
    );
    if (!rateLimitOk) {
      logSecure("warn", "Rate limit exceeded", { userId: user.id }, requestId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded",
          requestId,
        }),
        { status: 429, headers },
      );
    }

    // Parse and validate request body
    let body: RequestBody;
    try {
      const rawBody = await req.json();
      body = RequestSchema.parse(rawBody);
    } catch (error) {
      logSecure(
        "warn",
        "Invalid request body",
        { error: error.message },
        requestId,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format",
          requestId,
        }),
        { status: 400, headers },
      );
    }

    // Verify resource ownership
    const hasAccess = await verifyResourceOwnership(
      supabase,
      user.id,
      "properties", // Change to your resource type
      body.resourceId,
    );

    if (!hasAccess) {
      logSecure(
        "warn",
        "Access denied",
        {
          userId: user.id,
          resourceId: body.resourceId,
        },
        requestId,
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: "Access denied",
          requestId,
        }),
        { status: 403, headers },
      );
    }

    // Get client IP for audit
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      undefined;

    // Audit the access
    await auditDataAccess(
      supabase,
      user.id,
      "properties",
      body.resourceId,
      body.action,
      ipAddress,
    );

    // =====================================================
    // YOUR BUSINESS LOGIC HERE
    // =====================================================

    // Example: Process the request
    const result = await processRequest(body, user.id, supabase);

    // =====================================================
    // END BUSINESS LOGIC
    // =====================================================

    logSecure(
      "info",
      "Request completed successfully",
      {
        userId: user.id,
        action: body.action,
      },
      requestId,
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        requestId,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    logSecure(
      "error",
      "Unexpected error",
      {
        error: error.message,
        stack:
          Deno.env.get("ENVIRONMENT") === "development"
            ? error.stack
            : undefined,
      },
      requestId,
    );

    // Return generic error (don't expose internals)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        requestId,
      }),
      { status: 500, headers },
    );
  }
});

// =====================================================
// BUSINESS LOGIC FUNCTIONS
// =====================================================

async function processRequest(
  body: RequestBody,
  userId: string,
  supabase: any,
): Promise<any> {
  // Implement your business logic here
  // This is just an example

  switch (body.action) {
    case "create":
      return await createResource(body.data, userId, supabase);
    case "read":
      return await readResource(body.resourceId, supabase);
    case "update":
      return await updateResource(body.resourceId, body.data, supabase);
    case "delete":
      return await deleteResource(body.resourceId, supabase);
    default:
      throw new Error("Invalid action");
  }
}

async function createResource(data: any, userId: string, supabase: any) {
  // Example implementation
  const { data: resource, error } = await supabase
    .from("resources")
    .insert({
      ...data,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return resource;
}

async function readResource(resourceId: string, supabase: any) {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();

  if (error) throw error;
  return data;
}

async function updateResource(resourceId: string, updates: any, supabase: any) {
  const { data, error } = await supabase
    .from("resources")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteResource(resourceId: string, supabase: any) {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

  if (error) throw error;
  return { deleted: true };
}
