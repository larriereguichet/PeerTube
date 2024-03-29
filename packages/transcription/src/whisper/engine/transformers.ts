import { TranscriptionEngine } from '../../transcription-engine.js'
import { TranscriptionModel } from '../../transcription-model.js'
import { existsSync } from 'fs'
import { TranscriptionResult } from '../../transcription-result.js'
import { Promise } from 'bluebird'

export class Transformers implements TranscriptionEngine {
  name = 'transformers'
  description = 'High-performance inference of OpenAI\'s Whisper automatic speech recognition model'
  type: 'binary'
  language = 'cpp'
  requirements = []
  forgeURL = 'https://github.com/ggerganov/whisper.cpp'
  license = 'MIT'

  supports (model: TranscriptionModel) {
    return true
  }

  detectLanguage () {
    return Promise.resolve('')
  }

  loadModel (model: TranscriptionModel) {
    if (existsSync(model.path)) { /* empty */ }
  }

  transcribe (
    model: TranscriptionModel | string,
    mediaFilePath: string,
    language: string,
    outputFormat: string
  ): Promise<TranscriptionResult> {
    return Promise.resolve(undefined)
  }
}

export const transformers = new Transformers()
