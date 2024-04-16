import { TranscriptionModel } from '../../transcription-model.js'
import { AbstractTranscriber } from '../../abstract-transcriber.js'
import { Transcript, TranscriptFormat } from '../../transcript.js'

export class TransformersTranscriber extends AbstractTranscriber {
  async transcribe (
    mediaFilePath: string,
    model: TranscriptionModel,
    language: string,
    format: TranscriptFormat = 'vtt'
  ): Promise<Transcript> {
    return Promise.resolve(undefined)
  }
}
