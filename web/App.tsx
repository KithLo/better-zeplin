import { Route, Router } from "@solidjs/router"
import { JSX } from "solid-js"
import { Screen } from "./views/Screen"

export function App(): JSX.Element {
  return (
    <Router base="/better-zeplin">
      <Route path="/project/:projectId/screen/:screenId" component={Screen} />
    </Router>
  )
}
