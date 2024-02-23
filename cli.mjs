import fs from "node:fs"
import path from "node:path"
import url from "node:url"

import config from "./config.json" assert { type: "json" }

const baseDir = path.dirname(url.fileURLToPath(import.meta.url))
const dataDir = path.resolve(baseDir, "data")
const tokenFile = path.resolve(dataDir, "token.txt")
const projectsFile = path.resolve(dataDir, "projects.json")

/**
 * @returns {Promise<string | null>}
 */
async function fetchLoginToken() {
  console.log("fetching token")
  const res = await fetch("https://api.zeplin.io/v2/users/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      handle: config.username,
      password: config.password,
    }),
  })
  if (res.ok) {
    const data = await res.json()
    if (typeof data.token === "string") {
      return data.token
    }
  }
  return null
}

/**
 * @param {string} projectId
 * @param {string} token
 * @returns {Promise<any>}
 */
async function getProject(projectId, token) {
  if (!token) return null
  const res = await fetch(`https://api.zeplin.io/v7/projects/${projectId}`, {
    headers: {
      "content-type": "application/json",
      "zeplin-token": token,
    },
  })
  if (res.ok) {
    const data = await res.json()
    return data
  }
  return null
}

async function ensureDataDir() {
  await fs.promises.mkdir(dataDir, { recursive: true })
}

/**
 * @param {string} token
 */
async function loadProjects(token) {
  const projects = await Promise.all(
    config.projects.map((projectId) => getProject(projectId, token)),
  )
  const done = projects.every((x) => x)
  if (done) {
    await fs.promises.writeFile(projectsFile, JSON.stringify(projects))
  }
  return done
}

async function execute() {
  /** @type {string | null} */
  let token = null
  let cached = false
  await ensureDataDir()
  if (fs.existsSync(tokenFile)) {
    token = await fs.promises.readFile(tokenFile, "utf-8")
    cached = true
    console.log("using existing token")
  } else {
    token = await fetchLoginToken()
    if (!token) return false
    await fs.promises.writeFile(tokenFile, token)
  }
  const done = loadProjects(token)
  if (done) return true
  if (!cached) return false
  token = await fetchLoginToken()
  if (!token) return false
  await fs.promises.writeFile(tokenFile, token)
  loadProjects(token)
  return done
}

async function main() {
  const done = await execute()
  if (!done) {
    console.warn("failed")
  }
}

main()
