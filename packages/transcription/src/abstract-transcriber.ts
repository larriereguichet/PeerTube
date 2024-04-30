import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { PerformanceObserver } from 'node:perf_hooks'
import { createLogger, Logger } from 'winston'
import { root } from '@peertube/peertube-node-utils'
import { TranscriptionEngine } from './transcription-engine.js'
import { TranscriptionModel } from './transcription-model.js'
import { TranscriptionRun } from './transcription-run.js'
import { TranscriptFile, TranscriptFormat } from './transcript/index.js'

export abstract class AbstractTranscriber {
  public static DEFAULT_TRANSCRIPT_DIRECTORY = join(root(), 'dist', 'transcripts')

  engine: TranscriptionEngine
  logger: Logger
  transcriptDirectory: string
  performanceObserver?: PerformanceObserver
  run?: TranscriptionRun

  constructor (
    engine: TranscriptionEngine,
    logger: Logger = createLogger(),
    transcriptDirectory: string = AbstractTranscriber.DEFAULT_TRANSCRIPT_DIRECTORY,
    performanceObserver?: PerformanceObserver
  ) {
    this.engine = engine
    this.logger = logger
    this.transcriptDirectory = transcriptDirectory
    this.performanceObserver = performanceObserver
  }

  startRun (model: TranscriptionModel) {
    this.run = new TranscriptionRun(this.engine, model, this.logger)
    this.run.start()
  }

  stopRun () {
    this.run.stop()
    delete this.run
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

  abstract transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat
  ): Promise<TranscriptFile>
}
