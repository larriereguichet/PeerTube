import { createLogger } from 'winston'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync } from 'node:fs'
import { rm, mkdir, readFile } from 'node:fs/promises'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { toHumanReadable, transcriberFactory } from '@peertube/peertube-transcription'
import { performance, PerformanceObserver } from 'node:perf_hooks'

// const WER_TOLERANCE = 1
// const CER_TOLERANCE = 1
//
// interface TestResult {
//   WER: number
//   CER: number
//   duration: number
//   engine: TranscriptionEngine
//   dataThroughput: number // relevant ?
//   cpus: CpuInfo[]
//   cpuUsages: CpuUsage[]
//   memoryUsages: Record<number, MemoryUsage>
//   // Prints:
//   // {
//   //  rss: 4935680,
//   //  heapTotal: 1826816,
//   //  heapUsed: 650472,
//   //  external: 49879,
//   //  arrayBuffers: 9386
//   // }
//
//   // heapTotal and heapUsed refer to V8's memory usage.
//   // external refers to the memory usage of C++ objects bound to JavaScript objects managed by V8.
//   // rss, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, including all C++ and JavaScript objects and code.
//   // arrayBuffers refers to memory allocated for ArrayBuffers and SharedArrayBuffers, including all Node.js Buffers. This is also included in the external value. When Node.js is used as an embedded library, this value may be 0 because allocations for ArrayBuffers may not be tracked in that case.
//   //
//   // When using Worker threads, rss will be a value that is valid for the entire process, while the other fields will only refer to the current thread.
//   //
//   // The process.memoryUsage() method iterates over each page to gather information about memory usage which might be slow depending on the program memory allocations.
// }
//
// // var os = require('os');
// //
// console.log(cpus())
// // console.log(os.totalmem());
// // console.log(os.freemem())
//
// const testsResults: Record<string, TestResult> = {
//   cpus: []
// }
//
// async function testTranscriptGeneration (transformerBackend: string, model: string, mediaFilePath: string) {
//   const testResults = {
//     WER: 3,
//     CER: 3,
//     duration: 3
//   }
//
//   return testResults
// }

describe('Transcribers', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const expectedVttTranscriptPath = join(transcriptDirectory, 'video_short.vtt')
  const mediaFilePath = buildAbsoluteFixturePath('video_short.mp4')
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

    // console.table
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
        const transcript = await transcriber.transcribe(
          mediaFilePath,
          { name: 'tiny' },
          'fr',
          'vtt'
        )
        expect(transcript).to.deep.equals({
          path: expectedVttTranscriptPath,
          language: 'fr',
          format: 'vtt'
        })
        expect(transcript.path).to.equals(expectedVttTranscriptPath)

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
        expect(await readFile(transcript.path, 'utf8'), `Transcript file ${transcript.path} doesn't exist.`).to.equal('...')

        await rm(transcript.path)
      })
    })
  })

  after(async function () {
    await rm(transcriptDirectory, { recursive: true, force: true })
    performance.clearMarks()
  })
})
