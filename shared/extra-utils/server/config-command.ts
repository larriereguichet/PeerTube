import { merge } from 'lodash'
import { DeepPartial } from '@shared/core-utils'
import { About, HttpStatusCode, ServerConfig } from '@shared/models'
import { CustomConfig } from '../../models/server/custom-config.model'
import { AbstractCommand, OverrideCommandOptions } from '../shared'

export class ConfigCommand extends AbstractCommand {

  static getCustomConfigResolutions (enabled: boolean) {
    return {
      '240p': enabled,
      '360p': enabled,
      '480p': enabled,
      '720p': enabled,
      '1080p': enabled,
      '1440p': enabled,
      '2160p': enabled
    }
  }

  enableImports () {
    return this.updateExistingSubConfig({
      newConfig: {
        import: {
          videos: {
            http: {
              enabled: true
            },

            torrent: {
              enabled: true
            }
          }
        }
      }
    })
  }

  enableLive (options: {
    allowReplay?: boolean
    transcoding?: boolean
  } = {}) {
    return this.updateExistingSubConfig({
      newConfig: {
        live: {
          enabled: true,
          allowReplay: options.allowReplay ?? true,
          transcoding: {
            enabled: options.transcoding ?? true,
            resolutions: ConfigCommand.getCustomConfigResolutions(true)
          }
        }
      }
    })
  }

  disableTranscoding () {
    return this.updateExistingSubConfig({
      newConfig: {
        transcoding: {
          enabled: false
        }
      }
    })
  }

  enableTranscoding (webtorrent = true, hls = true) {
    return this.updateExistingSubConfig({
      newConfig: {
        transcoding: {
          enabled: true,
          resolutions: ConfigCommand.getCustomConfigResolutions(true),

          webtorrent: {
            enabled: webtorrent
          },
          hls: {
            enabled: hls
          }
        }
      }
    })
  }

  getConfig (options: OverrideCommandOptions = {}) {
    const path = '/api/v1/config'

    return this.getRequestBody<ServerConfig>({
      ...options,

      path,
      implicitToken: false,
      defaultExpectedStatus: HttpStatusCode.OK_200
    })
  }

  getAbout (options: OverrideCommandOptions = {}) {
    const path = '/api/v1/config/about'

    return this.getRequestBody<About>({
      ...options,

      path,
      implicitToken: false,
      defaultExpectedStatus: HttpStatusCode.OK_200
    })
  }

  getCustomConfig (options: OverrideCommandOptions = {}) {
    const path = '/api/v1/config/custom'

    return this.getRequestBody<CustomConfig>({
      ...options,

      path,
      implicitToken: true,
      defaultExpectedStatus: HttpStatusCode.OK_200
    })
  }

  updateCustomConfig (options: OverrideCommandOptions & {
    newCustomConfig: CustomConfig
  }) {
    const path = '/api/v1/config/custom'

    return this.putBodyRequest({
      ...options,

      path,
      fields: options.newCustomConfig,
      implicitToken: true,
      defaultExpectedStatus: HttpStatusCode.OK_200
    })
  }

  deleteCustomConfig (options: OverrideCommandOptions = {}) {
    const path = '/api/v1/config/custom'

    return this.deleteRequest({
      ...options,

      path,
      implicitToken: true,
      defaultExpectedStatus: HttpStatusCode.OK_200
    })
  }

  async updateExistingSubConfig (options: OverrideCommandOptions & {
    newConfig: DeepPartial<CustomConfig>
  }) {
    const existing = await this.getCustomConfig(options)

    return this.updateCustomConfig({ ...options, newCustomConfig: merge({}, existing, options.newConfig) })
  }

  updateCustomSubConfig (options: OverrideCommandOptions & {
    newConfig: DeepPartial<CustomConfig>
  }) {
    const newCustomConfig: CustomConfig = {
      instance: {
        name: 'PeerTube updated',
        shortDescription: 'my short description',
        description: 'my super description',
        terms: 'my super terms',
        codeOfConduct: 'my super coc',

        creationReason: 'my super creation reason',
        moderationInformation: 'my super moderation information',
        administrator: 'Kuja',
        maintenanceLifetime: 'forever',
        businessModel: 'my super business model',
        hardwareInformation: '2vCore 3GB RAM',

        languages: [ 'en', 'es' ],
        categories: [ 1, 2 ],

        isNSFW: true,
        defaultNSFWPolicy: 'blur',

        defaultClientRoute: '/videos/recently-added',

        customizations: {
          javascript: 'alert("coucou")',
          css: 'body { background-color: red; }'
        }
      },
      theme: {
        default: 'default'
      },
      services: {
        twitter: {
          username: '@MySuperUsername',
          whitelisted: true
        }
      },
      cache: {
        previews: {
          size: 2
        },
        captions: {
          size: 3
        },
        torrents: {
          size: 4
        }
      },
      signup: {
        enabled: false,
        limit: 5,
        requiresEmailVerification: false,
        minimumAge: 16
      },
      admin: {
        email: 'superadmin1@example.com'
      },
      contactForm: {
        enabled: true
      },
      user: {
        videoQuota: 5242881,
        videoQuotaDaily: 318742
      },
      videoChannels: {
        maxPerUser: 20
      },
      transcoding: {
        enabled: true,
        allowAdditionalExtensions: true,
        allowAudioFiles: true,
        threads: 1,
        concurrency: 3,
        profile: 'default',
        resolutions: {
          '0p': false,
          '240p': false,
          '360p': true,
          '480p': true,
          '720p': false,
          '1080p': false,
          '1440p': false,
          '2160p': false
        },
        webtorrent: {
          enabled: true
        },
        hls: {
          enabled: false
        }
      },
      live: {
        enabled: true,
        allowReplay: false,
        maxDuration: -1,
        maxInstanceLives: -1,
        maxUserLives: 50,
        transcoding: {
          enabled: true,
          threads: 4,
          profile: 'default',
          resolutions: {
            '240p': true,
            '360p': true,
            '480p': true,
            '720p': true,
            '1080p': true,
            '1440p': true,
            '2160p': true
          }
        }
      },
      import: {
        videos: {
          concurrency: 3,
          http: {
            enabled: false
          },
          torrent: {
            enabled: false
          }
        }
      },
      trending: {
        videos: {
          algorithms: {
            enabled: [ 'best', 'hot', 'most-viewed', 'most-liked' ],
            default: 'hot'
          }
        }
      },
      autoBlacklist: {
        videos: {
          ofUsers: {
            enabled: false
          }
        }
      },
      followers: {
        instance: {
          enabled: true,
          manualApproval: false
        }
      },
      followings: {
        instance: {
          autoFollowBack: {
            enabled: false
          },
          autoFollowIndex: {
            indexUrl: 'https://instances.joinpeertube.org/api/v1/instances/hosts',
            enabled: false
          }
        }
      },
      broadcastMessage: {
        enabled: true,
        level: 'warning',
        message: 'hello',
        dismissable: true
      },
      search: {
        remoteUri: {
          users: true,
          anonymous: true
        },
        searchIndex: {
          enabled: true,
          url: 'https://search.joinpeertube.org',
          disableLocalSearch: true,
          isDefaultSearch: true
        }
      }
    }

    merge(newCustomConfig, options.newConfig)

    return this.updateCustomConfig({ ...options, newCustomConfig })
  }
}
