const { danger, fail } = require("danger")

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

const pr = danger.github && danger.github.pr
if (pr) {
  reviewLinearReference(pr.body || "", (pr.user && pr.user.login) || "")
}
