import { createServerClient } from "@/lib/supabase/client";

export interface LogEntry {
  input_text: string;
  output_data: unknown;
  action_type: "harvest_analyze" | "chat" | "daily_summary" | "draft_email" | "draft_notification" | "stock_check" | "anomaly_check" | "weekly_insight";
  created_by?: string;
}

export async function logAI(entry: LogEntry): Promise<void> {
  const record = {
    action_type: entry.action_type,
    input_text: entry.input_text,
    output_data: entry.output_data,
    status: "success",
    created_at: new Date().toISOString(),
  };

  const supabase = createServerClient();
  const { error } = await supabase.from("ai_logs").insert(record);

  if (error) {
    console.error("[AI_LOG_ERROR]", error.message);
    console.log("[AI_LOG_FALLBACK]", JSON.stringify(record, null, 2));
  }
}
