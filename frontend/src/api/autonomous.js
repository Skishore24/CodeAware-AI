import client from "./client";

// =========================================================
// Autonomous Workflow API
// =========================================================

/**
 * Run the autonomous fix workflow.
 */
export function runAutonomousWorkflow(data) {
  return client.post("/autonomous/run", data);
}

/**
 * Approve and apply a validated fix (commit to branch).
 */
export function approveFix(data) {
  return client.post("/autonomous/approve", data);
}

/**
 * Create a GitHub Pull Request for an approved fix.
 */
export function createPullRequest(data) {
  return client.post("/autonomous/create-pr", data);
}
