// dangerfile.js: the Linear reference gate this repo used to run as a GitHub
// Actions job.
//
// Replaces .github/workflows/pr-linear-check.yml. It reads pull request
// metadata and nothing else, which is what Danger is for: a `linux-s` job, a
// checkout and a runner pod become one review.
//
// Runs under danger-pipeline-v1 (argo ADR-043); registered in .argo/config.yaml.
//
// Plain JS on purpose: danger transpiles TypeScript only when a TS compiler is
// resolvable, and the danger image runs the dangerfile with no repo node_modules.

const { danger, fail } = require("danger")

// Authors exempt from the Linear requirement, lowercased for comparison exactly
// as the shell job did.
const LINEAR_IGNORED_AUTHORS = ["jmelahman"]

const LINEAR_LINK = /https:\/\/linear\.app/
const LINEAR_OVERRIDE = /\[x\].*Override Linear Check/

function reviewLinearReference(body, author) {
  if (LINEAR_IGNORED_AUTHORS.includes(String(author).toLowerCase())) return
  if (LINEAR_LINK.test(body)) return
  if (LINEAR_OVERRIDE.test(body)) return
  fail(
    "No Linear link or override found in the pull request description. Link the Linear issue, " +
      "or tick **Override Linear Check** in the description if this change has no ticket."
  )
}

// danger.github is absent under `danger local`, so the file stays runnable there.
const pr = danger.github && danger.github.pr
if (pr) {
  reviewLinearReference(pr.body || "", (pr.user && pr.user.login) || "")
}
