import { Button, Notification, Typography } from "@arco-design/web-react"
import { IconEmpty, IconLaunch, IconLeft, IconRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { useSwipeable } from "react-swipeable"

import FooterPanel from "./FooterPanel"

import { getEntry } from "@/apis"
import ActionButtons from "@/components/Article/ActionButtons"
import ArticleDetail from "@/components/Article/ArticleDetail"
import ArticleList from "@/components/Article/ArticleList"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
import SwipeOpenLinkPrompt from "@/components/Content/SwipeOpenLinkPrompt"
import FadeTransition from "@/components/ui/FadeTransition"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useContentContext from "@/hooks/useContentContext"
import useContentHotkeys from "@/hooks/useContentHotkeys"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  setActiveContent,
  setInfoFrom,
  setInfoId,
  setIsArticleLoading,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { duplicateHotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"
import { setSidebarDrawerVisible } from "@/store/sidebarState"

import "./Content.css"

const SIDEBAR_SWIPE_EDGE_WIDTH = 32
const SIDEBAR_SWIPE_MIN_DISTANCE = 56

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, entries, filterDate, filterString, isArticleLoading } =
    useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const {
    enableSwipeGesture,
    enableSwipeLeftToOpenLink,
    orderBy,
    orderDirection,
    showStatus,
    swipeSensitivity,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const [swipeOpenLinkPromptVisible, setSwipeOpenLinkPromptVisible] = useState(false)
  const cardsRef = useRef(null)

  const location = useLocation()
  const params = useParams()

  useDocumentTitle()

  const { entryDetailRef, entryListRef, handleEntryClick } = useContentContext()

  const {
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    showHotkeysSettings,
  } = useKeyHandlers()

  const { fetchAppData, fetchFeedRelatedData } = useAppData()
  const { fetchArticleList } = useArticleList(info, getEntries)
  const { isBelowMedium } = useScreenWidth()

  const fetchArticleListOnly = async () => {
    await (isAppDataReady ? fetchArticleList(getEntries) : fetchAppData())
  }

  const fetchArticleListWithRelatedData = async () => {
    await (isAppDataReady
      ? Promise.all([fetchArticleList(getEntries), fetchFeedRelatedData()])
      : fetchAppData())
  }

  const fetchSingleEntry = async (entryId) => {
    const existingEntry = entries.find((entry) => entry.id === Number(entryId))

    if (existingEntry) {
      setActiveContent(existingEntry)
      return
    }

    try {
      setIsArticleLoading(true)
      const entry = await getEntry(entryId)
      setActiveContent(entry)
    } catch (error) {
      console.error("Failed to fetch entry:", error)
    } finally {
      setIsArticleLoading(false)
    }
  }

  useContentHotkeys({ handleRefreshArticleList: fetchArticleListWithRelatedData })

  const handleSwiping = (eventData) => {
    setIsSwipingLeft(eventData.dir === "Left")
    setIsSwipingRight(!enableSwipeLeftToOpenLink && eventData.dir === "Right")
  }

  const handleSwiped = () => {
    setIsSwipingLeft(false)
    setIsSwipingRight(false)
  }

  const handleSwipeLeft = useCallback(() => {
    if (enableSwipeLeftToOpenLink) {
      if (isBelowMedium) {
        setSwipeOpenLinkPromptVisible(true)
      } else {
        openLinkExternally()
      }
      return
    }
    navigateToNextArticle()
  }, [enableSwipeLeftToOpenLink, isBelowMedium, navigateToNextArticle, openLinkExternally])

  const handleSwipeRight = useCallback(() => {
    if (enableSwipeLeftToOpenLink) {
      return
    }
    navigateToPreviousArticle()
  }, [enableSwipeLeftToOpenLink, navigateToPreviousArticle])

  const handlers = useSwipeable({
    delta: 50 / swipeSensitivity,
    onSwiping: enableSwipeGesture
      ? (eventData) => {
          if (globalThis.getSelection().toString()) {
            return
          }
          handleSwiping(eventData)
        }
      : undefined,
    onSwiped: enableSwipeGesture ? handleSwiped : undefined,
    onSwipedLeft: enableSwipeGesture ? handleSwipeLeft : undefined,
    onSwipedRight: enableSwipeGesture && !enableSwipeLeftToOpenLink ? handleSwipeRight : undefined,
  })

  const sidebarSwipeHandlers = useSwipeable({
    delta: SIDEBAR_SWIPE_MIN_DISTANCE,
    onSwipedRight: ({ initial }) => {
      if (
        isBelowMedium &&
        !params.entryId &&
        !activeContent &&
        initial[0] <= SIDEBAR_SWIPE_EDGE_WIDTH
      ) {
        setSidebarDrawerVisible(true)
      }
    },
  })

  useEffect(() => {
    setSwipeOpenLinkPromptVisible(false)
  }, [activeContent?.id])

  useEffect(() => {
    if (duplicateHotkeys.length > 0) {
      const id = "duplicate-hotkeys"
      Notification.error({
        id,
        title: polyglot.t("settings.duplicate_hotkeys"),
        duration: 0,
        btn: (
          <span>
            <Button
              size="small"
              style={{ marginRight: 8 }}
              type="secondary"
              onClick={() => Notification.remove(id)}
            >
              {polyglot.t("actions.dismiss")}
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                showHotkeysSettings()
                Notification.remove(id)
              }}
            >
              {polyglot.t("actions.check")}
            </Button>
          </span>
        ),
      })
    }
  }, [duplicateHotkeys, polyglot, showHotkeysSettings])

  useEffect(() => {
    setInfoFrom(info.from)
    setInfoId(info.id)
    if (activeContent) {
      setActiveContent(null)
    }
    if (info.from === "category") {
      fetchArticleListWithRelatedData()
    } else {
      fetchArticleListOnly()
    }
  }, [info.from, info.id])

  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      return
    }
    fetchArticleListOnly()
  }, [orderBy])

  useEffect(() => {
    fetchArticleListOnly()
  }, [filterDate, filterString, orderDirection, showStatus])

  useEffect(() => {
    if (isBelowMedium && activeContent) {
      const { entryId } = params
      if (!entryId) {
        setActiveContent(null)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    const { entryId } = params
    if (entryId) {
      if (!activeContent || activeContent.id !== Number(entryId)) {
        fetchSingleEntry(entryId)
      }
    } else if (activeContent) {
      setActiveContent(null)
    }
  }, [params])

  return (
    <>
      <div
        {...sidebarSwipeHandlers}
        className="entry-col"
        style={{
          opacity: isBelowMedium && isArticleLoading ? 0 : 1,
        }}
      >
        <SearchAndSortBar />
        <ArticleList
          ref={entryListRef}
          cardsRef={cardsRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
        />
        <FooterPanel
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={fetchArticleListWithRelatedData}
        />
      </div>
      {activeContent ? (
        <div className="article-container content-wrapper" {...handlers}>
          {!isBelowMedium && <ActionButtons />}
          {isArticleLoading ? (
            <div style={{ flex: 1 }} />
          ) : (
            <>
              <AnimatePresence>
                {isSwipingRight && (
                  <FadeTransition key="swipe-hint-left" className="swipe-hint left">
                    <IconLeft style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
                {isSwipingLeft && (
                  <FadeTransition key="swipe-hint-right" className="swipe-hint right">
                    {enableSwipeLeftToOpenLink ? (
                      <IconLaunch style={{ fontSize: 24 }} />
                    ) : (
                      <IconRight style={{ fontSize: 24 }} />
                    )}
                  </FadeTransition>
                )}
              </AnimatePresence>
              <ArticleDetail ref={entryDetailRef} />
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div className="content-empty content-wrapper">
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title heading={6} style={{ color: "var(--color-text-3)", marginTop: "10px" }}>
            ReactFlux
          </Typography.Title>
        </div>
      )}
      <SwipeOpenLinkPrompt
        polyglot={polyglot}
        title={activeContent?.title}
        url={activeContent?.url}
        visible={swipeOpenLinkPromptVisible}
        onClose={() => setSwipeOpenLinkPromptVisible(false)}
      />
    </>
  )
}

export default Content
