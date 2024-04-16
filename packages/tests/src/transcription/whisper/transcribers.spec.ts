import { createLogger } from 'winston'
import { join } from 'path'
import { expect } from 'chai'
import { remove, pathExistsSync } from 'fs-extra/esm'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { transcriberFactory } from '@peertube/peertube-transcription'

describe('Transcribers', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const vttTranscriptPath = join(transcriptDirectory, 'test.vtt')
  const transcribers = [
    'openai-whisper',
    'faster-whisper'
  ]

  transcribers.forEach(function (transcriber) {
    it(`Should instanciate a ${transcriber} transcriber`, function () {
      transcriberFactory.createFromEngineName('openai-whisper')
    })

    it('Should run transcription on a media file without raising any errors', async function () {
      const transcriber = transcriberFactory.createFromEngineName('openai-whisper', createLogger(), transcriptDirectory)
      const mediaFilePath = buildAbsoluteFixturePath('video_short.mp4')
      const transcript = await transcriber.transcribe(mediaFilePath, { name: 'tiny' }, 'fr', 'vtt')
      expect(transcript.path).to.equals(vttTranscriptPath)
      expect(pathExistsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist`)
    })

  })

  after(async function () {
    await remove(transcriptDirectory)
  })
})
