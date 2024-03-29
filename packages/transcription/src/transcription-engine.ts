import { join } from 'path'
import { root } from '@peertube/peertube-node-utils'
import { TranscriptionModel } from './transcription-model.js'
import { TranscriptionResult } from './transcription-result.js'

export abstract class TranscriptionEngine {
  public name: string
  public description: string
  public language: string
  public requirements: string[]
  public type: 'binary' | 'bindings' | 'ws'
  public license: string
  public forgeURL: string

  public static DEFAULT_TRANSCRIPT_DIRECTORY = join(root(), 'dist', 'transcripts')
  // There could be a default models.
  // There could be a list of default models

  public abstract transcribe (
    model: TranscriptionModel | string,
    mediaFilePath: string,
    language: string,
    outputFormat: string
  ): Promise<TranscriptionResult>
  public abstract loadModel (model: TranscriptionModel)
  public abstract detectLanguage (): Promise<string>
  public abstract supports (model: TranscriptionModel): boolean

  static getModelName (model: TranscriptionModel | string) {
    return typeof model === 'string' ? model : model.name
  }
}
