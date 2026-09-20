import { Button, Drawer } from "@arco-design/web-react"
import { IconMenu } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useLocation } from "react-router"

import Sidebar from "@/components/Sidebar/Sidebar"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import {
  setSidebarDrawerVisible,
  sidebarDrawerScrollTopState,
  sidebarDrawerVisibleState,
} from "@/store/sidebarState"
import "./SidebarTrigger.css"

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarDrawerVisibleState)
  const { isCoreDataReady } = useStore(dataState)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const scrollableNodeRef = useRef(null)
  const canSaveScrollRef = useRef(false)

  useLayoutEffect(() => {
    if (!sidebarVisible || !isCoreDataReady) {
      return
    }

    // Wait for the visible scroll container to be measured, then restore again
    // after the opening animation. Hidden or mounting content must not overwrite it.
    const frame = requestAnimationFrame(() => {
      const node = scrollableNodeRef.current
      if (node) {
        node.scrollTop = sidebarDrawerScrollTopState.get()
        canSaveScrollRef.current = drawerOpened
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      canSaveScrollRef.current = false
    }
  }, [sidebarVisible, isCoreDataReady, drawerOpened])

  const handleScroll = (event) => {
    if (
      canSaveScrollRef.current &&
      sidebarDrawerVisibleState.get() &&
      event.currentTarget.clientHeight > 0
    ) {
      sidebarDrawerScrollTopState.set(event.currentTarget.scrollTop)
    }
  }

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
        afterClose={() => setDrawerOpened(false)}
        afterOpen={() => setDrawerOpened(true)}
        className="sidebar-drawer"
        closable={false}
        footer={null}
        placement="left"
        title={null}
        visible={sidebarVisible}
        width={240}
        onCancel={() => setSidebarDrawerVisible(false)}
      >
        <Sidebar scrollableNodeProps={{ ref: scrollableNodeRef, onScroll: handleScroll }} />
      </Drawer>
    </div>
  )
}
