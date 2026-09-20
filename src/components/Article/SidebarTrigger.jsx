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

const SCROLL_RESTORE_EPSILON_PX = 1
const SCROLL_RESTORE_TIMEOUT_MS = 500
const SCROLL_RESTORE_GUARD_MS = 400

const tryRestoreSidebarScroll = (node, target) => {
  if (!node || node.clientHeight <= 0) {
    return false
  }

  // iOS often ignores the first assignment after `display: none`.
  node.scrollTop = target
  node.scrollTop = target

  if (target <= 0) {
    return true
  }

  const maxScrollTop = node.scrollHeight - node.clientHeight
  if (maxScrollTop + SCROLL_RESTORE_EPSILON_PX < target) {
    return false
  }

  return Math.abs(node.scrollTop - target) <= SCROLL_RESTORE_EPSILON_PX
}

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarDrawerVisibleState)
  const { isCoreDataReady } = useStore(dataState)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const scrollableNodeRef = useRef(null)
  const canSaveScrollRef = useRef(false)
  const restoringRef = useRef(false)
  const restoreGuardUntilRef = useRef(0)

  useLayoutEffect(() => {
    if (!sidebarVisible || !isCoreDataReady) {
      canSaveScrollRef.current = false
      restoringRef.current = false
      return
    }

    canSaveScrollRef.current = false
    restoringRef.current = true

    let cancelled = false
    let frameId = 0
    const startedAt = performance.now()

    const restoreFrame = () => {
      if (cancelled) {
        return
      }

      const node = scrollableNodeRef.current
      const target = sidebarDrawerScrollTopState.get()
      const restored = node ? tryRestoreSidebarScroll(node, target) : false
      const timedOut = performance.now() - startedAt >= SCROLL_RESTORE_TIMEOUT_MS

      if (drawerOpened && (restored || timedOut)) {
        restoringRef.current = false
        canSaveScrollRef.current = true
        restoreGuardUntilRef.current = performance.now() + SCROLL_RESTORE_GUARD_MS
        return
      }

      frameId = globalThis.requestAnimationFrame(restoreFrame)
    }

    frameId = globalThis.requestAnimationFrame(restoreFrame)

    return () => {
      cancelled = true
      globalThis.cancelAnimationFrame(frameId)
      canSaveScrollRef.current = false
      restoringRef.current = false
    }
  }, [sidebarVisible, isCoreDataReady, drawerOpened])

  const handleScroll = (event) => {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget

    if (clientHeight <= 0 || !sidebarDrawerVisibleState.get() || restoringRef.current) {
      return
    }

    const storedTop = sidebarDrawerScrollTopState.get()
    const withinGuardWindow = performance.now() < restoreGuardUntilRef.current
    if (
      withinGuardWindow &&
      storedTop > 0 &&
      scrollTop === 0 &&
      scrollHeight - clientHeight >= storedTop
    ) {
      event.currentTarget.scrollTop = storedTop
      return
    }

    if (!canSaveScrollRef.current) {
      return
    }

    sidebarDrawerScrollTopState.set(scrollTop)
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
        autoFocus={false}
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
