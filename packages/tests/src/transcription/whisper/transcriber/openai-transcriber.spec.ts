import { createLogger } from 'winston'
import { join } from 'path'
import { expect, config } from 'chai'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { buildAbsoluteFixturePath, root } from '@peertube/peertube-node-utils'
import { OpenaiTranscriber } from '@peertube/peertube-transcription'

config.truncateThreshold = 0

describe('Open AI Whisper transcriber', function () {
  const transcriptDirectory = join(root(), 'test-transcript')
  const shortVideoPath = buildAbsoluteFixturePath('video_short.mp4')
  const frVideoPath = buildAbsoluteFixturePath('transcription/communiquer-lors-dune-classe-transplantee.mp4')

  const transcriber = new OpenaiTranscriber(
    {
      name: 'openai-whisper',
      requirements: [],
      type: 'binary',
      binary: 'whisper',
      supportedModelFormats: [ 'PyTorch' ]
    },
    createLogger(),
    transcriptDirectory
  )

  before(async function () {
    await mkdir(transcriptDirectory, { recursive: true })
  })

  it('Should transcribe a media file and provide a valid path to a transcript file in `vtt` format by default', async function () {
    const transcript = await transcriber.transcribe(shortVideoPath)
    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'video_short.vtt'),
      language: 'en',
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
00:00:00,000 --> 00:00:02,000
You

`
    )
  })

  it('May produce a transcript file in the `txt` format', async function () {
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

  it('May transcribe a media file using a local PyTorch model', async function () {
    await transcriber.transcribe(frVideoPath, { name: 'myLocalModel', path: buildAbsoluteFixturePath('transcription/tiny.pt') }, 'fr')
  })

  it('May transcribe a media file in french', async function () {
    this.timeout(45000)
    const transcript = await transcriber.transcribe(frVideoPath, { name: 'tiny' }, 'fr', 'txt')
    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'communiquer-lors-dune-classe-transplantee.txt'),
      language: 'fr',
      format: 'txt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(
      `Communiquez lors d'une classe transplante. Utilisez les photos prises lors de cette classe pour raconter quotidiennement le séjour vécu.
C'est le scénario P-Dagujic présenté par monsieur Navoli, professeur ainsi que le 3 sur une école alimentaire de Montpellier.
La première application a utilisé ce ralame déatec. L'enseignant va alors transférer les différentes photos réalisés lors de la classe transplante.
Dans un dossier, spécifique pour que les élèves puissent le retrouver plus facilement. Il téléverse donc ses photos dans le dossier, dans le venté, dans la médiatèque de la classe.
Pour terminer, il s'assure que le dossier soit bien ouvert aux utilisateurs afin que tout le monde puisse l'utiliser.
Les élèves par la suite utilisera le blog. A partir de leurs nantes, il pourront se loi de parposte rédigeant un article d'un reinté.
Ils illustront ses articles à l'aide des photos de que mon numérique mise à n'accélier dans le venté.
Pour se faire, il pourront utiliser les diteurs avancés qui les renvèrent directement dans la médiatèque de la classe où il pourront retrouver le dossier créé par leurs enseignants.
Une fois leur article terminée, les élèves soumétront se lui-ci au professeur qui pourra soit la noté pour correction ou le public.
Ensuite, il pourront lire et commenter ce de leurs camarades ou répondre aux commentaires de la veille.
`
    )
  })

  it('May transcribe a media file in french with small model', async function () {
    this.timeout(300000)
    const transcript = await transcriber.transcribe(frVideoPath, { name: 'small' }, 'fr', 'txt')
    expect(transcript).to.deep.equals({
      path: join(transcriptDirectory, 'communiquer-lors-dune-classe-transplantee.txt'),
      language: 'fr',
      format: 'txt'
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(existsSync(transcript.path), `Transcript file ${transcript.path} doesn't exist.`).to.be.true
    expect(await readFile(transcript.path, 'utf8')).to.equal(
      `Communiquer lors d'une classe transplantée. Utiliser les photos prises lors de cette classe
pour raconter quotidiennement le séjour vécu. C'est le scénario pédagogique présenté
par M. Navoli, professeur en cycle 3 sur une école élémentaire de Montpellier.
La première application à utiliser sera la médiathèque. L'enseignant va alors transférer
les différentes photos réalisées lors de la classe transplantée dans un dossier spécifique
pour que les élèves puissent le retrouver plus facilement. Ils téléversent donc ces
photos dans le dossier, dans le NT, dans la médiathèque de la classe. Pour terminer,
ils s'assurent que le dossier soit bien ouvert aux utilisateurs afin que tout le monde
puisse l'utiliser. Les élèves, par la suite, utiliseront le blog. A partir de leur note,
ils pourront, seul ou à deux par postes, rédiger un article dans leur NT. Ils illustreront
ces articles à l'aide des photos et documents numériques mis en accès libre dans le NT.
Pour ce faire, ils pourront utiliser l'éditeur avancé qui les renverra directement dans
la médiathèque de la classe où ils pourront retrouver le dossier créé par leur enseignant.
Une fois leur article terminé, les élèves soulèteront celui-ci au professeur qui pourra
soit la noter pour correction ou le publier. Ensuite, ils pourront lire et commenter ceux
de leur camarade, ou répondre au commentaire de la veille.
`
    )
  })

  after(async function () {
    await rm(transcriptDirectory, { recursive: true, force: true })
  })
})
