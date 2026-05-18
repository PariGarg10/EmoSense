import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getTheme } from "@/src/lib/emotionTheme";

export async function insertBehaviourLog(input: {
  userId: string;
  timeOfDay: string;
  emotion: string;
  activities: string[];
  energyLevel: number;
  note?: string;
}): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const label = getTheme(input.emotion).label;

  const { error } = await supabase.from("behaviour_logs").insert({
    user_id: input.userId,
    time_of_day: input.timeOfDay,
    emotion: label,
    activities: input.activities,
    energy_level: input.energyLevel,
    note: input.note ?? null,
  });

  return !error;
}
