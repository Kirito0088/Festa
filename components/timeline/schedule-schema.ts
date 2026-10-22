import { z } from "zod";
import { LIMITS } from "@/lib/constants";
import { isScheduleTime } from "@/lib/plan/run-sheet";

/** The day-of schedule form; the server re-validates the same rules. */
export const scheduleSchema = z.object({
  time: z.string().refine(isScheduleTime, "Choose a time, such as 18:30."),
  title: z.string().trim().min(1, "Say what happens at this time.").max(LIMITS.nameMax),
  notes: z.string().trim().max(1000, "Keep notes under 1,000 characters."),
});

export type ScheduleValues = z.infer<typeof scheduleSchema>;
