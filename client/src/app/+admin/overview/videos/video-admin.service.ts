import { Observable } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { RestExtractor, RestPagination, RestService } from '@app/core'
import { AdvancedInputFilter } from '@app/shared/shared-forms'
import { CommonVideoParams, Video, VideoService } from '@app/shared/shared-main'
import { ResultList, VideoInclude } from '@shared/models'

@Injectable()
export class VideoAdminService {

  constructor (
    private videoService: VideoService,
    private authHttp: HttpClient,
    private restExtractor: RestExtractor,
    private restService: RestService
  ) {}

  getAdminVideos (
    options: CommonVideoParams & { pagination: RestPagination, search?: string }
  ): Observable<ResultList<Video>> {
    const { pagination, search } = options

    let params = new HttpParams()
    params = this.videoService.buildCommonVideosParams({ params, ...options })

    params = params.set('start', pagination.start.toString())
                   .set('count', pagination.count.toString())

    params = this.buildAdminParamsFromSearch(search, params)

    return this.authHttp
               .get<ResultList<Video>>(VideoService.BASE_VIDEO_URL, { params })
               .pipe(
                 switchMap(res => this.videoService.extractVideos(res)),
                 catchError(err => this.restExtractor.handleError(err))
               )
  }

  buildAdminInputFilter (): AdvancedInputFilter[] {
    return [
      {
        title: $localize`Video type`,
        children: [
          {
            value: 'isLive:false',
            label: $localize`VOD`
          },
          {
            value: 'isLive:true',
            label: $localize`Live`
          }
        ]
      },

      {
        title: $localize`Video files`,
        children: [
          {
            value: 'webtorrent:true',
            label: $localize`With WebTorrent`
          },
          {
            value: 'webtorrent:false',
            label: $localize`Without WebTorrent`
          },
          {
            value: 'hls:true',
            label: $localize`With HLS`
          },
          {
            value: 'hls:false',
            label: $localize`Without HLS`
          }
        ]
      },

      {
        title: $localize`Videos scope`,
        children: [
          {
            value: 'isLocal:false',
            label: $localize`Remote videos`
          },
          {
            value: 'isLocal:true',
            label: $localize`Local videos`
          }
        ]
      },

      {
        title: $localize`Exclude`,
        children: [
          {
            value: 'excludeMuted',
            label: $localize`Exclude muted accounts`
          }
        ]
      }
    ]
  }

  private buildAdminParamsFromSearch (search: string, params: HttpParams) {
    let include = VideoInclude.BLACKLISTED |
      VideoInclude.BLOCKED_OWNER |
      VideoInclude.HIDDEN_PRIVACY |
      VideoInclude.NOT_PUBLISHED_STATE |
      VideoInclude.FILES

    if (!search) return this.restService.addObjectParams(params, { include })

    const filters = this.restService.parseQueryStringFilter(search, {
      isLocal: {
        prefix: 'isLocal:',
        isBoolean: true
      },
      hasHLSFiles: {
        prefix: 'hls:',
        isBoolean: true
      },
      hasWebtorrentFiles: {
        prefix: 'webtorrent:',
        isBoolean: true
      },
      isLive: {
        prefix: 'isLive:',
        isBoolean: true
      },
      excludeMuted: {
        prefix: 'excludeMuted',
        handler: () => true
      }
    })

    if (filters.excludeMuted) {
      include &= ~VideoInclude.BLOCKED_OWNER

      filters.excludeMuted = undefined
    }

    return this.restService.addObjectParams(params, { ...filters, include })
  }
}
