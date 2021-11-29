import { registerTSPaths } from './helpers/register-ts-paths'
registerTSPaths()

import { isTestInstance } from './helpers/core-utils'
if (isTestInstance()) {
  require('source-map-support').install()
}

// ----------- Node modules -----------
import express from 'express'
import morgan, { token } from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { frameguard } from 'helmet'
import { parse } from 'useragent'
import anonymize from 'ip-anonymize'
import { program as cli } from 'commander'

process.title = 'peertube'

// Create our main app
const app = express().disable("x-powered-by")

// ----------- Core checker -----------
import { checkMissedConfig, checkFFmpeg, checkNodeVersion } from './initializers/checker-before-init'

// Do not use barrels because we don't want to load all modules here (we need to initialize database first)
import { CONFIG } from './initializers/config'
import { API_VERSION, FILES_CACHE, WEBSERVER, loadLanguages } from './initializers/constants'
import { logger } from './helpers/logger'

const missed = checkMissedConfig()
if (missed.length !== 0) {
  logger.error('Your configuration files miss keys: ' + missed)
  process.exit(-1)
}

checkFFmpeg(CONFIG)
  .catch(err => {
    logger.error('Error in ffmpeg check.', { err })
    process.exit(-1)
  })

checkNodeVersion()

import { checkConfig, checkActivityPubUrls, checkFFmpegVersion } from './initializers/checker-after-init'

const errorMessage = checkConfig()
if (errorMessage !== null) {
  throw new Error(errorMessage)
}

// Trust our proxy (IP forwarding...)
app.set('trust proxy', CONFIG.TRUST_PROXY)

// Security middleware
import { baseCSP } from './middlewares/csp'

if (CONFIG.CSP.ENABLED) {
  app.use(baseCSP)
}

if (CONFIG.SECURITY.FRAMEGUARD.ENABLED) {
  app.use(frameguard({
    action: 'deny' // we only allow it for /videos/embed, see controllers/client.ts
  }))
}

// ----------- Database -----------

// Initialize database and models
import { initDatabaseModels, checkDatabaseConnectionOrDie } from './initializers/database'
checkDatabaseConnectionOrDie()

import { migrate } from './initializers/migrator'
migrate()
  .then(() => initDatabaseModels(false))
  .then(() => startApplication())
  .catch(err => {
    logger.error('Cannot start application.', { err })
    process.exit(-1)
  })

// ----------- Initialize -----------
loadLanguages()

// ----------- PeerTube modules -----------
import { installApplication } from './initializers/installer'
import { Emailer } from './lib/emailer'
import { JobQueue } from './lib/job-queue'
import { VideosPreviewCache, VideosCaptionCache } from './lib/files-cache'
import {
  activityPubRouter,
  apiRouter,
  clientsRouter,
  feedsRouter,
  staticRouter,
  lazyStaticRouter,
  servicesRouter,
  liveRouter,
  pluginsRouter,
  webfingerRouter,
  trackerRouter,
  createWebsocketTrackerServer,
  botsRouter,
  downloadRouter
} from './controllers'
import { advertiseDoNotTrack } from './middlewares/dnt'
import { apiFailMiddleware } from './middlewares/error'
import { Redis } from './lib/redis'
import { ActorFollowScheduler } from './lib/schedulers/actor-follow-scheduler'
import { RemoveOldViewsScheduler } from './lib/schedulers/remove-old-views-scheduler'
import { RemoveOldJobsScheduler } from './lib/schedulers/remove-old-jobs-scheduler'
import { UpdateVideosScheduler } from './lib/schedulers/update-videos-scheduler'
import { YoutubeDlUpdateScheduler } from './lib/schedulers/youtube-dl-update-scheduler'
import { VideosRedundancyScheduler } from './lib/schedulers/videos-redundancy-scheduler'
import { RemoveOldHistoryScheduler } from './lib/schedulers/remove-old-history-scheduler'
import { AutoFollowIndexInstances } from './lib/schedulers/auto-follow-index-instances'
import { RemoveDanglingResumableUploadsScheduler } from './lib/schedulers/remove-dangling-resumable-uploads-scheduler'
import { VideoViewsBufferScheduler } from './lib/schedulers/video-views-buffer-scheduler'
import { isHTTPSignatureDigestValid } from './helpers/peertube-crypto'
import { PeerTubeSocket } from './lib/peertube-socket'
import { updateStreamingPlaylistsInfohashesIfNeeded } from './lib/hls'
import { PluginsCheckScheduler } from './lib/schedulers/plugins-check-scheduler'
import { PeerTubeVersionCheckScheduler } from './lib/schedulers/peertube-version-check-scheduler'
import { Hooks } from './lib/plugins/hooks'
import { PluginManager } from './lib/plugins/plugin-manager'
import { LiveManager } from './lib/live'
import { HttpStatusCode } from '../shared/models/http/http-error-codes'
import { VideosTorrentCache } from './lib/files-cache/videos-torrent-cache'
import { ServerConfigManager } from './lib/server-config-manager'
import { VideoViews } from '@server/lib/video-views'

// ----------- Command line -----------

cli
  .option('--no-client', 'Start PeerTube without client interface')
  .option('--no-plugins', 'Start PeerTube without plugins/themes enabled')
  .option('--benchmark-startup', 'Automatically stop server when initialized')
  .parse(process.argv)

// ----------- App -----------

// Enable CORS for develop
if (isTestInstance()) {
  app.use(cors({
    origin: '*',
    exposedHeaders: 'Retry-After',
    credentials: true
  }))
}

