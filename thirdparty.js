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
      console.log("YouTube API is ready")
    }

    // Set up event listeners
    const loadVideoBtn = document.getElementById("loadVideoBtn")
    const playBtn = document.getElementById("playBtn")
    const pauseBtn = document.getElementById("pauseBtn")
    const stopBtn = document.getElementById("stopBtn")
    const muteBtn = document.getElementById("muteBtn")
    const unmuteBtn = document.getElementById("unmuteBtn")
    const fullscreenBtn = document.getElementById("fullscreenBtn")

    if (loadVideoBtn) {
      loadVideoBtn.addEventListener("click", (e) => {
        e.preventDefault()
        console.log("Load video button clicked")
        this.loadVideo()
      })
    }
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
      console.log("Loaded saved YouTube video ID:", savedVideoId)
    }
  }

  extractVideoId(input) {
    if (!input) return null

    input = input.trim()
    console.log("Extracting video ID from:", input)

    // Check if it's already a video ID (11 characters with alphanumeric, dash, underscore)
    if (/^[a-zA-Z0-9_-]+$/.test(input)) {
      console.log("Detected as video ID:", input)
      return input
    }

    // Extract from full YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    const urlMatch = input.match(/[?&]v=([a-zA-Z0-9_-]+)/)
    if (urlMatch && urlMatch[1]) {
      console.log("Extracted from full URL:", urlMatch[1])
      return urlMatch[1]
    }

    // Extract from short URL: https://youtu.be/VIDEO_ID
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (shortMatch && shortMatch[1]) {
      console.log("Extracted from short URL:", shortMatch[1])
      return shortMatch[1]
    }

    // Extract from youtube.com/watch format (alternative)
    const watchMatch = input.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
    if (watchMatch && watchMatch[1]) {
      console.log("Extracted from watch URL:", watchMatch[1])
      return watchMatch[1]
    }

    console.log("No valid video ID found")
    return null
  }

  loadVideo() {
    const videoInput = document.getElementById("youtubeVideoId")
    const videoStatus = document.getElementById("videoStatus")

    if (!videoInput || !videoStatus) {
      console.error("Video input or status element not found")
      return
    }

    console.log("Video input value:", videoInput.value)
    const videoId = this.extractVideoId(videoInput.value)
    console.log("Extracted video ID:", videoId)

    if (!videoId) {
      videoStatus.textContent = "Please enter a valid YouTube Video ID or URL"
      videoStatus.style.color = "#e53e3e"
      console.error("Invalid video ID or URL")
      return
    }

    // Save video ID to localStorage
    this.storage.setLocal("youtubeVideoId", videoInput.value)

    // Create or update player
    if (this.player) {
      console.log("Updating existing player with video ID:", videoId)
      this.player.loadVideoById(videoId)
      videoStatus.textContent = "Video loaded successfully!"
      videoStatus.style.color = "#48bb78"
    } else {
      const YT = window.YT
      if (!YT) {
        videoStatus.textContent = "YouTube API is loading... Please try again in a moment."
        videoStatus.style.color = "#f6ad55"
        console.warn("YouTube API not ready yet")
        return
      }

      console.log("Creating new YouTube player with video ID:", videoId)
      this.player = new YT.Player("youtubePlayer", {
        height: "390",
        width: "100%",
        videoId: videoId,
        playerVars: {
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            console.log("YouTube player is ready")
            const controls = document.getElementById("videoControls")
            if (controls) controls.style.display = "flex"
            videoStatus.textContent = "Video loaded and ready to play!"
            videoStatus.style.color = "#48bb78"
          },
          onStateChange: (event) => {
            this.handleStateChange(event)
          },
          onError: (event) => {
            console.error("[v0] YouTube player error:", event.data)
            videoStatus.textContent = "Error loading video. Please check the video ID or URL."
            videoStatus.style.color = "#e53e3e"
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
