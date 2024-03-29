// import { pipeline, env } from '@xenova/transformers'
import { TranscriptionModel } from '../../transcription-model.js'
import { TranscriptionEngine } from '../../transcription-engine.js'
import { TranscriptionResult } from '../../transcription-result.js'
import { Promise } from 'bluebird'

// Disable local models
// env.allowLocalModels = true

class TransformersJs implements TranscriptionEngine {
  name = 'transformers.js'
  description = ''
  requirements = []
  language = 'js'
  forgeURL: string
  license: string
  type: 'bindings'

  transcribe (
    model: TranscriptionModel | string,
    mediaFilePath: string,
    language: string, outputFormat: string): Promise<TranscriptionResult> {
    return Promise.resolve(undefined)
    // return pipeline('automatic-speech-recognition', 'no_attentions', {
    //   // For medium models, we need to load the `no_attentions` revision to avoid running out of memory
    //   revision: [].includes('/whisper-medium') ? 'no_attentions' : 'main'
    // })
  }

  detectLanguage (): Promise<string> {
    return Promise.resolve('')
  }

  loadModel (model: TranscriptionModel) {
  }

  supports (model: TranscriptionModel): boolean {
    return false
  }
}

export const transformersJs = new TransformersJs()
