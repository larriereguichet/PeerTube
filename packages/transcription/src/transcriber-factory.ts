import { Logger, createLogger } from 'winston'
import { TranscriptionEngine } from './transcription-engine.js'
import { TransformersTranscriber, OpenaiTranscriber } from './whisper/index.js'
import { AbstractTranscriber } from './abstract-transcriber.js'

export class TranscriberFactory {
  engines: TranscriptionEngine[]

  constructor (engines: TranscriptionEngine[]) {
    this.engines = engines
  }

  createFromEngineName (engineName: string, logger: Logger = createLogger(), transcriptDirectory: string = AbstractTranscriber.DEFAULT_TRANSCRIPT_DIRECTORY) {
    const engine = this.engines.find(({ name }) => name === engineName)
    if (!engine) {
      throw new Error(`Unknow engine ${engineName}`)
    }

    const transcriberArgs: ConstructorParameters<typeof AbstractTranscriber> = [ engine, logger, transcriptDirectory ]

    switch (engineName) {
      case 'whisper':
        return new OpenaiTranscriber(...transcriberArgs)
      case 'transformers':
        return new TransformersTranscriber(...transcriberArgs)
      default:
        throw new Error(`Unimplemented engine ${engineName}`)
    }
  }
}
