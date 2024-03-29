import { TranscriptionEngine } from '../../transcription-engine.js'
import { whisperEngine } from './python.js'
import { whisperCppEngine } from './cpp.js'
import { transformers } from './transformers.js'
import { transformersJs } from './transformers-js.js'

export const engines: TranscriptionEngine[] = [
  whisperCppEngine,
  whisperEngine,
  transformers,
  transformersJs
]
