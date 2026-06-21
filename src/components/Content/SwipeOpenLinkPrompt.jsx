import { Button, Typography } from "@arco-design/web-react"
import { IconLaunch } from "@arco-design/web-react/icon"
import { AnimatePresence } from "framer-motion"

import FadeTransition from "@/components/ui/FadeTransition"
import { openInNewTab } from "@/utils/dom"

import "./SwipeOpenLinkPrompt.css"

const SwipeOpenLinkPrompt = ({ polyglot, title, url, visible, onClose }) => {
  const handleOpen = () => {
    openInNewTab(url)
    onClose()
  }

  return (
    <AnimatePresence>
      {visible && url ? (
        <>
          <FadeTransition
            key="swipe-open-link-backdrop"
            className="swipe-open-link-backdrop"
            onClick={onClose}
          />
          <FadeTransition
            key="swipe-open-link-sheet"
            className="swipe-open-link-sheet"
            y={16}
            onClick={(event) => event.stopPropagation()}
          >
            <Typography.Paragraph className="swipe-open-link-sheet__title" ellipsis={{ rows: 2 }}>
              {title || polyglot.t("content.swipe_open_link_prompt_title")}
            </Typography.Paragraph>
            <Typography.Paragraph className="swipe-open-link-sheet__url" ellipsis={{ rows: 2 }}>
              {url}
            </Typography.Paragraph>
            <Button
              className="swipe-open-link-sheet__open"
              icon={<IconLaunch />}
              type="primary"
              onClick={handleOpen}
            >
              {polyglot.t("article_card.open_link_externally_tooltip")}
            </Button>
          </FadeTransition>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default SwipeOpenLinkPrompt
