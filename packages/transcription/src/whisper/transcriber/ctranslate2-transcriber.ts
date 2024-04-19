import { join } from 'path'
import { $ } from 'execa'
import { TranscriptionModel } from '../../transcription-model.js'
import { Transcript, TranscriptFormat } from '../../transcript.js'
import { AbstractTranscriber } from '../../abstract-transcriber.js'
import { getFileInfo } from '../../file-utils.js'

export class Ctranslate2Transcriber extends AbstractTranscriber {
  async transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<Transcript> {
    this.createPerformanceMark()
    const $$ = $({ verbose: true })
    const { baseName } = getFileInfo(mediaFilePath)

    await $$`whisper-ctranslate2 ${[
      mediaFilePath,
      '--model',
      model.name,
      '--output_format',
      'all',
      '--output_dir',
      this.transcriptDirectory
    ]}`

    this.measurePerformanceMark()

    return {
      language,
      path: join(this.transcriptDirectory, `${baseName}.${format}`),
      format
    }
  }
}
