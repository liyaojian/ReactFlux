import "@arco-design/web-react/dist/css/arco.css"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router/dom"

import "simplebar-react/dist/simplebar.min.css"

import "./index.css"
import "./ios-safari.css"
import router from "./routes"
import { registerLanguages } from "./utils/highlighter"
import { initPlatformClass } from "./utils/platform"
import registerServiceWorker from "./utils/service-worker"
import applyStartupRedirect from "./utils/startup-redirect"
import "./theme.css"

applyStartupRedirect()
initPlatformClass()
registerServiceWorker()

registerLanguages()

ReactDOM.createRoot(document.querySelector("#root")).render(<RouterProvider router={router} />)
