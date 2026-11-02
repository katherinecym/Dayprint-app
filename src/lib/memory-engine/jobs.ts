import { getMemoryStore } from "./store";
import { processEventToCandidates } from "./governance";

export async function runPendingJobs(maxBatch = 5): Promise<{
  processed: number;
  errors: number;
}> {
  const store = getMemoryStore();
  const jobs = await store.getPendingJobs(maxBatch);

  let processed = 0;
  let errors = 0;

  for (const job of jobs) {
    try {
      await store.updateJobStatus(job.id, "processing");

      if (job.job_type === "CAPTURE_PROCESSING") {
        const res = await processEventToCandidates(job.event_id);
        if (res.success) {
          await store.updateJobStatus(job.id, "completed");
          processed++;
        } else {
          await store.updateJobStatus(job.id, "failed", "Extraction failed to complete");
          errors++;
        }
      } else {
        await store.updateJobStatus(job.id, "completed");
        processed++;
      }
    } catch (e: any) {
      console.error(`[JobRunner] Job ${job.id} execution failed:`, e);
      await store.updateJobStatus(job.id, "failed", e?.message || "Unknown error");
      errors++;
    }
  }

  return { processed, errors };
}
