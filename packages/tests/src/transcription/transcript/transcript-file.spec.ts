/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { mkdir } from 'node:fs/promises'
import { TranscriptFile } from '@peertube/peertube-transcription'
import { buildAbsoluteFixturePath } from '@peertube/peertube-node-utils'

describe('Transcript File', function () {
  before(async function () {
    await mkdir(buildAbsoluteFixturePath('transcription/transcript/'), { recursive: true })
  })

  it(`may creates a new transcript file from scratch`, async function () {
    const transcript1 = await TranscriptFile.write({
      path: buildAbsoluteFixturePath('transcription/transcript/test1.txt'),
      content: 'test2',
      format: 'txt'
    })
    const transcript2 = await TranscriptFile.write({
      path: buildAbsoluteFixturePath('transcription/transcript/test2.txt'),
      content: 'test2',
      format: 'txt'
    })

    expect(await transcript1.equals(transcript2)).to.be.true

    const reference = new TranscriptFile({
      path: buildAbsoluteFixturePath('transcription/transcript/reference.txt'),
      language: 'fr',
      format: 'txt'
    })
    const hypothesis = await TranscriptFile.write({
      path: buildAbsoluteFixturePath('transcription/transcript/openai.txt'),
      content: `Communiquez lors d'une classe transplante. Utilisez les photos prises lors de cette classe pour raconter quotidiennement le séjour vécu.
C'est le scénario P-Dagujic présenté par monsieur Navoli, professeur ainsi que le 3 sur une école alimentaire de Montpellier.
La première application a utilisé ce ralame déatec. L'enseignant va alors transférer les différentes photos réalisés lors de la classe transplante.
Dans un dossier, spécifique pour que les élèves puissent le retrouver plus facilement. Il téléverse donc ses photos dans le dossier, dans le venté, dans la médiatèque de la classe.
Pour terminer, il s'assure que le dossier soit bien ouvert aux utilisateurs afin que tout le monde puisse l'utiliser.
Les élèves par la suite utilisera le blog. A partir de leurs nantes, il pourront se loi de parposte rédigeant un article d'un reinté.
Ils illustront ses articles à l'aide des photos de que mon numérique mise à n'accélier dans le venté.
Pour se faire, il pourront utiliser les diteurs avancés qui les renvèrent directement dans la médiatèque de la classe où il pourront retrouver le dossier créé par leurs enseignants.
Une fois leur article terminée, les élèves soumétront se lui-ci au professeur qui pourra soit la noté pour correction ou le public.
Ensuite, il pourront lire et commenter ce de leurs camarades ou répondre aux commentaires de la veille.
`,
      format: 'txt',
      language: 'fr'
    })

    const output = await reference.evaluate(hypothesis)

    console.log(output)
  })
})
