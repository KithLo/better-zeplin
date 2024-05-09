import { JSX } from "solid-js"
import clsx from "clsx"

import styles from "./Ruler.module.css"

function format(num: number) {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function Ruler(props: {
  x: number
  y: number
  offsetX: number
  offsetY: number
  left: number
  right: number
  top: number
  bottom: number
}): JSX.Element {
  return (
    <>
      <div
        class={clsx(styles.line, styles.horizontal)}
        style={{
          width: `${props.right - props.left}px`,
          top: `${props.y + props.offsetY}px`,
          left: `${props.left + props.offsetX}px`,
        }}
      />
      <div
        class={clsx(styles.line, styles.vertical)}
        style={{
          height: `${props.bottom - props.top}px`,
          top: `${props.top + props.offsetY}px`,
          left: `${props.x + props.offsetX}px`,
        }}
      />
      <div
        class={styles.tooltip}
        style={{
          top: `${props.y + props.offsetY}px`,
          left: `${props.x + props.offsetX}px`,
        }}
      >
        {format(props.right - props.left)} x {format(props.bottom - props.top)}
      </div>
    </>
  )
}
