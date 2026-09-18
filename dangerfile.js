// dangerfile.js: the two pull request gates this repo used to run as GitHub
// Actions jobs.
//
// Replaces .github/workflows/pr-labeler.yml (whose only job was
// validate_pr_title, despite the name) and .github/workflows/pr-linear-check.yml.
// Both read pull request metadata and nothing else, which is what Danger is for:
// two `linux-s` jobs, two checkouts and two runner pods become one review.
//
// Runs under danger-pipeline-v1 (argo ADR-043); registered in .argo/config.yaml.
//
// Plain JS on purpose: danger transpiles TypeScript only when a TS compiler is
// resolvable, and the danger image runs the dangerfile with no repo node_modules.

const { danger, fail } = require("danger")

// --- pull request title ------------------------------------------------------

// The shell regex from validate_pr_title, character for character, so nothing
// that merged yesterday fails today. Two properties of it are deliberate and
// worth keeping in mind before anyone "fixes" them:
//
//   - `style` is not in the type list. It is in the conventional-commit spec,
//     but it was never accepted here.
//   - a `!` breaking-change marker (`feat!: ...`) does not match, so it fails.
//     The spec allows it; this repo never has.
//
// Widening either is a behaviour change, not a port, so it is left alone.
const TITLE_RE = /^(feat|fix|docs|test|ci|refactor|perf|chore|revert|build)(\(.+\))?: .+/

const TITLE_BLOG = "https://xfuture-blog.com/working-with-conventional-commits"

function reviewTitle(title) {
  if (TITLE_RE.test(title)) return
  fail(
    `❌ The pull request title \`${title}\` does not follow the Conventional Commits format.\n\n` +
      "Consistent titles are what let us automate changelogs and keep the project history readable. " +
      `Here is why we use them: ${TITLE_BLOG}\n\n` +
      "**Examples of valid titles:**\n" +
      "- `feat: add user authentication`\n" +
      "- `fix(login): handle null password error`\n" +
      "- `docs(readme): update installation instructions`"
  )
}

// --- Linear reference --------------------------------------------------------

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

// --- entry point -------------------------------------------------------------

// danger.github is absent under `danger local`, so the file stays runnable there.
const pr = danger.github && danger.github.pr
if (pr) {
  if (pr.title) reviewTitle(pr.title)
  reviewLinearReference(pr.body || "", (pr.user && pr.user.login) || "")
}
