import { existsSync } from 'fs'
import { join } from 'path'
import { ChildProcess } from 'child_process'
import { $ } from 'execa'
import { TranscriptionEngine } from '../../transcription-engine.js'
import { TranscriptionModel } from '../../transcription-model.js'
import { TranscriptionResult } from '../../transcription-result.js'

type TranscriptFormat = 'txt' | 'vtt' | 'srt'

export class WhisperEngine implements TranscriptionEngine {
  name: 'whisper'
  description: 'High-performance inference of OpenAI\'s Whisper automatic speech recognition model'
  requirements: ['python', 'pyTorch', 'ffmpeg']
  language: 'python'
  type: 'binary'
  binary: string
  forgeURL: 'https://github.com/openai/whisper'
  license: 'MIT'
  process?: ChildProcess
  transcriptDirectory: string

  public constructor (transcriptDirectory: WhisperEngine['transcriptDirectory'] = TranscriptionEngine.DEFAULT_TRANSCRIPT_DIRECTORY) {
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

  async transcribe (
    model: TranscriptionModel | string,
    mediaFilePath: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<TranscriptionResult> {
    const $$ = $({ verbose: true })

    await $$`whisper ${[
      mediaFilePath,
      '--model',
      TranscriptionEngine.getModelName(model),
      '--output_format',
      'all',
      '--output_dir',
      this.transcriptDirectory
    ]}`

    await $$`ls ${this.transcriptDirectory}`

    return {
      language: '',
      transcriptFilePath: join(this.transcriptDirectory, `test.${format}`)
    }
  }
}

export const whisperEngine = new WhisperEngine()
