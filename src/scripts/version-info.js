import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"

function getGitValue(command, fallback) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return fallback
  }
}

const versionInfo = {
  gitHash: getGitValue("git rev-parse --short HEAD", "unknown"),
  gitDate: getGitValue("git log -1 --format=%cd --date=iso", new Date().toISOString()),
}

writeFileSync("src/version-info.json", JSON.stringify(versionInfo, null, 2))
