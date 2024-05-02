import { createLogger } from 'winston'
import short, { UUID } from 'short-uuid'
import { performance, PerformanceObserver } from 'node:perf_hooks'
// import { CpuInfo, CpuUsage } from 'node:os'
import { rm, mkdir } from 'node:fs/promises'
import { buildAbsoluteFixturePath } from '@peertube/peertube-node-utils'
import {
  toHumanReadable,
  transcriberFactory,
  TranscriptFile,
  TranscriptFileEvaluator,
  TranscriptionEngine, TranscriptionRun
} from '@peertube/peertube-transcription'

interface TestResult {
  uuid: string
  WER: number
  CER: number
  duration: number
  engine: TranscriptionEngine
  model: string
  // dataThroughput: number // relevant ?
  // cpus: CpuInfo[] // https://nodejs.org/docs/latest-v18.x/api/os.html#oscpus
  // cpuUsages: CpuUsage[] // https://nodejs.org/docs/latest-v18.x/api/process.html#processcpuusagepreviousvalue
  // // os.totalmem()
  // // os.freemem()
  // memoryUsages: Record<number, MemoryUsage> // https://nodejs.org/docs/latest-v18.x/api/process.html#processmemoryusage
}

type Benchmark = Record<UUID, Partial<TestResult>>

const benchmarkReducer = (benchmark: Benchmark = {}, uuid: string, testResult: Partial<TestResult>) => ({
  ...benchmark,
  [uuid]:  {
    ...benchmark[uuid],
    ...testResult
  }
})

interface FormattedTestResult {
  WER?: string
  CER?: string
  duration?: string
  model?: string
}

const formatTestResult = ({ WER, CER, duration, model }: Partial<TestResult>): FormattedTestResult => ({
  WER: WER ? `${WER * 100}%` : undefined,
  CER: CER ? `${CER * 100}%` : undefined,
  duration: duration ? toHumanReadable(duration) : undefined,
  model
})

describe('Transcribers benchmark', function () {
  const transcribers = [
    'openai-whisper',
    'whisper-ctranslate2',
    'whisper-timestamped'
  ]
  const models = [
    'tiny',
    'small'
  ]

  const transcriptDirectory = buildAbsoluteFixturePath('transcription/benchmark/')
  const mediaFilePath = buildAbsoluteFixturePath('transcription/videos/communiquer-lors-dune-classe-transplantee.mp4')
  const referenceTranscriptFile = new TranscriptFile({
    path: buildAbsoluteFixturePath('transcription/transcript/reference.txt'),
    language: 'fr',
    format: 'txt'
  })

  let benchmark: Record<string, Partial<TestResult>> = {}

  before(async function () {
    await mkdir(transcriptDirectory, { recursive: true })

    const performanceObserver = new PerformanceObserver((items) => {
      items
        .getEntries()
        .forEach((entry) => {
          const { uuid } = TranscriptionRun.extractFromId(entry.name)

          benchmark = benchmarkReducer(benchmark, uuid, {
            duration: entry.duration
          })
        })
    })
    performanceObserver.observe({ type: 'measure' })
  })

  transcribers.forEach(function (transcriberName) {
    describe(`Creates a ${transcriberName} transcriber for the benchmark`, function () {
      const transcriber = transcriberFactory.createFromEngineName(
        transcriberName,
        createLogger(),
        transcriptDirectory
      )

      models.forEach((modelName) => {
        it(`Run ${transcriberName} transcriber benchmark with ${modelName} model`, async function () {
          this.timeout(1000000)
          const model = { name: modelName }
          const uuid = short.uuid()
          const transcriptFile = await transcriber.transcribe(mediaFilePath, model, 'fr', 'txt', uuid)
          const evaluator = new TranscriptFileEvaluator(referenceTranscriptFile, transcriptFile)
          await new Promise(resolve => setTimeout(resolve, 1))

          benchmark = benchmarkReducer(benchmark, uuid, {
            engine: transcriber.engine,
            WER: await evaluator.wer(),
            CER: await evaluator.cer(),
            model: model.name
          })
        })
      })
    })
  })

  after(async function () {
    console.table(
      Object
        .keys(benchmark)
        .reduce((formattedBenchmark, engineName, currentIndex, array) => ({
          ...formattedBenchmark,
          [engineName]: formatTestResult(benchmark[engineName])
        }), {})
    )

    await rm(transcriptDirectory, { recursive: true, force: true })

    performance.clearMarks()
  })
})
