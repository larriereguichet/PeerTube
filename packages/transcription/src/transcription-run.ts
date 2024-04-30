import short from 'short-uuid'
import { createLogger, Logger } from 'winston'
import { TranscriptionModel } from './transcription-model.js'
import { TranscriptionEngine } from './transcription-engine.js'

export class TranscriptionRun {
  id: string
  engine: TranscriptionEngine
  model: TranscriptionModel
  logger: Logger

  static RUN_ID_MASK = /^([a-zA-Z0-9-]+)_([a-zA-Z0-9-]+)_([a-zA-Z0-9-/]+)/gm

  constructor (engine: TranscriptionEngine, model: TranscriptionModel, logger = createLogger()) {
    this.engine = engine
    this.model = model

    this.id = TranscriptionRun.createId(engine, model)
    this.logger = logger
  }

  static createId (engine: TranscriptionEngine, model: TranscriptionModel) {
    return `${short.uuid()}_${engine.name}_${model.name}`
  }

  static extractFromId (runId: string) {
    const [ , id, engineName, modelName ] = TranscriptionRun.RUN_ID_MASK.exec(runId)
    return { id, engineName, modelName }
  }

  start () {
    performance.mark(this.getStartPerformanceMarkName())
  }

  stop () {
    try {
      performance.mark(this.getEndPerformanceMarkName())
      performance.measure(
        this.id,
        this.getStartPerformanceMarkName(),
        this.getEndPerformanceMarkName()
      )
    } catch (e) {
      this.logger.log({ level: 'error', message: e })
    }
  }

  getStartPerformanceMarkName () {
    return `${this.id}-started`
  }

  getEndPerformanceMarkName () {
    return `${this.id}-ended`
  }
}
