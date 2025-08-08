import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force Node.js runtime to avoid Edge warnings with Supabase
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return NextResponse.json({ 
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null, 
      error: error?.message ?? null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ 
      user: null, 
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}