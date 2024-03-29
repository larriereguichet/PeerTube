import { existsSync } from 'fs'
import { TranscriptionModel } from '../../transcription-model.js'
import { TranscriptionEngine } from '../../transcription-engine.js'
import { Promise } from 'bluebird'
import { TranscriptionResult } from '../../transcription-result.js'

export class WhisperCppEngine implements TranscriptionEngine {
  name = 'transformers'
  description = 'High-performance inference of OpenAI\'s Whisper automatic speech recognition model'
  type: 'binary'
  language = 'cpp'
  requirements = []
  forgeURL = 'https://github.com/ggerganov/whisper.cpp'
  license = 'MIT'

  detectLanguage () {
    return Promise.resolve('')
  }

  loadModel (model: TranscriptionModel) {
    if (existsSync(model.path)) { /* empty */ }
  }

  supports (model: TranscriptionModel) {
    return true
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

export const whisperCppEngine = new WhisperCppEngine()
