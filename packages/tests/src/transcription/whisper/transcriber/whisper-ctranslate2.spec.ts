import { createLogger } from 'winston'
import { join } from 'path'
import { expect, config } from 'chai'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { OpenaiTranscriber } from '@peertube/peertube-transcription'

config.truncateThreshold = 0

describe('Whisper CTranslate2 transcriber', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const expectedVttTranscriptPath = join(transcriptDirectory, 'video_short.vtt')

  before(async function () {
    await mkdir(transcriptDirectory, { recursive: true })
  })

  it('Should transcribe a media file', async function () {
    const transcriber = new OpenaiTranscriber(
      {
        name: 'whisper-ctranslate2',
        requirements: [],
        language: '',
        type: 'binary',
        license: '',
        supportedModelFormats: []
      },
      createLogger(),
      transcriptDirectory
    )
    const transcript = await transcriber.transcribe(
      buildAbsoluteFixturePath('video_short.mp4'),
      { name: 'tiny' },
      'fr',
      'vtt'
    )

    expect(transcript).to.deep.equals({
      path: expectedVttTranscriptPath,
      language: 'fr',
      format: 'vtt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(
      `WEBVTT

00:00.000 --> 00:02.000
You

`
    )
  })

  after(async function () {
    await rm(transcriptDirectory, { recursive: true, force: true })
  })
})
