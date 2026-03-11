import { Divider, Input } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"

const AISettings = () => {
  const { openaiBaseUrl, openaiApiKey, openaiModel } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  return (
    <>
      <SettingItem
        description={polyglot.t("settings.openai_base_url_description")}
        title={polyglot.t("settings.openai_base_url_label")}
      >
        <Input
          className="input-select"
          placeholder="https://api.openai.com"
          value={openaiBaseUrl}
          onChange={(value) => updateSettings({ openaiBaseUrl: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.openai_api_key_description")}
        title={polyglot.t("settings.openai_api_key_label")}
      >
        <Input.Password
          className="input-select"
          placeholder="sk-..."
          value={openaiApiKey}
          onChange={(value) => updateSettings({ openaiApiKey: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.openai_model_description")}
        title={polyglot.t("settings.openai_model_label")}
      >
        <Input
          className="input-select"
          placeholder="gpt-4o-mini"
          value={openaiModel}
          onChange={(value) => updateSettings({ openaiModel: value })}
        />
      </SettingItem>
    </>
  )
}

export default AISettings
