import { Divider, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import { useInView } from "react-intersection-observer"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import ArticleCard from "./ArticleCard"
import LoadingCards from "./LoadingCards"

import FadeTransition from "@/components/ui/FadeTransition"
import Ripple from "@/components/ui/Ripple"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { IS_IOS_SAFARI } from "@/utils/platform"

import "./ArticleList.css"

const LoadMoreComponent = ({ getEntries }) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)

  const { loadingMore, handleLoadMore } = useLoadMore()

  const { ref: loadMoreRef, inView } = useInView()

  const loadMoreEntries = useCallback(async () => {
    if (loadMoreVisible && inView && isArticleListReady && !loadingMore) {
      await handleLoadMore(getEntries)
    }
  }, [loadMoreVisible, inView, isArticleListReady, loadingMore, handleLoadMore, getEntries])

  useEffect(() => {
    const intervalId = setInterval(loadMoreEntries, 500)

    return () => clearInterval(intervalId)
  }, [loadMoreEntries])

  return (
    isArticleListReady &&
    loadMoreVisible && (
      <div ref={loadMoreRef} className="load-more-container">
        <Spin loading={loadingMore} style={{ paddingRight: "10px" }} />
        Loading more ...
      </div>
    )
  )
}

const ArticleList = forwardRef(({ getEntries, handleEntryClick, cardsRef }, ref) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const wrapperRef = useRef(null)
  const simpleBarRef = useRef(null)

  const { loadingMore, handleLoadMore } = useLoadMore()
  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  useImperativeHandle(ref, () => {
    if (IS_IOS_SAFARI) {
      return {
        contentWrapperEl: cardsRef.current,
        el: wrapperRef.current,
      }
    }

    return simpleBarRef.current
  }, [cardsRef])

  const checkAndLoadMore = useMemo(
    () =>
      throttle((element) => {
        if (!canLoadMore) {
          return
        }

        const threshold = element.scrollHeight * 0.8
        const scrolledDistance = element.scrollTop + element.clientHeight
        if (scrolledDistance >= threshold) {
          handleLoadMore(getEntries)
        }
      }, 200),
    [canLoadMore, handleLoadMore, getEntries],
  )

  const handleScroll = useCallback(
    (event) => {
      checkAndLoadMore(event.currentTarget)
    },
    [checkAndLoadMore],
  )

  const renderEntries = () =>
    filteredEntries.map((entry, index) => (
      <div key={entry.id}>
        <ArticleCard entry={entry} handleEntryClick={handleEntryClick} scrollRootRef={cardsRef}>
          <Ripple color="var(--color-text-4)" duration={1000} />
        </ArticleCard>
        {index < filteredEntries.length - 1 && (
          <Divider
            style={{
              margin: "6px 0",
              borderBottom: "1px solid var(--color-border-2)",
            }}
          />
        )}
      </div>
    ))

  const listBody = (
    <>
      <LoadingCards />
      {isArticleListReady && (
        <FadeTransition y={20}>
          {IS_IOS_SAFARI ? (
            renderEntries()
          ) : (
            <Virtualizer
              overscan={10}
              scrollRef={cardsRef}
              onScroll={() => {
                const element = cardsRef.current
                if (element) {
                  checkAndLoadMore(element)
                }
              }}
            >
              {renderEntries()}
            </Virtualizer>
          )}
        </FadeTransition>
      )}
      <LoadMoreComponent getEntries={getEntries} />
    </>
  )

  if (IS_IOS_SAFARI) {
    return (
      <div ref={wrapperRef} className="entry-list-wrapper">
        <div ref={cardsRef} className="entry-list entry-list-native" onScroll={handleScroll}>
          {listBody}
        </div>
      </div>
    )
  }

  return (
    <SimpleBar ref={simpleBarRef} className="entry-list" scrollableNodeProps={{ ref: cardsRef }}>
      {listBody}
    </SimpleBar>
  )
})
ArticleList.displayName = "ArticleList"

export default ArticleList
