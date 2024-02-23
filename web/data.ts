import rawData from "../data/projects.json"

type Screens = Record<string, Record<string, Zeplin.Screen>>

export const screens: Screens = (rawData as any[]).reduce((acc: Screens, p) => {
  const screenMap: Record<string, Zeplin.Screen> = {}
  for (const s of p.screens) {
    screenMap[s._id] = {
      id: s._id,
      name: s.name,
      updatedAt: new Date(s.updated),
      snapshot: s.latestVersion.snapshot.url,
      url: s.latestVersion.fullSnapshotUrl,
    }
  }
  acc[p._id] = screenMap
  return acc
}, {})

export const projects: Zeplin.Project[] = (rawData as any[]).map((p) => {
  const screenMap = screens[p._id]!
  return {
    id: p._id,
    name: p.name,
    createdAt: new Date(p.created),
    updatedAt: new Date(p.updated),
    sections: (p.sections as any[]).map((s) => ({
      id: s._id,
      name: s.name,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      screens: (s.screens as string[]).map((n) => screenMap[n]!),
    })),
  }
})

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
