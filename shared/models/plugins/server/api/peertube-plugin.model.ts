import { PluginType, SettingEntries } from '@shared/models'

export interface PeerTubePlugin {
  name: string
  type: PluginType
  latestVersion: string
  version: string
  enabled: boolean
  uninstalled: boolean
  peertubeEngine: string
  description: string
  homepage: string
  settings: SettingEntries
  createdAt: Date
  updatedAt: Date
}
