import { Navigate } from "react-router"

import { getLandingPath } from "@/store/sidebarState"

const HomeRedirect = () => <Navigate replace to={getLandingPath()} />

export default HomeRedirect
