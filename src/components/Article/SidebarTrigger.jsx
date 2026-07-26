import { Button, Drawer } from "@arco-design/web-react"
import { IconMenu } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { useLocation } from "react-router"

import Sidebar from "@/components/Sidebar/Sidebar"
import useScreenWidth from "@/hooks/useScreenWidth"
import { setSidebarDrawerVisible, sidebarDrawerVisibleState } from "@/store/sidebarState"
import "./SidebarTrigger.css"

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarDrawerVisibleState)

  useEffect(() => {
    if (!isBelowLarge) {
      setSidebarDrawerVisible(false)
    }
  }, [isBelowLarge])

  useEffect(() => {
    if (currentPath) {
      setSidebarDrawerVisible(false)
    }
  }, [currentPath])

  return (
    <div>
      <div className="brand">
        <Button
          className="trigger"
          shape="circle"
          size="small"
          onClick={() => setSidebarDrawerVisible(!sidebarVisible)}
        >
          <IconMenu />
        </Button>
      </div>
      <Drawer
        className="sidebar-drawer"
        closable={false}
        footer={null}
        placement="left"
        title={null}
        visible={sidebarVisible}
        width={240}
        onCancel={() => setSidebarDrawerVisible(false)}
      >
        <Sidebar />
      </Drawer>
    </div>
  )
}
