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

const title = "Better Zeplin"

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.title === title ||
    (changeInfo.status && tab.title === title)
  ) {
    copyUserToken(tab.url)
  }
})

function gotoZeplin() {
  const pathname = window.location.pathname
  if (/^\/project\/.*?\/screen\//.test(pathname)) {
    window.location.assign("https://app.zeplin.io" + window.location.pathname)
  }
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: gotoZeplin,
  })
})
