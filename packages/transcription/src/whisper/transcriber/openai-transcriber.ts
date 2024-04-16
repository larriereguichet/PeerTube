import { join } from 'path'
import { $ } from 'execa'
import { TranscriptionModel } from '../../transcription-model.js'
import { Transcript, TranscriptFormat } from '../../transcript.js'
import { AbstractTranscriber } from '../../abstract-transcriber.js'

export class OpenaiTranscriber extends AbstractTranscriber {
  async transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<Transcript> {
    const $$ = $({ verbose: true })

    await $$`whisper ${[
      mediaFilePath,
      '--model',
      model.name,
      '--output_format',
      'all',
      '--output_dir',
      this.transcriptDirectory
    ]}`

    await $$`ls ${this.transcriptDirectory}`

    return {
      language,
      path: join(this.transcriptDirectory, `test.${format}`),
      format
    }
  }
}
