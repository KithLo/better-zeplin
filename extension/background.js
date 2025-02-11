async function copyUserToken(tabUrl) {
  const token = await chrome.cookies.get({
    url: "https://zeplin.io",
    name: "userToken",
  })
  if (token) {
    const url = new URL(tabUrl)
    await chrome.cookies.set({
      domain: url.hostname,
      name: "zeplinToken",
      url: url.origin,
      value: token.value,
    })
  }
}

const screenUrlRegex = /^https:\/\/app.zeplin.io\/project\/(.*?)\/screen\/(.*)$/

async function fetchZeplinProject(url) {
  const token = await chrome.cookies.get({
    url: "https://zeplin.io",
    name: "userToken",
  })
  if (!token.value) {
    console.log("cannot get zeplin token")
    return
  }
  const resp1 = await fetch(url, { method: "HEAD" })
  const urlMatch = screenUrlRegex.exec(resp1.url)
  if (!urlMatch) {
    console.log("cannot get expanded url")
    return
  }
  const projectId = urlMatch[1]
  const screenId = urlMatch[2]
  const resp2 = await fetch(`https://api.zeplin.io/v7/projects/${projectId}`, {
    headers: {
      "zeplin-token": token.value,
    },
  })
  if (!resp2.ok) {
    console.log("cannot get projects")
    return
  }
  const project = await resp2.json()
  const screen = project.screens.find((r) => r._id === screenId)
  if (!screen) {
    console.log("cannot find screen")
    return
  }
  const snapshot = screen.latestVersion?.snapshot?.url
  if (!snapshot) {
    console.log("cannot find snapshot")
    return
  }
  chrome.tabs.create({ url: snapshot })
}

const title = "Better Zeplin"

function toggleRedirectRule(enable) {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    [enable ? "enableRulesetIds" : "disableRulesetIds"]: [
      "zelin_redirect_rules",
    ],
  })
  chrome.contextMenus.update("redirect", {
    title: enable ? "Auto redirect enabled" : "Auto redirect disabled",
  })
}

function createContextMenu() {
  chrome.contextMenus.create({
    id: "redirect",
    title: "Auto redirect disabled",
    contexts: ["action"],
    type: "checkbox",
  })

  chrome.contextMenus.create({
    id: "image",
    title: "Open as image",
    contexts: ["link"],
  })

  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "redirect") {
      toggleRedirectRule(info.checked)
      return
    } else if (info.menuItemId === "image") {
      fetchZeplinProject(info.linkUrl)
    }
  })
}

chrome.contextMenus.removeAll(() => {
  createContextMenu()
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.title === title ||
    (changeInfo.status && tab.title === title)
  ) {
    copyUserToken(tab.url)
  }
})

function gotoZeplin() {
  const allowedPrefix = "/better-zeplin"
  let pathname = window.location.pathname
  if (pathname.startsWith(allowedPrefix)) {
    pathname = pathname.slice(allowedPrefix.length)
  }
  if (/^\/project\/.*?\/screen\//.test(pathname)) {
    window.location.assign(
      "https://" +
        (window.location.host.includes("github.io")
          ? "app.zeplin.io"
          : "kithlo.github.io/better-zeplin") +
        pathname,
    )
  }
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: gotoZeplin,
  })
})
