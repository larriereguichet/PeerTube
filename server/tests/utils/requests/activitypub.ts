import { doRequest } from '../../../helpers/requests'
import { HTTP_SIGNATURE } from '../../../initializers'
import { buildGlobalHeaders } from '../../../lib/job-queue/handlers/utils/activitypub-http-utils'
import { activityPubContextify } from '../../../helpers/activitypub'

function makeAPRequest (url: string, body: any, httpSignature: any, headers: any) {
  const options = {
    method: 'POST',
    uri: url,
    json: body,
    httpSignature,
    headers
  }

  return doRequest(options)
}

async function makeFollowRequest (to: { url: string }, by: { url: string, privateKey }) {
  const follow = {
    type: 'Follow',
    id: by.url + '/toto',
    actor: by.url,
    object: to.url
  }

  const body = activityPubContextify(follow)

  const httpSignature = {
    algorithm: HTTP_SIGNATURE.ALGORITHM,
    authorizationHeaderName: HTTP_SIGNATURE.HEADER_NAME,
    keyId: by.url,
    key: by.privateKey,
    headers: HTTP_SIGNATURE.HEADERS_TO_SIGN
  }
  const headers = buildGlobalHeaders(body)

  return makeAPRequest(to.url, body, httpSignature, headers)
}

export {
  makeAPRequest,
  makeFollowRequest
}
