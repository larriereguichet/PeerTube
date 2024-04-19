import { createLogger } from 'winston'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync } from 'node:fs'
import { rm, mkdir, readFile } from 'node:fs/promises'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { toHumanReadable, transcriberFactory } from '@peertube/peertube-transcription'
import { performance, PerformanceObserver } from 'node:perf_hooks'

describe('Transcribers', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const vttTranscriptPath = join(transcriptDirectory, 'video_short.vtt')
  const transcribers = [
    'openai-whisper',
    'whisper-ctranslate2',
    'whisper-timestamped'
  ]

  before(async function () {
    await mkdir(transcriptDirectory, { recursive: true })

    const performanceObserver = new PerformanceObserver((items) => {
      items
        .getEntries()
        .forEach((entry) => console.log(`Transcription ${entry.name} took ${toHumanReadable(entry.duration)}`))
    })
    performanceObserver.observe({ type: 'measure' })
  })

  transcribers.forEach(function (transcriberName) {
    describe(`${transcriberName}`, function () {
      it(`Should instanciate`, function () {
        transcriberFactory.createFromEngineName(transcriberName)
      })

      it('Should run transcription on a media file without raising any errors', async function () {
        const transcriber = transcriberFactory.createFromEngineName(
          transcriberName,
          createLogger(),
          transcriptDirectory
        )
        const mediaFilePath = buildAbsoluteFixturePath('video_short.mp4')
        const transcript = await transcriber.transcribe(
          mediaFilePath,
          { name: 'tiny' },
          'fr',
          'vtt'
        )
        expect(transcript).to.deep.equals({
          path: vttTranscriptPath,
          language: 'fr',
          format: 'vtt'
        })
        expect(transcript.path).to.equals(vttTranscriptPath)

        expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true

        console.log(await readFile(transcript.path, 'utf8'))
        await rm(transcript.path)
      })
    })
  })

  after(async function () {
    await rm(transcriptDirectory, { recursive: true, force: true })
    performance.clearMarks()
  })
})
