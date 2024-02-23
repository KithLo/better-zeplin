import { For, JSX, Match, Show, Switch, createMemo } from "solid-js"
import styles from "./SidePanel.module.css"

function toHex(num: number): string {
  return num.toString(16).padStart(2, "0")
}

function format(num: number) {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const predefinedColor: Record<string, string> = {
  ffffff: "$w",
  f3f3f3: "$lgy",
  e5e5e5: "$egy",
  e2e2e2: "$gy",
  cccccc: "$cgy",
  "8e8e8e": "$dgy",
  "3e3e3e": "$bgy",
  "000000": "$b",
  "85796e": "$lbr",
  "4e3c2d": "$br",
  b3865a: "$kh",
  ffcb05: "$y",
  fffcdf: "$ly",
  e54e26: "$o",
  e34f26: "$od",
  ff8200: "$or",
  "3e75d9": "$bu",
  "3e52ff": "$bbg",
  "002c8c": "$navy",
  "783875": "$p",
  "009342": "$g",
  ffe8a3: "$by",
  "132737": "$nb",
}

const badKeys = [
  "sourceId",
  "type",
  "_id",
  "componentId",
  "componentName",
  "componentProperties",
  "fromLibrary",
  "interactionLevel",
  "blendMode",
  "layers",
  "exportable",
  "constraints",
  "relativeTo",
  "layerHashes",
  "bitmapImageHash",
  "renderRect",
  "asset",
  "verticalAlignment",
  "alignment",
  "itemAlignment",
  "distribution",
  "sizingMode",
  "layoutAlignment",
  "join",
  "miterLimit",
  "fillType",
]

function pruneObject(obj: any) {
  if (obj == null) return undefined
  if (typeof obj !== "object") return obj
  if (Array.isArray(obj)) {
    const output: any[] = obj.map(pruneObject).filter((x) => x !== undefined)
    if (output.length === 0) return undefined
    return output
  } else {
    if (["r", "g", "b"].every((k) => typeof obj[k] === "number")) {
      const code = toHex(obj.r) + toHex(obj.g) + toHex(obj.b)
      const color = predefinedColor[code] ?? `#${code}`
      if (typeof obj.a === "number" && obj.a !== 1) {
        return `alpha(${color}, ${format(obj.a)})`
      }
      return color
    }
    const output: any = {}
    for (const key of Object.keys(obj)) {
      if (badKeys.includes(key)) continue
      const value = obj[key]
      if (key === "rotation" && value === 0) continue
      if (key === "layoutGrow" && value === 0) continue
      if (key === "opacity" && value === 1) continue
      if (key === "borderRadius" && value === 0) continue
      if (key === "paragraphSpacing" && value === 0) continue
      if (key === "paragraphIndent" && value === 0) continue
      if (key === "listSpacing" && value === 0) continue
      const item = pruneObject(value)
      if (item !== undefined) {
        output[key] = item
      }
    }
    if (Object.keys(output).length === 0) return undefined
    return output
  }
}

export function JsonViewer(props: { value: any; key: string }): JSX.Element {
  return (
    <Show
      when={props.value && typeof props.value === "object"}
      fallback={
        <div onClick={() => navigator.clipboard.writeText(String(props.value))}>
          {props.key} :{" "}
          <Switch>
            <Match when={typeof props.value === "string"}>
              <span class={styles.string}>{props.value}</span>
            </Match>
            <Match when={typeof props.value === "number"}>
              <span class={styles.number}>{format(props.value)}</span>
            </Match>
            <Match when={typeof props.value === "boolean"}>
              <span class={styles.boolean}>{String(props.value)}</span>
            </Match>
          </Switch>
        </div>
      }
    >
      <details open>
        <summary>
          {props.key}{" "}
          <span class={styles.count}>
            {Array.isArray(props.value)
              ? `[${props.value.length}]`
              : `{${Object.keys(props.value).length}}`}
          </span>
        </summary>
        <div class={styles.detail}>
          <For each={Object.keys(props.value)}>
            {(key) => <JsonViewer value={props.value[key]} key={key} />}
          </For>
        </div>
      </details>
    </Show>
  )
}

export function SidePanel(props: {
  layer: Zeplin.Layer
  asset?: Zeplin.Asset
}): JSX.Element {
  const obj = createMemo(() => pruneObject(props.layer))

  async function download(
    name: string,
    { url, format, densityScale }: Zeplin.AssetContent,
  ) {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement("a")
    a.download = `${name}${densityScale === 1 ? "" : `@${densityScale}x`}.${format}`
    a.href = URL.createObjectURL(blob)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div class={styles.content}>
      <div class={styles.items}>
        <For each={Object.keys(obj())}>
          {(key) => <JsonViewer value={obj()[key]} key={key} />}
        </For>
      </div>
      <Show when={props.asset}>
        {(asset) => (
          <div class={styles.asset}>
            <img class={styles.img} src={asset().contents[0]!.url} />
            <For each={asset().contents}>
              {(item) => (
                <a
                  href={item.url}
                  onClick={(ev) => {
                    ev.preventDefault()
                    download(asset().displayName, item)
                  }}
                  download="download"
                >
                  {item.format} {item.densityScale}x
                </a>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  )
}
