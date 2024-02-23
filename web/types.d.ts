declare global {
  declare namespace Zeplin {
    declare interface Screen {
      readonly id: string
      readonly name: string
      readonly updatedAt: Date
      readonly snapshot: string
      readonly url: string
    }

    declare interface Section {
      readonly id: string
      readonly name: string
      readonly createdAt: Date
      readonly updatedAt: Date
      readonly screens: readonly Screen[]
    }

    declare interface Project {
      readonly id: string
      readonly name: string
      readonly createdAt: Date
      readonly updatedAt: Date
      readonly sections: readonly Section[]
    }

    declare interface Asset {
      readonly layerId: string
      readonly displayName: string
      readonly contents: readonly AssetContent[]
    }

    declare interface AssetContent {
      readonly url: string
      readonly format: "png" | "svg" | "pdf" | "jpg"
      readonly densityScale: number
    }

    declare interface ScreenDetail {
      readonly backgroundColor: Color
      readonly width: number
      readonly height: number
      readonly layers: Layer[]
      readonly layerMap: Record<string, Layer>
    }

    declare interface Coords {
      readonly x: number
      readonly y: number
    }

    declare interface Color {
      readonly r: number
      readonly g: number
      readonly b: number
      readonly a: number
    }

    declare interface Gradient {
      readonly aspectRatio: number
      readonly colorStops: {
        readonly color: Color
        readonly position: number
      }[]
      readonly from: Coords
      readonly to: Coords
      readonly type: "linear" | "angular"
    }

    declare interface Rect {
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }

    declare interface FullRect {
      readonly left: number
      readonly right: number
      readonly top: number
      readonly bottom: number
      readonly width: number
      readonly height: number
    }

    declare interface Range {
      readonly location: number
      readonly length: number
    }

    declare interface FillColor {
      readonly fillType: "color"
      readonly color: Color
      readonly opacity: number
    }

    declare interface FillGradient {
      readonly fillType: "gradient"
      readonly gradient: Color
      readonly opacity: number
    }

    declare type Fill = FillColor | FillGradient

    declare interface Shadow {
      readonly color: Color
      readonly blurRadius: number
      readonly offsetX: number
      readonly offsetY: number
      readonly spread: number
      readonly type: "outer"
    }

    declare interface Border {
      readonly fillType: "color"
      readonly color: Color
      readonly join?: "miter" | "round"
      readonly miterLimit?: number
      readonly opacity: number
      readonly position: "inside" | "outside" | "center"
      readonly thickness: number
    }

    declare interface GenericLayer {
      readonly _id: string
      readonly name: string
      readonly opacity: number
      readonly rect: Rect
      readonly absRect: FullRect
      readonly rotation: number
      readonly borderRadius: number
      readonly parent: GroupLayer | null
      readonly hierarchy: number
      readonly asset?: Asset
    }

    declare interface TextLayer extends GenericLayer {
      readonly type: "text"
      readonly content: string
      readonly textStyles: {
        readonly range: Range
        readonly style: {
          readonly color: Color
          readonly fontFace: string
          readonly fontSize: number
          readonly letterSpacing?: number
        }
      }[]
    }

    declare interface ContainerLayer extends GenericLayer {
      readonly exportable: boolean
      readonly fills: readonly Fill[]
      readonly borders: readonly Border[]
      readonly shadows: readonly Shadow[]
    }

    declare interface GroupLayer extends ContainerLayer {
      readonly type: "group"
      readonly layers: readonly Layer[]
    }

    declare interface ShapeLayer extends ContainerLayer {
      readonly type: "shape"
      readonly sourceId: string
    }

    declare type Layer = TextLayer | GroupLayer | ShapeLayer
  }
}

export {}
