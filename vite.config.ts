import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import path from "path"
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
  root: path.resolve(process.cwd(), "web"),
  base: "/",
  build: {
    outDir: path.resolve(process.cwd(), "dist"),
    emptyOutDir: true,
  },
  plugins: [solid(), topLevelAwait()],
})