// For the logger
token('remote-addr', (req: express.Request) => {
  if (CONFIG.LOG.ANONYMIZE_IP === true || req.get('DNT') === '1') {
    return anonymize(req.ip, 16, 16)
  }

  return req.ip
})
token('user-agent', (req: express.Request) => {
  if (req.get('DNT') === '1') {
    return parse(req.get('user-agent')).family
  }

  return req.get('user-agent')
})
app.use(morgan('combined', {
  stream: {
    write: (str: string) => logger.info(str.trim(), { tags: [ 'http' ] })
  },
  skip: req => CONFIG.LOG.LOG_PING_REQUESTS === false && req.originalUrl === '/api/v1/ping'
}))

// Add .fail() helper to response
app.use(apiFailMiddleware)

// For body requests
app.use(express.urlencoded({ extended: false }))
app.use(express.json({
  type: [ 'application/json', 'application/*+json' ],
  limit: '500kb',
  verify: (req: express.Request, res: express.Response, buf: Buffer) => {
    const valid = isHTTPSignatureDigestValid(buf, req)

    if (valid !== true) {
      res.fail({
        status: HttpStatusCode.FORBIDDEN_403,
        message: 'Invalid digest'
      })
    }
  }
}))

// Cookies
app.use(cookieParser())

// W3C DNT Tracking Status
app.use(advertiseDoNotTrack)

// ----------- Views, routes and static files -----------

// API
const apiRoute = '/api/' + API_VERSION
app.use(apiRoute, apiRouter)

// Services (oembed...)
app.use('/services', servicesRouter)

// Live streaming
app.use('/live', liveRouter)

// Plugins & themes
app.use('/', pluginsRouter)

app.use('/', activityPubRouter)
app.use('/', feedsRouter)
app.use('/', webfingerRouter)
app.use('/', trackerRouter)
app.use('/', botsRouter)

// Static files
app.use('/', staticRouter)
app.use('/', downloadRouter)
app.use('/', lazyStaticRouter)

// Client files, last valid routes!
const cliOptions = cli.opts()
if (cliOptions.client) app.use('/', clientsRouter)

// ----------- Errors -----------

// Catch unmatched routes
app.use((req, res: express.Response) => {
  res.status(HttpStatusCode.NOT_FOUND_404).end()
})

// Catch thrown errors
app.use((err, req, res: express.Response, next) => {
  // Format error to be logged
  let error = 'Unknown error.'
  if (err) {
    error = err.stack || err.message || err
  }
  // Handling Sequelize error traces
  const sql = err.parent ? err.parent.sql : undefined
  logger.error('Error in controller.', { err: error, sql })

  return res.fail({
    status: err.status || HttpStatusCode.INTERNAL_SERVER_ERROR_500,
    message: err.message,
    type: err.name
  })
})

const server = createWebsocketTrackerServer(app)

// ----------- Run -----------

async function startApplication () {
  const port = CONFIG.LISTEN.PORT
  const hostname = CONFIG.LISTEN.HOSTNAME

  await installApplication()

  // Check activity pub urls are valid
  checkActivityPubUrls()
    .catch(err => {
      logger.error('Error in ActivityPub URLs checker.', { err })
      process.exit(-1)
    })

  checkFFmpegVersion()
    .catch(err => logger.error('Cannot check ffmpeg version', { err }))

  // Email initialization
  Emailer.Instance.init()

  await Promise.all([
    Emailer.Instance.checkConnection(),
    JobQueue.Instance.init(),
    ServerConfigManager.Instance.init()
  ])

  // Caches initializations
  VideosPreviewCache.Instance.init(CONFIG.CACHE.PREVIEWS.SIZE, FILES_CACHE.PREVIEWS.MAX_AGE)
  VideosCaptionCache.Instance.init(CONFIG.CACHE.VIDEO_CAPTIONS.SIZE, FILES_CACHE.VIDEO_CAPTIONS.MAX_AGE)
  VideosTorrentCache.Instance.init(CONFIG.CACHE.TORRENTS.SIZE, FILES_CACHE.TORRENTS.MAX_AGE)

  // Enable Schedulers
  ActorFollowScheduler.Instance.enable()
  RemoveOldJobsScheduler.Instance.enable()
  UpdateVideosScheduler.Instance.enable()
  YoutubeDlUpdateScheduler.Instance.enable()
  VideosRedundancyScheduler.Instance.enable()
  RemoveOldHistoryScheduler.Instance.enable()
  RemoveOldViewsScheduler.Instance.enable()
  PluginsCheckScheduler.Instance.enable()
  PeerTubeVersionCheckScheduler.Instance.enable()
  AutoFollowIndexInstances.Instance.enable()
  RemoveDanglingResumableUploadsScheduler.Instance.enable()
  VideoViewsBufferScheduler.Instance.enable()

  Redis.Instance.init()
  PeerTubeSocket.Instance.init(server)
  VideoViews.Instance.init()

  updateStreamingPlaylistsInfohashesIfNeeded()
    .catch(err => logger.error('Cannot update streaming playlist infohashes.', { err }))

  LiveManager.Instance.init()
  if (CONFIG.LIVE.ENABLED) await LiveManager.Instance.run()

  // Make server listening
  server.listen(port, hostname, async () => {
    if (cliOptions.plugins) {
      try {
        await PluginManager.Instance.registerPluginsAndThemes()
      } catch (err) {
        logger.error('Cannot register plugins and themes.', { err })
      }
    }

    logger.info('HTTP server listening on %s:%d', hostname, port)
    logger.info('Web server: %s', WEBSERVER.URL)

    Hooks.runAction('action:application.listening')

    if (cliOptions['benchmarkStartup']) process.exit(0)
  })

  process.on('exit', () => {
    JobQueue.Instance.terminate()
  })

  process.on('SIGINT', () => process.exit(0))
}
