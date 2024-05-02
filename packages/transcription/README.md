# Transcription

Video **transcription** consists in transcribing the audio content of a video to a text.
> This process might be called __Automatic Speech Recognition__ or __Speech to Text__ in more general context.

Provide a common API to many transcription backend, currently :
- `openai-whisper` CLI
- `whisper-ctranslate2` (*via* `whisper-ctranslate2` CLI)
- `whisper-timestamped`

> Potential candidates could be: whisper-cpp, vosk, ...

## Requirements
- Python
- PIP

And at least one of the following transcription backend:
- Python :
  - `openai-whisper`
  - `whisper-ctranslate2`
  - `whisper-timestamped`

## Usage

Create a transcriber manually :
```typescript
import { OpenaiTranscriber } from '@peertube/peertube-transcription'

(async () => {
  // create a transcriber powered by OpeanAI Whisper CLI
  const transcriber = new OpenaiTranscriber({
    name: 'openai-whisper',
    binary: 'whisper'
  });

  const transcriptFile = await transcriber.transcribe(
    './myVideo.mp4',
    { name: 'tiny' },
    'en', 'txt'
  );

  console.log(transcriptFile.path);
  console.log(await transcriptFile.read());
})();
```

You may use the builtin Factory if you're happy with the default configuration:
```Typescript
import { transcriberFactory } from '@peertube/peertube-transcription'
transcriberFactory.createFromEngineName('openai-whisper')
```

> For more use-case see [../tests/src/transcription/whisper/transcriber/openai-transcriber.spec.ts](../tests/src/transcription/whisper/transcriber/openai-transcriber.spec.ts)

## Lexicon
- ONNX: Open Neural Network eXchange. A spec. ONNX Runtime run these models
- GPTs: generative pre-trained transformers
- LLM: Large Language Models
- NLP: Natural Language Processing
- MLP: Multilayer Perceptron
- ASR: Automatic Speech Recognition
- WER: Word Error Rate
- CER: Character Error Rate
