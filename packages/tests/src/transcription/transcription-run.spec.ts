/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { TranscriptionRun } from '@peertube/peertube-transcription'

describe('Transcription run', function () {
  const supposedlyValidIds = [
    'a44521d0-0fb8-4ade-8002-3385545c3318_openai-whisper_tiny',
    'a44521d0-0fb8-4ade-8002-3385545c3318_openai-whisper_openai/tiny'
  ]

  it(`matches the list of supposedly valid ids`, function () {
    supposedlyValidIds.forEach((id) => {
      expect(id.match(TranscriptionRun.RUN_ID_MASK)).to.be.ok
    })
  })

  it(`creates a valid run id`, function () {
    const runId = TranscriptionRun.createId({
      name: 'engine-name',
      binary: '/bin/engine-name',
      requirements: [],
      type: 'binary',
      supportedModelFormats: []
    }, { name: 'openai/tiny' })

    expect(runId.match(TranscriptionRun.RUN_ID_MASK)).to.be.ok

    const found = TranscriptionRun.RUN_ID_MASK.exec(runId)
    expect(found[2]).to.equals('engine-name')
    expect(found[3]).to.equals('openai/tiny')
  })

  it(`extracts information from a run id`, function () {
    const runId = TranscriptionRun.createId({
      name: 'engine-name',
      binary: '/bin/engine-name',
      requirements: [],
      type: 'binary',
      supportedModelFormats: []
    }, { name: 'openai/tiny' })

    expect(runId.match(TranscriptionRun.RUN_ID_MASK)).to.be.ok

    const { engineName, modelName } = TranscriptionRun.extractFromId(runId)
    expect(engineName).to.equals('engine-name')
    expect(modelName).to.equals('openai/tiny')

  })
})
