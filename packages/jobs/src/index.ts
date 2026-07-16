export const foundationJobEvent = "system.foundation.noop" as const;

export type JobEnvelope<TPayload> = {
  eventName: string;
  payload: TPayload;
  idempotencyKey: string;
  correlationId: string;
};

export type EnqueueResult = {
  accepted: boolean;
  jobId: string;
  eventName: string;
};

export interface JobsAdapter {
  enqueue<TPayload>(job: JobEnvelope<TPayload>): Promise<EnqueueResult>;
}

export const localJobsAdapter: JobsAdapter = {
  async enqueue(job) {
    return {
      accepted: true,
      jobId: "local:" + job.idempotencyKey,
      eventName: job.eventName
    };
  }
};
