import { logger } from '@server/helpers/logger.js'
import { isBinaryResponse, peertubeGot } from '@server/helpers/requests.js'
import { writeFile } from 'fs/promises'
import { lTags } from '@server/lib/object-storage/shared/index.js'
import { OptionsOfBufferResponseBody } from 'got'

export async function updateBinary (binaryRelease: {
  name: string
  url: string
}, binaryPath: string, authorizationToken: string) {

  logger.info(`Updating ${binaryRelease.name} binary from %s.`, binaryRelease.url, lTags())

  const gotOptions: OptionsOfBufferResponseBody = {
    context: { bodyKBLimit: 20_000 },
    responseType: 'buffer' as 'buffer'
  }

  if (authorizationToken) {
    gotOptions.headers = {
      authorization: 'Bearer ' + authorizationToken
    }
  }

  try {
    let gotResult = await peertubeGot(binaryRelease.url, gotOptions)

    if (!isBinaryResponse(gotResult)) {
      const json = JSON.parse(gotResult.body.toString())
      const latest = json.filter(release => release.prerelease === false)[0]
      if (!latest) throw new Error('Cannot find latest release')

      const releaseName = binaryRelease.name
      const releaseAsset = latest.assets.find(a => a.name === releaseName)
      if (!releaseAsset) throw new Error(`Cannot find appropriate release with name ${releaseName} in release assets`)

      gotResult = await peertubeGot(releaseAsset.browser_download_url, gotOptions)
    }

    if (!isBinaryResponse(gotResult)) {
      throw new Error('Not a binary response')
    }

    await writeFile(binaryPath, gotResult.body)

    logger.info(`${binaryRelease.name} updated %s.`, binaryPath, lTags())
  } catch (err) {
    logger.error(`Cannot update ${binaryRelease.name} from %s.`, binaryRelease.url, { err, ...lTags() })
  }
}
