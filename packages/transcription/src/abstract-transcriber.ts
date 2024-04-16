import { Logger } from 'winston'
import { join } from 'path'
import { root } from '@peertube/peertube-node-utils'
import { TranscriptionEngine } from './transcription-engine.js'
import { TranscriptionModel } from './transcription-model.js'
import { Transcript, TranscriptFormat } from './transcript.js'
import { existsSync } from 'fs'

export abstract class AbstractTranscriber {
  public static DEFAULT_TRANSCRIPT_DIRECTORY = join(root(), 'dist', 'transcripts')

  engine: TranscriptionEngine
  logger: Logger
  transcriptDirectory: string

  constructor (
    engine: TranscriptionEngine,
    logger: Logger,
    transcriptDirectory: string = AbstractTranscriber.DEFAULT_TRANSCRIPT_DIRECTORY
  ) {
    this.engine = engine
    this.logger = logger
    this.transcriptDirectory = transcriptDirectory
  }

  detectLanguage () {
    return Promise.resolve('')
  }

  loadModel (model: TranscriptionModel) {
    if (existsSync(model.path)) { /* empty */ }
  }

  supports (model: TranscriptionModel) {
    return model.format === 'PyTorch'
  }

  abstract transcribe (mediaFilePath: string, model: TranscriptionModel, language: string, format: TranscriptFormat): Promise<Transcript>
}
