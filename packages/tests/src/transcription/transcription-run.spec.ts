/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { TranscriptionRun } from '@peertube/peertube-transcription'
import { UUID } from 'short-uuid'

describe('Transcription run', function () {
  const supposedlyValidIds = [
    'a44521d0-0fb8-4ade-8002-3385545c3318_openai-whisper_tiny',
    'a44521d0-0fb8-4ade-8002-3385545c3318_openai-whisper_openai/tiny',
    '0f229848-b709-4373-a49c-80dcc0d39e2a_whisper-ctranslate2_tiny'
  ]

  it(`matches the list of supposedly valid ids`, function () {
    supposedlyValidIds.forEach((id) => {
      expect(id.match(TranscriptionRun.RUN_ID_MASK)).to.be.ok
      expect(TranscriptionRun.extractFromId(id)).to.be.ok
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
    // Because it's a "Branded primitive"
    // https://github.com/microsoft/TypeScript/wiki/FAQ#can-i-make-a-type-alias-nominal
    const expectedUuid = 'a44521d0-0fb8-4ade-8002-3385545c3318' as UUID
    const runId = TranscriptionRun.createId({
      name: 'engine-name',
      binary: '/bin/engine-name',
      requirements: [],
      type: 'binary',
      supportedModelFormats: []
    }, { name: 'openai/tiny' }, expectedUuid)

    expect(runId.match(TranscriptionRun.RUN_ID_MASK)).to.be.ok

    const { uuid, engineName, modelName } = TranscriptionRun.extractFromId(runId)
    expect(uuid).to.equals(expectedUuid)
    expect(engineName).to.equals('engine-name')
    expect(modelName).to.equals('openai/tiny')

  })
})
