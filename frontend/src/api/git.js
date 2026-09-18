import client from "./client";

/**
 * Fetch branches for a repository.
 */
export function getBranches(repoName, repoPath) {
  return client.get("/git/branches", {
    params: {
      repo_name: repoName,
      repo_path: repoPath,
    },
  });
}

/**
 * Fetch commits list for a repository branch.
 */
export function getCommits(repoName, options = {}) {
  return client.get("/git/commits", {
    params: {
      repo_name: repoName,
      branch: options.branch,
      limit: options.limit || 50,
      search: options.search,
    },
  });
}

/**
 * Fetch single commit details and diff.
 */
export function getCommitDetails(commitHash, repoName) {
  return client.get(`/git/commit/${commitHash}`, {
    params: {
      repo_name: repoName,
    },
  });
}

/**
 * Switch/checkout branch in repository.
 */
export function checkoutBranch(repoName, branch) {
  return client.post("/git/checkout", {
    repository_name: repoName,
    branch,
  });
}
