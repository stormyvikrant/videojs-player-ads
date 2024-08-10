import { Component, OnInit, OnDestroy } from '@angular/core';
import videojs from 'video.js';
import 'videojs-contrib-ads';
import 'videojs-ima';
import 'videojs-markers'; // Import the markers plugin
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  player: any;
  adChangeInterval = 10; // Interval to change the ad URL in seconds
  currentAdIndex = 0; // To keep track of which ad URL to use

  playAdUrl: string = '';

  adUrls = [
    // 'https://elaborate-valkyrie-caa676.netlify.app/assets/ads.xml',

    {
      showTime: 5,
      adUrl: 'https://elaborate-valkyrie-caa676.netlify.app/assets/ads2.xml',
      allReadyRun: false,
    },
    {
      showTime: 10,
      adUrl: 'https://elaborate-valkyrie-caa676.netlify.app/assets/ads.xml',
      allReadyRun: false,
    },
    {
      showTime: 30,
      adUrl:
        'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
    },
  ];

  seekStartTime: number | null = null;
  seekEndTime: number | null = null;

  ngOnInit() {
    this.player = videojs('content_video', {
      controls: true,
      autoplay: false,
      preload: 'auto',
      responsive: true, // Make player responsive
      controlBar: {
        volumePanel: {
          inline: false, // Use vertical volume control
        },
      },
    });

    this.player.on('loadedmetadata', () => {
      this.addMarkers();
    });

    console.log('check adTagUrl', this.adUrls[this.currentAdIndex].adUrl);
    // Initialize with the first ad URL
    this.player.ima({
      adTagUrl: this.playAdUrl,
    });

    this.player.on('error', (event: any) => {
      console.error('Player error:', event);
    });

    this.player.on('timeupdate', () => {
      const currentTime = Number(Math.floor(this.player.currentTime()));

      console.log('check current time  ceil ', currentTime);
      console.log('check current time2 actual ', this.player.currentTime());
      console.log('check current index ', this.currentAdIndex);

      if (currentTime === this.adUrls[this.currentAdIndex].showTime) {
        console.log('Changing ad URL and requesting ad');
        if (!this.adUrls[this.currentAdIndex].allReadyRun)
          this.requestMidrollAd(this.currentAdIndex);
        else
          console.log(
            'All ready run ad index',
            this.adUrls[this.currentAdIndex]
          ); // Pass the index of the ad to be shown
      }
    });

    // Event listener for when an ad starts
    this.player.on('adstart', () => {
      console.log('Ad started', this.adUrls[this.currentAdIndex].showTime);
    });

    this.player.on('adend', () => {
      console.log('Ad ended', this.currentAdIndex);
    });

    this.player.on('seeking', () => {
      this.seekStartTime = this.player.currentTime();
      console.log('Seek started at time:', this.seekStartTime);
    });

    this.player.on('seeked', () => {
      this.seekEndTime = this.player.currentTime();
      console.log('Seek ended at time:', this.seekEndTime);

      if (this.seekStartTime !== null && this.seekEndTime !== null) {
        this.checkAdUrlsForSeek();
      }

      this.seekStartTime = null;
      this.seekEndTime = null;
    });
  }

  addMarkers() {
    const progressControl = this.player.controlBar.progressControl;
    const progressBar = progressControl
      .el()
      .querySelector('.vjs-progress-holder');

    if (!progressBar) return;

    // Remove existing markers to avoid duplicates
    progressControl
      .el()
      .querySelectorAll('.custom-marker')
      .forEach((marker: { remove: () => any }) => marker.remove());

    this.adUrls.forEach((marker) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.position = 'absolute';
      markerEl.style.backgroundColor = 'red';
      markerEl.style.width = '.3rem';
      markerEl.style.height = '100%';

      const markerPosition = (marker.showTime / this.player.duration()) * 100; // Convert time to percentage
      markerEl.style.left = `calc(${markerPosition}% - 2px)`; // Center the marker

      progressBar.appendChild(markerEl);
    });
  }

  checkAdUrlsForSeek() {
    if (this.seekStartTime !== null && this.seekEndTime !== null) {
      const adIndex = this.adUrls.findIndex(
        (ad) =>
          ad.showTime >= this.seekStartTime! && ad.showTime <= this.seekEndTime!
      );

      if (adIndex !== -1) {
        console.log(
          'Ad URL for the show time within seek range:',
          this.adUrls[adIndex].adUrl
        );
        // this.requestMidrollAd(adIndex);
      }
    }
  }

  requestMidrollAd(adIndex: number) {
    this.playAdUrl = this.adUrls[adIndex].adUrl;
    // Update the ad tag URL and request the ad
    this.player.ima.changeAdTag(this.playAdUrl);
    this.player.ima.requestAds();

    this.currentAdIndex = Math.min(
      this.currentAdIndex + 1,
      this.adUrls.length - 1
    );
    this.adUrls[adIndex].allReadyRun = true;
    console.log('check current index00', this.currentAdIndex);
  }
  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }
}
