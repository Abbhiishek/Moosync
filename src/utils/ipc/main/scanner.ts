import { IpcEvents, ScannerEvents } from './constants'

import { CoverScraper } from '../../files/scrapeArtists'
import { IpcChannelInterface } from '.'
import { IpcMainEvent } from 'electron'
import { IpcRequest } from './index'
import { MusicScanner } from '../../files/scanner'
import { loadPreferences } from '@/utils/db/preferences'

export class ScannerChannel implements IpcChannelInterface {
  name = IpcEvents.SCANNER
  private scanning: boolean = false
  handle(event: IpcMainEvent, request: IpcRequest) {
    switch (request.type) {
      case ScannerEvents.SCAN_MUSIC:
        this.ScanSongs(event, request)
        break
    }
  }

  private ScanSongs(event: IpcMainEvent, request: IpcRequest) {
    // TODO: Implement queuing
    if (!this.scanning) {
      this.scanning = true
      loadPreferences()
        .then((preferences) => {
          const scanner = new MusicScanner(...preferences.musicPaths)
          scanner
            .start()
            .then(() => {
              event.reply(request.responseChannel, { status: 'done' })
              this.ScrapeCovers()
            })
            .catch((err) => {
              console.log(err)
              this.scanning = false
            })
        })
        .catch((err) => {
          console.log(err)
          this.scanning = false
        })
    }
  }

  private ScrapeCovers() {
    let coverScraper = new CoverScraper()
    coverScraper.fetchMBIDs().then((results: any[]) => {
      console.log(results.filter((result: any[]) => result))
      coverScraper.fetchArtworks().then((results: any[]) => {
        console.log(results.filter((result: any[]) => result))
        this.scanning = false
      })
    })
  }
}
