import { ModelFormat } from './transcription-model.js'

/**
 * The engine, or framework.
 */
export interface TranscriptionEngine {
  name: string
  description: string
  language: string
  requirements: string[]
  type: 'binary' | 'bindings' | 'ws'
  binary?: string
  license: string
  forgeURL: string
  supportedModelFormats: ModelFormat[]

  // There could be a default models.
  // There could be a list of default models
}
