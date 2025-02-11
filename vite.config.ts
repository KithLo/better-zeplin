import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import path from "path"
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
  root: path.resolve(process.cwd(), "web"),
  base: "/better-zeplin/",
  build: {
    outDir: path.resolve(process.cwd(), "public"),
    emptyOutDir: true,
  },
  plugins: [solid(), topLevelAwait()],
})
