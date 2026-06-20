import "@arco-design/web-react/dist/css/arco.css"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { registerSW } from "virtual:pwa-register"

import "simplebar-react/dist/simplebar.min.css"

import "./index.css"
import "./ios-safari.css"
import router from "./routes"
import { registerLanguages } from "./utils/highlighter"
import { initPlatformClass, IS_IOS_SAFARI } from "./utils/platform"
import "./theme.css"

initPlatformClass()

if (!IS_IOS_SAFARI) {
  registerSW({ immediate: true })
}

registerLanguages()

ReactDOM.createRoot(document.querySelector("#root")).render(<RouterProvider router={router} />)
