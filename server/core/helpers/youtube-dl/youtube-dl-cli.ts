import { execa, NodeOptions as ExecaNodeOptions } from 'execa'
import { ensureDir, pathExists } from 'fs-extra/esm'
import { dirname, join } from 'path'
import { VideoResolution, VideoResolutionType } from '@peertube/peertube-models'
import { CONFIG } from '@server/initializers/config.js'
import { updateBinary } from '@server/helpers/binary.js'
import { logger, loggerTagsFactory } from '../logger.js'
import { getProxy, isProxyEnabled } from '../proxy.js'

const lTags = loggerTagsFactory('youtube-dl')

const youtubeDLBinaryPath = join(CONFIG.STORAGE.BIN_DIR, CONFIG.IMPORT.VIDEOS.HTTP.YOUTUBE_DL_RELEASE.NAME)

export class YoutubeDLCLI {

  static async safeGet () {
    if (!await pathExists(youtubeDLBinaryPath)) {
      await ensureDir(dirname(youtubeDLBinaryPath))

      await this.updateYoutubeDLBinary()
    }

    return new YoutubeDLCLI()
  }

  static async updateYoutubeDLBinary () {
    return updateBinary(
      {
        name: CONFIG.IMPORT.VIDEOS.HTTP.YOUTUBE_DL_RELEASE.NAME,
        url: CONFIG.IMPORT.VIDEOS.HTTP.YOUTUBE_DL_RELEASE.URL
      },
      youtubeDLBinaryPath,
      process.env.YOUTUBE_DL_DOWNLOAD_BEARER_TOKEN
    )
  }

  static getYoutubeDLVideoFormat (enabledResolutions: VideoResolutionType[], useBestFormat: boolean) {
    /**
     * list of format selectors in order or preference
     * see https://github.com/ytdl-org/youtube-dl#format-selection
     *
     * case #1 asks for a mp4 using h264 (avc1) and the exact resolution in the hope
     * of being able to do a "quick-transcode"
     * case #2 is the first fallback. No "quick-transcode" means we can get anything else (like vp9)
     * case #3 is the resolution-degraded equivalent of #1, and already a pretty safe fallback
     *
     * in any case we avoid AV1, see https://github.com/Chocobozzz/PeerTube/issues/3499
     **/

    let result: string[] = []

    if (!useBestFormat) {
      const resolution = enabledResolutions.length === 0
        ? VideoResolution.H_720P
        : Math.max(...enabledResolutions)

      result = [
        `bestvideo[vcodec^=avc1][height=${resolution}]+bestaudio[ext=m4a]`, // case #1
        `bestvideo[vcodec!*=av01][vcodec!*=vp9.2][height=${resolution}]+bestaudio`, // case #2
        `bestvideo[vcodec^=avc1][height<=${resolution}]+bestaudio[ext=m4a]` // case #
      ]
    }

    return result.concat([
      'bestvideo[vcodec!*=av01][vcodec!*=vp9.2]+bestaudio',
      'best[vcodec!*=av01][vcodec!*=vp9.2]', // case fallback for known formats
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]',
      'best' // Ultimate fallback
    ]).join('/')
  }

  private constructor () {

  }

  download (options: {
    url: string
    format: string
    output: string
    processOptions: ExecaNodeOptions
    timeout?: number
    additionalYoutubeDLArgs?: string[]
  }) {
    let args = options.additionalYoutubeDLArgs || []
    args = args.concat([ '--merge-output-format', 'mp4', '-f', options.format, '-o', options.output ])

    return this.run({
      url: options.url,
      processOptions: options.processOptions,
      timeout: options.timeout,
      args
    })
  }

  async getInfo (options: {
    url: string
    format: string
    processOptions: ExecaNodeOptions
    additionalYoutubeDLArgs?: string[]
  }) {
    const { url, format, additionalYoutubeDLArgs = [], processOptions } = options

    const completeArgs = additionalYoutubeDLArgs.concat([ '--dump-json', '-f', format ])

    const data = await this.run({ url, args: completeArgs, processOptions })
    if (!data) return undefined

    const info = data.map(d => JSON.parse(d))

    return info.length === 1
      ? info[0]
      : info
  }

  async getListInfo (options: {
    url: string
    latestVideosCount?: number
    processOptions: ExecaNodeOptions
  }): Promise<{ upload_date: string, webpage_url: string }[]> {
    const additionalYoutubeDLArgs = [ '--skip-download', '--playlist-reverse' ]

    if (CONFIG.IMPORT.VIDEOS.HTTP.YOUTUBE_DL_RELEASE.NAME === 'yt-dlp') {
      // Optimize listing videos only when using yt-dlp because it is bugged with youtube-dl when fetching a channel
      additionalYoutubeDLArgs.push('--flat-playlist')
    }

    if (options.latestVideosCount !== undefined) {
      additionalYoutubeDLArgs.push('--playlist-end', options.latestVideosCount.toString())
    }

    const result = await this.getInfo({
      url: options.url,
      format: YoutubeDLCLI.getYoutubeDLVideoFormat([], false),
      processOptions: options.processOptions,
      additionalYoutubeDLArgs
    })

    if (!result) return result
    if (!Array.isArray(result)) return [ result ]

    return result
  }

  async getSubs (options: {
    url: string
    format: 'vtt'
    processOptions: ExecaNodeOptions
  }) {
    const { url, format, processOptions } = options

    const args = [ '--skip-download', '--all-subs', `--sub-format=${format}` ]

    const data = await this.run({ url, args, processOptions })
    const files: string[] = []

    const skipString = '[info] Writing video subtitles to: '

    for (let i = 0, len = data.length; i < len; i++) {
      const line = data[i]

      if (line.indexOf(skipString) === 0) {
        files.push(line.slice(skipString.length))
      }
    }

    return files
  }

  private async run (options: {
    url: string
    args: string[]
    timeout?: number
    processOptions: ExecaNodeOptions
  }) {
    const { url, args, timeout, processOptions } = options

    let completeArgs = this.wrapWithProxyOptions(args)
    completeArgs = this.wrapWithIPOptions(completeArgs)
    completeArgs = this.wrapWithFFmpegOptions(completeArgs)

    const { PYTHON_PATH } = CONFIG.IMPORT.VIDEOS.HTTP.YOUTUBE_DL_RELEASE
    const subProcess = execa(PYTHON_PATH, [ youtubeDLBinaryPath, ...completeArgs, url ], processOptions)

    if (timeout) {
      setTimeout(() => subProcess.cancel(), timeout)
    }

    const output = await subProcess

    logger.debug('Run youtube-dl command.', { command: output.command, ...lTags() })

    return output.stdout
      ? output.stdout.trim().split(/\r?\n/)
      : undefined
  }

  private wrapWithProxyOptions (args: string[]) {
    if (isProxyEnabled()) {
      logger.debug('Using proxy %s for YoutubeDL', getProxy(), lTags())

      return [ '--proxy', getProxy() ].concat(args)
    }

    return args
  }

  private wrapWithIPOptions (args: string[]) {
    if (CONFIG.IMPORT.VIDEOS.HTTP.FORCE_IPV4) {
      logger.debug('Force ipv4 for YoutubeDL')

      return [ '--force-ipv4' ].concat(args)
    }

    return args
  }

  private wrapWithFFmpegOptions (args: string[]) {
    if (process.env.FFMPEG_PATH) {
      logger.debug('Using ffmpeg location %s for YoutubeDL', process.env.FFMPEG_PATH, lTags())

      return [ '--ffmpeg-location', process.env.FFMPEG_PATH ].concat(args)
    }

    return args
  }
}
