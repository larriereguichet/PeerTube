import assert from 'node:assert'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import { $ } from 'execa'
import { TranscriptionModel } from '../../transcription-model.js'
import { Transcript, TranscriptFormat } from '../../transcript.js'
import { AbstractTranscriber } from '../../abstract-transcriber.js'
import { getFileInfo } from '../../file-utils.js'

export class WhisperTimestampedTranscriber extends AbstractTranscriber {
  async transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<Transcript> {
    this.createPerformanceMark()

    const $$ = $({ verbose: true })
    const { baseName, name } = getFileInfo(mediaFilePath)
    await $$`whisper_timestamped ${[
      mediaFilePath,
      '--model',
      model.name,
      '--output_format',
      'all',
      '--output_dir',
      this.transcriptDirectory
    ]}`

    const internalTranscriptPath = join(this.transcriptDirectory, `${name}.${format}`)
    const transcriptPath = join(this.transcriptDirectory, `${baseName}.${format}`)
    assert(existsSync(internalTranscriptPath), '')
    await rename(internalTranscriptPath, transcriptPath)

    this.measurePerformanceMark()

    return {
      language,
      path: transcriptPath,
      format
    }
  }
}
