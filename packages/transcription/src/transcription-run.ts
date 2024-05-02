import short, { UUID } from 'short-uuid'
import { createLogger, Logger } from 'winston'
import { TranscriptionModel } from './transcription-model.js'
import { TranscriptionEngine } from './transcription-engine.js'

export class TranscriptionRun {
  uuid: UUID
  engine: TranscriptionEngine
  model: TranscriptionModel
  logger: Logger

  static RUN_ID_MASK = /^([a-z0-9-]+)_([a-z0-9-]+)_([a-z0-9-/]+)/i

  constructor (engine: TranscriptionEngine, model: TranscriptionModel, logger = createLogger(), uuid?: UUID) {
    this.uuid = uuid
    this.engine = engine
    this.model = model
    this.logger = logger
  }

  static createId (engine: TranscriptionEngine, model: TranscriptionModel, uuid = short.uuid()) {
    return `${uuid}_${engine.name}_${model.name}`
  }

  static extractFromId (runId: string) {
    const [ , uuid, engineName, modelName ] = TranscriptionRun.RUN_ID_MASK.exec(runId)
    return { uuid, engineName, modelName }
  }

  get runId () {
    return TranscriptionRun.createId(this.engine, this.model, this.uuid)
  }

  start () {
    performance.mark(this.getStartPerformanceMarkName())
  }

  stop () {
    try {
      performance.mark(this.getEndPerformanceMarkName())
      performance.measure(
        this.runId,
        this.getStartPerformanceMarkName(),
        this.getEndPerformanceMarkName()
      )
    } catch (e) {
      this.logger.log({ level: 'error', message: e })
    }
  }

  getStartPerformanceMarkName () {
    return `${this.runId}-started`
  }

  getEndPerformanceMarkName () {
    return `${this.runId}-ended`
  }
}
