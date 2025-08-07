import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    // Create admin client with service role key
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

    // Create demo user
    const { data: user, error: userError } =
      await supabase.auth.admin.createUser({
        email: "demo@claimguardian.com",
        password: "DemoPass123!",
        email_confirm: true,
        user_metadata: {
          firstName: "Demo",
          lastName: "User",
        },
      });

    if (userError) {
      console.log(
        JSON.stringify({
          level: "error",
          timestamp: new Date().toISOString(),
          message: "User creation error:",
          userError,
        }),
      );
      return new Response(
        JSON.stringify({
          error: userError.message,
          details: userError,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.user.id,
      full_name: "Demo User",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.log(
        JSON.stringify({
          level: "error",
          timestamp: new Date().toISOString(),
          message: "Profile creation error:",
          profileError,
        }),
      );
    }

    // Create user_profiles entry
    const { error: userProfileError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.user.id,
        created_at: new Date().toISOString(),
        account_status: "active",
        account_type: "demo",
      });

    if (userProfileError) {
      console.log(
        JSON.stringify({
          level: "error",
          timestamp: new Date().toISOString(),
          message: "User profile creation error:",
          userProfileError,
        }),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo user created successfully",
        email: "demo@claimguardian.com",
        password: "DemoPass123!",
        userId: user.user.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message: "Error:",
        error,
      }),
    );
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
