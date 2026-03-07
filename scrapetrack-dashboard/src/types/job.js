/**
 * @typedef {Object} JobResult
 * @property {string} title
 * @property {string} metaDescription
 * @property {string[]} links
 */

/**
 * @typedef {Object} Job
 * @property {string} _id
 * @property {string} url
 * @property {"pending"|"running"|"completed"|"failed"} status
 * @property {JobResult} [result]
 * @property {string} createdAt
 */

export const JOB_STATUSES = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};
