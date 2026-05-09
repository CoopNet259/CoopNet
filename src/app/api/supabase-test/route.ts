import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("products").select("*").limit(5);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connected: true, products: data });
}
