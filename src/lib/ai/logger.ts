export interface LogEntry {
  input_text: string;
  output_json: unknown;
  action_type: "harvest_analyze" | "chat" | "daily_summary" | "draft_email" | "draft_notification";
  created_by?: string;
}

// Supabase hazır olmadan önce: konsola yaz
// Supabase gelince: aşağıdaki console.log satırlarını Supabase insert ile değiştir
export async function logAI(entry: LogEntry): Promise<void> {
  const record = {
    ...entry,
    created_by: entry.created_by ?? "system",
    created_at: new Date().toISOString(),
  };

  // TODO: Supabase gelince burası değişecek:
  // const supabase = createClient();
  // await supabase.from("ai_logs").insert(record);

  console.log("[AI_LOG]", JSON.stringify(record, null, 2));
}
