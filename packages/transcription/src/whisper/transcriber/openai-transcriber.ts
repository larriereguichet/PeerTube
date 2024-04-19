import { join } from 'path'
import { $ } from 'execa'
import { TranscriptionModel } from '../../transcription-model.js'
import { Transcript, TranscriptFormat } from '../../transcript.js'
import { AbstractTranscriber } from '../../abstract-transcriber.js'
import { getFileInfo } from '../../file-utils.js'

export class OpenaiTranscriber extends AbstractTranscriber {
  async transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<Transcript> {
    // Shall we run the command with `{ shell: true }` to get the same error as in sh ?
    // ex: ENOENT => Command not found
    const $$ = $({ verbose: true })
    const { baseName } = getFileInfo(mediaFilePath)

    const { stdout } = await $$`whisper ${[
      mediaFilePath,
      '--model',
      model.name,
      '--output_format',
      'all',
      '--output_dir',
      this.transcriptDirectory
    ]}`
    console.log(stdout)

    const { stdout: lsStdout } = await $$`ls ${this.transcriptDirectory}`
    console.log(lsStdout)

    return {
      language,
      path: join(this.transcriptDirectory, `${baseName}.${format}`),
      format
    }
  }
}
