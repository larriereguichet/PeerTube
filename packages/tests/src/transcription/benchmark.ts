import { CpuInfo, cpus } from 'os'
import { TranscriptionEngine } from '@peertube/transcription'

const WER_TOLERANCE = 1
const CER_TOLERANCE = 1

interface TestResult {
  WER: number
  CER: number
  duration: number
  engine: TranscriptionEngine
  dataThroughput: number // relevant ?
  cpus: CpuInfo[]
}

// var os = require('os');
//
console.log(cpus())
// console.log(os.totalmem());
// console.log(os.freemem())

const testsResults: Record<string, TestResult> = {
  cpus: []
}

async function testTranscriptGeneration (transformerBackend: string, model: string, mediaFilePath: string) {
  const testResults = {
    WER: 3,
    CER: 3,
    duration: 3
  }

  return testResults
}
