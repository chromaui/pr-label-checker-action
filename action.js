import * as core from "@actions/core"
import { context } from "@actions/github"

function action({ labels = [] } = {}, api = core) {
  const prLabels = labels.map(({ name }) => name)
  api.info(`Found PR labels: ${prLabels.join(", ")}`)

  const allOf = api.getInput("all-of")?.split("\n").filter(Boolean) || []
  const oneOf = api.getInput("one-of")?.split("\n").filter(Boolean) || []
  const noneOf = api.getInput("none-of")?.split("\n").filter(Boolean) || []

  if (!allOf.length && !oneOf.length && !noneOf.length) {
    return api.setFailed("No rules defined")
  }

  api.info(`Checking label rules:`)
  if (allOf.length) api.info(allOf.map((line) => `  all of: ${line}`).join("\n"))
  if (oneOf.length) api.info(oneOf.map((line) => `  one of: ${line}`).join("\n"))
  if (noneOf.length) api.info(noneOf.map((line) => `  none of: ${line}`).join("\n"))

  const errors = []

  for (const line of allOf) {
    const labels = line.split(",").map((label) => label.trim())
    const missing = labels.filter((label) => !prLabels.includes(label))
    if (missing.length) {
      errors.push(`Missing required labels: ${missing.join(", ")}`)
    }
  }

  for (const line of oneOf) {
    const labels = line.split(",").map((label) => label.trim())
    const matches = labels.filter((label) => prLabels.includes(label))
    if (!matches.length) {
      errors.push(`Exactly one of these labels is required: ${labels.join(", ")}`)
    } else if (matches.length > 1) {
      errors.push(`At most one of these labels may be present: ${labels.join(", ")}`)
    }
  }

  for (const line of noneOf) {
    const labels = line.split(",").map((label) => label.trim())
    const matches = labels.filter((label) => prLabels.includes(label))
    if (matches.length) {
      errors.push(`Found disallowed labels: ${matches.join(", ")}`)
    }
  }

  if (errors.length) {
    errors.forEach((error) => api.error(error))
    api.setFailed("PR labels do not meet requirements")
  }
}

if (require.main === module) {
  action(context.payload.pull_request)
}

module.exports = action
