import { createLogger } from 'winston'
import { join } from 'path'
import { expect, config } from 'chai'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { OpenaiTranscriber, WhisperTimestampedTranscriber } from '@peertube/peertube-transcription'

config.truncateThreshold = 0

describe('Linto timestamped Whisper transcriber', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const shortVideoPath = buildAbsoluteFixturePath('video_short.mp4')
  const transcriber = new WhisperTimestampedTranscriber(
    {
      name: 'whisper-timestamped',
      requirements: [],
      type: 'binary',
      binary: 'whisper_timestamped',
      supportedModelFormats: [ 'PyTorch' ]
    },
    createLogger(),
    transcriptDirectory
  )

  before(async function () {
    await mkdir(transcriptDirectory, { recursive: true })
  })

  it('Should transcribe a media file and produce transcript file in th `vtt` format by default', async function () {
    const transcript = await transcriber.transcribe(
      shortVideoPath,
      { name: 'tiny' },
      'fr',
      'vtt'
    )

    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'video_short.vtt'),
      language: 'fr',
      format: 'vtt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true

    // Whisper timestamped should produce a transcript with micro seconds precisions.
    expect(await readFile(transcript.path, 'utf8')).to.equal(
      `WEBVTT

00:02.480 --> 00:02.500
you

`
    )
  })

  it('May produce a transcript file in the `srt` format', async function () {
    const transcript = await transcriber.transcribe(shortVideoPath, { name: 'tiny' }, 'en', 'srt')
    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'video_short.srt'),
      language: 'en',
      format: 'srt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(
      `1
00:00:02,480 --> 00:00:02,500
you

`
    )
  })

  it('May produce a transcript file in `txt` format', async function () {
    const transcript = await transcriber.transcribe(shortVideoPath, { name: 'tiny' }, 'en', 'txt')
    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'video_short.txt'),
      language: 'en',
      format: 'txt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(`You
  `)
  })

  it('Should produce the same transcript text as openai-whisper given the same parameters', async function () {
    const transcribeArguments: Parameters<typeof transcriber.transcribe> = [
      shortVideoPath,
      { name: 'tiny' },
      'en',
      'txt'
    ]
    const transcript = await transcriber.transcribe(...transcribeArguments)
    const openaiTranscriber = new OpenaiTranscriber(
      {
        name: 'openai-whisper',
        requirements: [],
        type: 'binary',
        binary: 'whisper',
        supportedModelFormats: [ 'PyTorch' ]
      },
      createLogger(),
      join(transcriptDirectory, 'openai-whisper')
    )
    const openaiTranscript = await openaiTranscriber.transcribe(...transcribeArguments)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(await readFile(openaiTranscript.path, 'utf8'))
  })

  after(async function () {
    await rm(transcriptDirectory, { recursive: true, force: true })
  })
})
