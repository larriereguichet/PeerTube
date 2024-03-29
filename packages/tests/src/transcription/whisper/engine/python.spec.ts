import { join } from 'path'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { remove, pathExistsSync } from 'fs-extra/esm.js'
import { $ } from 'execa'
import { expect } from 'chai'
import { WhisperEngine } from '@peertube/transcription'

describe('Whisper', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const vttTranscriptPath = join(transcriptDirectory, 'test.vtt')

  it('Should be present on the system', async function () {
    await $`whisper`
  })

  it('Should run transcription on a media file without raising any errors', async function () {
    const mediaFilePath = buildAbsoluteFixturePath('video_short.mp4')
    const whisperEngine = new WhisperEngine({ transcriptDirectory })
    await whisperEngine.transcribe('tiny', mediaFilePath)
  })

  it('Should be create a vtt transcript file', async function () {
    const mediaFilePath = buildAbsoluteFixturePath('video_very_long_10p.mp4')
    const whisperEngine = new WhisperEngine({ transcriptDirectory })
    const { } = await whisperEngine.transcribe('tiny', mediaFilePath)

    expect(pathExistsSync(vttTranscriptPath)).to.be.true
  })

  after(async function () {
    await remove(transcriptDirectory)
  })
})
