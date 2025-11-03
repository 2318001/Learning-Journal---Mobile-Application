// Third-Party APIs Manager - Handles YouTube Player API
class YouTubeManager {
  constructor(storage) {
    this.storage = storage
    this.player = null
    this.isAPIReady = false
    this.init()
  }

  init() {
    // Wait for YouTube API to be ready
    window.onYouTubeIframeAPIReady = () => {
      this.isAPIReady = true
      console.log("[v0] YouTube API is ready")
    }

    // Set up event listeners
    const loadVideoBtn = document.getElementById("loadVideoBtn")
    const playBtn = document.getElementById("playBtn")
    const pauseBtn = document.getElementById("pauseBtn")
    const stopBtn = document.getElementById("stopBtn")
    const muteBtn = document.getElementById("muteBtn")
    const unmuteBtn = document.getElementById("unmuteBtn")
    const fullscreenBtn = document.getElementById("fullscreenBtn")

    if (loadVideoBtn) loadVideoBtn.addEventListener("click", () => this.loadVideo())
    if (playBtn) playBtn.addEventListener("click", () => this.playVideo())
    if (pauseBtn) pauseBtn.addEventListener("click", () => this.pauseVideo())
    if (stopBtn) stopBtn.addEventListener("click", () => this.stopVideo())
    if (muteBtn) muteBtn.addEventListener("click", () => this.muteVideo())
    if (unmuteBtn) unmuteBtn.addEventListener("click", () => this.unmuteVideo())
    if (fullscreenBtn) fullscreenBtn.addEventListener("click", () => this.toggleFullscreen())

    // Load saved video ID
    const savedVideoId = this.storage.getLocal("youtubeVideoId")
    const videoInput = document.getElementById("youtubeVideoId")
    if (savedVideoId && videoInput) {
      videoInput.value = savedVideoId
    }
  }

  loadVideo() {
    const videoInput = document.getElementById("youtubeVideoId")
    const videoStatus = document.getElementById("videoStatus")

    if (!videoInput || !videoStatus) return

    const videoId = videoInput.value.trim()

    if (!videoId) {
      alert("Please enter a YouTube Video ID")
      return
    }

    // Validate video ID format (11 characters)
    if (videoId.length !== 11) {
      alert("Invalid YouTube Video ID. It should be 11 characters long.")
      return
    }

    // Save video ID to localStorage
    this.storage.setLocal("youtubeVideoId", videoId)

    // Create or update player
    if (this.player) {
      this.player.loadVideoById(videoId)
      videoStatus.textContent = "Video loaded successfully!"
    } else {
      const YT = window.YT
      if (!YT) {
        alert("YouTube API is not loaded yet. Please try again in a moment.")
        return
      }

      this.player = new YT.Player("youtubePlayer", {
        height: "390",
        width: "100%",
        videoId: videoId,
        playerVars: {
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            console.log("[v0] YouTube player is ready")
            const controls = document.getElementById("videoControls")
            if (controls) controls.style.display = "flex"
            videoStatus.textContent = "Video loaded and ready to play!"
          },
          onStateChange: (event) => {
            this.handleStateChange(event)
          },
          onError: (event) => {
            console.error("[v0] YouTube player error:", event.data)
            videoStatus.textContent = "Error loading video. Please check the video ID."
          },
        },
      })
    }
  }

  handleStateChange(event) {
    const videoStatus = document.getElementById("videoStatus")
    if (!videoStatus) return

    const states = {
      "-1": "Unstarted",
      0: "Ended",
      1: "Playing",
      2: "Paused",
      3: "Buffering",
      5: "Video cued",
    }

    const stateName = states[event.data] || "Unknown"
    videoStatus.textContent = `Status: ${stateName}`
    console.log("[v0] Player state changed:", stateName)
  }

  playVideo() {
    if (this.player && this.player.playVideo) {
      this.player.playVideo()
    }
  }

  pauseVideo() {
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo()
    }
  }

  stopVideo() {
    if (this.player && this.player.stopVideo) {
      this.player.stopVideo()
    }
  }

  muteVideo() {
    if (this.player && this.player.mute) {
      this.player.mute()
    }
  }

  unmuteVideo() {
    if (this.player && this.player.unMute) {
      this.player.unMute()
    }
  }

  toggleFullscreen() {
    if (!this.player) return

    const iframe = this.player.getIframe()
    if (!iframe) return

    if (iframe.requestFullscreen) {
      iframe.requestFullscreen()
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen()
    } else if (iframe.mozRequestFullScreen) {
      iframe.mozRequestFullScreen()
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen()
    }
  }
}

// Export for use in other modules
if (typeof window !== "undefined") {
  window.YouTubeManager = YouTubeManager
}
