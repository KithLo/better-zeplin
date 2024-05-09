import { useParams } from "@solidjs/router"
import {
  For,
  JSX,
  createMemo,
  createResource,
  Show,
  createSignal,
  createEffect,
  onCleanup,
} from "solid-js"
import { loadScreen, loadScreenDetail } from "../data"
import { Layer } from "../components/Layer"

import styles from "./Screen.module.css"
import { SidePanel } from "../components/SidePanel"
import clsx from "clsx"
import { Ruler } from "../components/Ruler"

type RulerRect = {
  left: number
  right: number
  top: number
  bottom: number
}

function getLayerIdsFromEvent(ev: MouseEvent): string[] {
  return document
    .elementsFromPoint(ev.clientX, ev.clientY)
    .map((el) => (el as HTMLElement).dataset?.layerId)
    .filter((x): x is string => !!x)
}

export function Screen(): JSX.Element {
  const params = useParams<{ projectId: string; screenId: string }>()

  const [firstLayerId, setFirstLayerId] = createSignal<string | null>(null)
  const [secondLayerId, setSecondLayerId] = createSignal<string | null>(null)
  const [isRulerActive, setRulerActive] = createSignal(true)
  const [extendedLayer, setExtendedLayer] = createSignal(false)
  const [mousePos, setMousePos] = createSignal({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  })
  const [showSideLayer, setShowSideLayer] = createSignal<"first" | "second">(
    "first",
  )

  const [screen] = createResource(
    () => [params.projectId, params.screenId] as const,
    ([projectId, screenId]): Promise<Zeplin.Screen | null> =>
      loadScreen(projectId, screenId),
  )

  const [data] = createResource(screen, async (screen) => {
    if (!screen) return null
    return loadScreenDetail(screen.url)
  })

  const firstLayer = createMemo(() => {
    const id = firstLayerId()
    return id ? data()?.layerMap[id] : undefined
  })

  const secondLayer = createMemo(() => {
    const id = secondLayerId()
    return id ? data()?.layerMap[id] : undefined
  })

  const sideLayer = createMemo(() => {
    const side = showSideLayer()
    return side === "first"
      ? firstLayer()
      : side === "second"
        ? secondLayer()
        : undefined
  })

  const asset = createMemo(() => {
    let layer = sideLayer() ?? null
    while (layer) {
      if (layer.asset) return layer.asset
      layer = layer.parent
    }
    return undefined
  })

  function changeLayer(ev: MouseEvent, second: boolean) {
    const ids = getLayerIdsFromEvent(ev).filter(
      (x) => x !== (second ? firstLayerId() : secondLayerId()),
    )
    const currentLayer = second ? secondLayer() : firstLayer()
    const index = ids.findIndex((layerId) => layerId === currentLayer?._id)
    const setter = second ? setSecondLayerId : setFirstLayerId
    if (index > -1 && index < ids.length - 1) {
      setter(ids[index + 1]!)
    } else {
      setter(ids[0] ?? null)
    }
  }

  function handleClick(ev: MouseEvent) {
    changeLayer(ev, false)
  }

  function handleContextMenu(ev: MouseEvent) {
    ev.preventDefault()
    changeLayer(ev, true)
  }

  function handleMouseChange(ev: MouseEvent) {
    const box = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    setMousePos({
      x: ev.clientX - box.x,
      y: ev.clientY - box.y,
      offsetX: box.x,
      offsetY: box.y,
    })
  }

  const ruler = createMemo(() => {
    if (!data() || !isRulerActive()) return null
    const { x, y } = mousePos()
    const first = firstLayer()?.absRect
    const second = secondLayer()?.absRect
    const extended = extendedLayer()
    const xBounds: number[] = []
    const yBounds: number[] = []
    if (first) {
      if (extended || (first.top <= y && y <= first.bottom)) {
        xBounds.push(first.left, first.right)
      }
      if (extended || (first.left <= x && x <= first.right)) {
        yBounds.push(first.top, first.bottom)
      }
    }
    if (second) {
      if (extended || (second.top <= y && y <= second.bottom)) {
        xBounds.push(second.left, second.right)
      }
      if (extended || (second.left <= x && x <= second.right)) {
        yBounds.push(second.top, second.bottom)
      }
    }
    const output: RulerRect = {
      left: xBounds.reduce(
        (acc, num) => (num <= x ? Math.max(acc, num) : acc),
        0,
      ),
      right: xBounds.reduce(
        (acc, num) => (num >= x ? Math.min(acc, num) : acc),
        data()!.width,
      ),
      top: yBounds.reduce(
        (acc, num) => (num <= y ? Math.max(acc, num) : acc),
        0,
      ),
      bottom: yBounds.reduce(
        (acc, num) => (num >= y ? Math.min(acc, num) : acc),
        data()!.height,
      ),
    }
    return output
  })

  createEffect(() => {
    function handleKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Shift") {
        setExtendedLayer(true)
      }
    }

    function handleKeyUp(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setFirstLayerId(null)
        setSecondLayerId(null)
      } else if (ev.key === "`") {
        setRulerActive((x) => !x)
      } else if (ev.key === "Shift") {
        setExtendedLayer(false)
      } else if (ev.key === "1") {
        setShowSideLayer("first")
      } else if (ev.key === "2") {
        setShowSideLayer("second")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    })
  })

  return (
    <div class={styles.main}>
      <div class={styles.content}>
        <Show when={data()}>
          {(data) => (
            <div
              class={clsx(styles.screen, isRulerActive() && styles.rulerActive)}
              style={{
                width: `${data().width}px`,
                height: `${data().height}px`,
                "background-image": `url(${screen()!.snapshot})`,
              }}
              onClick={handleClick}
              onContextMenu={handleContextMenu}
              onMouseEnter={handleMouseChange}
              onMouseMove={handleMouseChange}
            >
              <For each={data().layers}>
                {(layer) => (
                  <Layer
                    layer={layer}
                    firstLayerId={firstLayerId()}
                    secondLayerId={secondLayerId()}
                  />
                )}
              </For>
              <Show when={ruler()}>
                {(ruler) => <Ruler {...ruler()} {...mousePos()} />}
              </Show>
            </div>
          )}
        </Show>
      </div>
      <Show when={sideLayer()}>
        {(layer) => (
          <div class={clsx(styles.aside, styles[showSideLayer()!])}>
            <SidePanel layer={layer()} asset={asset()} />
          </div>
        )}
      </Show>
    </div>
  )
}
