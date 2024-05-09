import { JSX, Show, For } from "solid-js"

import styles from "./Layer.module.css"
import clsx from "clsx"

export function Layer(props: {
  layer: Zeplin.Layer
  firstLayerId: string | null
  secondLayerId: string | null
}): JSX.Element {
  return (
    <div
      class={clsx(
        styles.layer,
        props.firstLayerId === props.layer._id && styles.first,
        props.secondLayerId === props.layer._id && styles.second,
      )}
      style={{
        left: `${props.layer.rect.x}px`,
        top: `${props.layer.rect.y}px`,
        width: `${props.layer.rect.width}px`,
        height: `${props.layer.rect.height}px`,
      }}
      data-layer-id={props.layer._id}
    >
      <Show when={props.layer.type === "group" ? props.layer.layers : null}>
        {(layers) => (
          <For each={layers()}>
            {(child) => (
              <Layer
                layer={child}
                firstLayerId={props.firstLayerId}
                secondLayerId={props.secondLayerId}
              />
            )}
          </For>
        )}
      </Show>
    </div>
  )
}
