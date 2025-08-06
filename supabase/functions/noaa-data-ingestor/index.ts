import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/**
 * @fileMetadata
 * @purpose Supabase Edge Function to trigger the NOAA data ingestion process.
 * @owner team-data-eng
 * @status active
 */

Deno.serve(async (req: Request) => {
  console.log("NOAA Ingestion trigger function invoked.");

  // TODO:
  // 1. Add authentication (e.g., check for a secret from the request).
  // 2. Publish a job to a message queue (e.g., RabbitMQ, Supabase PGQ)
  //    that the `noaa-data-ingestor` service is listening to.
  // 3. This keeps the function lightweight and separates concerns.

  const response = {
    message: "NOAA ingestion process triggered successfully.",
    // In a real implementation, you might include a job ID here.
  };

  return new Response(
    JSON.stringify(response),
    { headers: { "Content-Type": "application/json" } },
  )
})
