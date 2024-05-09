function getZeplinToken() {
  const key = "zeplinToken="
  const cookie = document.cookie
  let start
  if (cookie.startsWith(key)) {
    start = key.length
  } else {
    const index = cookie.indexOf(`; ${key}`)
    if (index === -1) return
    start = index + key.length + 2
  }
  const end = cookie.indexOf(";", start)
  return end === -1 ? cookie.slice(start) : cookie.slice(start, end)
}

export async function loadProject(projectId: string) {
  const token = getZeplinToken()
  if (!token) return null
  const res = await fetch(`https://api.zeplin.io/v7/projects/${projectId}`, {
    headers: {
      "zeplin-token": token,
    },
  })
  if (res.ok) {
    const data = await res.json()
    return data
  }
  return null
}

export async function loadScreen(
  projectId: string,
  screenId: string,
): Promise<Zeplin.Screen | null> {
  const project = await loadProject(projectId)
  const s = (project.screens as any[]).find((r) => r._id === screenId)
  if (!s) return null
  return {
    id: s._id,
    name: s.name,
    updatedAt: new Date(s.updated),
    snapshot: s.latestVersion.snapshot.url,
    url: s.latestVersion.fullSnapshotUrl,
  }
}

export async function loadScreenDetail(
  url: string,
): Promise<Zeplin.ScreenDetail | null> {
  const res = await fetch(url)
  if (res.ok) {
    const data = await res.json()
    data.layerMap = {}
    const sourceIdMap: any = {}
    ;(data.layers as any[]).forEach((layer, index) => {
      validateLayer(layer, `layers[${index}]`)
      addParent(layer, null, 0)
      addToLayerMap(data.layerMap, layer)
      addToSourceIdMap(sourceIdMap, layer)
    })
    ;(data.assets as any[]).forEach((asset) => {
      const layer = sourceIdMap[asset.layerId]
      if (layer) {
        layer.asset = asset
      }
    })
    return data
  }
  return null
}

function addParent(layer: any, parent: any, hierarchy: number) {
  Object.defineProperty(layer, "parent", {
    value: parent,
    configurable: true,
  })
  Object.defineProperty(layer, "hierarchy", {
    value: hierarchy,
    configurable: true,
  })
  const left = (parent?.absRect.left ?? 0) + layer.rect.x
  const top = (parent?.absRect.top ?? 0) + layer.rect.y
  Object.defineProperty(layer, "absRect", {
    value: {
      left,
      right: left + layer.rect.width,
      top,
      bottom: top + layer.rect.height,
      width: layer.rect.width,
      height: layer.rect.height,
    },
    configurable: true,
  })
  if (Array.isArray(layer.layers)) {
    for (const child of layer.layers) {
      addParent(child, layer, hierarchy + 1)
    }
  }
}

function addToLayerMap(layerMap: Record<string, any>, layer: any) {
  layerMap[layer._id] = layer
  if (Array.isArray(layer.layers)) {
    for (const child of layer.layers) {
      addToLayerMap(layerMap, child)
    }
  }
}

function addToSourceIdMap(sourceMap: Record<string, any>, layer: any) {
  sourceMap[layer.sourceId] = layer
  if (Array.isArray(layer.layers)) {
    for (const child of layer.layers) {
      addToSourceIdMap(sourceMap, child)
    }
  }
}

function validateLayer(layer: any, path: string) {
  function warn(text: string) {
    console.warn(`${path} ${text}`, layer)
  }

  if (layer.type === "text") {
    if (layer.fills.length !== 0) {
      warn("fills is not empty for text layer")
    }
    if (layer.shadows.length !== 0) {
      warn("shadows is not empty for text layer")
    }
    if (layer.textStyles.length === 0 && layer.content.trim().length > 0) {
      warn("textStyles is empty for text layer")
    }
    ;(layer.textStyles as any[]).forEach((textStyles) => {
      if (
        ![
          "Lato-Black",
          "Lato-Regular",
          "Lato-Medium",
          "Lato-Semibold",
          "Lato-SemiBold",
          "Lato-Bold",
          "Lato-Light",
          "SFUIText-Regular",
          "SFUIText-Medium",
          "SFUIText-Bold",
          "SFProText-Semibold",
          "Roboto-Regular",
          "Roboto-Bold",
          "PingFangHK-Regular",
          "PingFangHK-Semibold",
        ].includes(textStyles.style.fontFace)
      ) {
        warn(`unknown font face: ${textStyles.style.fontFace}`)
      }
    })
  } else if (layer.type === "shape" || layer.type === "group") {
    ;(layer.fills as any[]).forEach((fill) => {
      if (fill.fillType === "color") {
        //
      } else if (fill.fillType === "gradient") {
        if (!["linear", "angular"].includes(fill.gradient.type)) {
          warn("unknown fill gradient type")
        }
      } else {
        warn("unknown fill type")
      }
    })
    ;(layer.shadows as any[]).forEach((shadow) => {
      if (!["outer"].includes(shadow.type)) {
        warn("unknown shadow type")
      }
      if (!shadow.color) {
        warn("no shadow color")
      }
    })
    ;(layer.borders as any[]).forEach((border) => {
      if (!["color"].includes(border.fillType)) {
        warn("unknown border fillType")
      }
      if (!["miter", "round", undefined].includes(border.join)) {
        warn("unknown border join")
      }
      if (!["inside", "outside", "center"].includes(border.position)) {
        warn("unknown border position")
      }
    })
    if (layer.type === "group") {
      ;(layer.layers as any[]).forEach((child, i) => {
        validateLayer(child, `${path}.layers[${i}]`)
      })
    }
  } else {
    warn("unknown layer type")
  }
}
