import { Tooltip } from "@arco-design/web-react"

import useScreenWidth from "@/hooks/useScreenWidth"

const CustomTooltip = ({ children, ...props }) => {
  const { isBelowMedium } = useScreenWidth()

  // Mobile/touch: never mount Tooltip. Controlled popupVisible can still flash on tap.
  if (isBelowMedium) {
    return children
  }

  return <Tooltip {...props}>{children}</Tooltip>
}

export default CustomTooltip
