import { createLogger } from 'winston'
import { join } from 'path'
import { expect } from 'chai'
import { remove, pathExistsSync } from 'fs-extra/esm.js'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { transcriberFactory } from '@peertube/transcription'

describe('Open AI Transcriber', function () {

  const transcriptDirectory = join(root(), 'test-transcript')
  const vttTranscriptPath = join(transcriptDirectory, 'test.vtt')

  it('Should instanciate', function () {
    transcriberFactory.createFromEngineName('faster-whisper')
  })

  it('Should run transcription on a media file without raising any errors', async function () {
    const transcriber = transcriberFactory.createFromEngineName('openai-whisper', createLogger(), transcriptDirectory)
    const mediaFilePath = buildAbsoluteFixturePath('video_short.mp4')
    const transcript = await transcriber.transcribe(mediaFilePath, { name: 'tiny' }, 'fr', 'vtt')
    expect(transcript.path).to.equals(vttTranscriptPath)
    expect(pathExistsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist`)
  })

  after(async function () {
    await remove(transcriptDirectory)
  })
})
