class StorageManager {
  constructor() {
    this.dbName = "LearningJournalDB"
    this.dbVersion = 1
    this.db = null
    this.initIndexedDB()
  }

  // Initialize IndexedDB for complex data storage
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("journals")) {
          const journalStore = db.createObjectStore("journals", { keyPath: "id", autoIncrement: true })
          journalStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", { keyPath: "id", autoIncrement: true })
          projectStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  // LocalStorage methods for simple data
  setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error("LocalStorage error:", e)
      return false
    }
  }

  getLocal(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error("LocalStorage error:", e)
      return null
    }
  }

  removeLocal(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error("LocalStorage error:", e)
      return false
    }
  }

  // SessionStorage methods for temporary data
  setSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error("SessionStorage error:", e)
      return false
    }
  }

  getSession(key) {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error("SessionStorage error:", e)
      return null
    }
  }

  // IndexedDB methods for complex data
  async addToIndexedDB(storeName, data) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllFromIndexedDB(storeName) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearIndexedDB(storeName) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Initialize storage manager
const storage = new StorageManager()

class BrowserAPIsManager {
  constructor(storage) {
    this.storage = storage
    this.locationBtn = document.getElementById("locationBtn")
    this.notificationBtn = document.getElementById("notificationBtn")
    this.locationDisplay = document.getElementById("locationDisplay")
    this.init()
  }

  init() {
    this.locationBtn.addEventListener("click", () => this.getLocation())
    this.notificationBtn.addEventListener("click", () => this.requestNotificationPermission())

    // Check if notifications are already enabled
    if (Notification.permission === "granted") {
      this.notificationBtn.textContent = "🔔✓"
      this.notificationBtn.title = "Notifications Enabled"
    }
  }

  // Geolocation API
  getLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    this.locationBtn.textContent = "⏳"
    this.locationBtn.disabled = true

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        this.displayLocation(latitude, longitude)
        this.locationBtn.textContent = "📍✓"
        this.locationBtn.disabled = false

        // Save location to session storage
        this.storage.setSession("userLocation", { latitude, longitude })

        console.log("[v0] Location retrieved:", { latitude, longitude })
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        alert(`Error getting location: ${error.message}`)
        this.locationBtn.textContent = "📍"
        this.locationBtn.disabled = false
      },
    )
  }

  displayLocation(lat, lon) {
    this.locationDisplay.style.display = "block"
    this.locationDisplay.innerHTML = `
      <strong>Your Location:</strong> 
      Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}
      <button id="copyLocationBtn" class="copy-btn">📋 Copy</button>
    `

    // Add copy to clipboard functionality
    document.getElementById("copyLocationBtn").addEventListener("click", () => {
      this.copyToClipboard(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
    })
  }

  // Notification API
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications")
      return
    }

    if (Notification.permission === "granted") {
      this.sendNotification("Notifications Already Enabled", "You will receive updates when you save journal entries!")
      return
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        this.notificationBtn.textContent = "🔔✓"
        this.notificationBtn.title = "Notifications Enabled"
        this.sendNotification("Notifications Enabled!", "You will now receive updates when you save journal entries.")
        console.log("[v0] Notification permission granted")
      } else {
        console.log("[v0] Notification permission denied")
      }
    }
  }

  sendNotification(title, body) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "image/mario 111.png",
        badge: "image/mario 111.png",
      })
    }
  }

  // Clipboard API
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      alert("Copied to clipboard!")
      console.log("[v0] Text copied to clipboard")
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
      alert("Failed to copy to clipboard")
    }
  }
}

class FormValidationManager {
  constructor() {
    this.init()
  }

  init() {
    // Journal form validation
    const journalTitle = document.getElementById("journalTitle")
    const journalContent = document.getElementById("journalContent")
    const charCount = document.getElementById("charCount")

    if (journalTitle) {
      journalTitle.addEventListener("input", () => this.validateField(journalTitle, "titleError"))
      journalTitle.addEventListener("blur", () => this.validateField(journalTitle, "titleError"))
    }

    if (journalContent) {
      journalContent.addEventListener("input", () => {
        this.validateField(journalContent, "contentError")
        if (charCount) {
          charCount.textContent = journalContent.value.length
        }
      })
      journalContent.addEventListener("blur", () => this.validateField(journalContent, "contentError"))
    }

    // Project form validation
    const projectTitle = document.getElementById("projectTitle")
    const projectDescription = document.getElementById("projectDescription")

    if (projectTitle) {
      projectTitle.addEventListener("input", () => this.validateField(projectTitle, "projectTitleError"))
      projectTitle.addEventListener("blur", () => this.validateField(projectTitle, "projectTitleError"))
    }

    if (projectDescription) {
      projectDescription.addEventListener("input", () => this.validateField(projectDescription, "projectDescError"))
      projectDescription.addEventListener("blur", () => this.validateField(projectDescription, "projectDescError"))
    }
  }

  validateField(field, errorElementId) {
    const errorElement = document.getElementById(errorElementId)

    if (!field.validity.valid) {
      this.showError(field, errorElement)
      return false
    } else {
      this.clearError(field, errorElement)
      return true
    }
  }

  showError(field, errorElement) {
    if (field.validity.valueMissing) {
      errorElement.textContent = "This field is required."
    } else if (field.validity.tooShort) {
      errorElement.textContent = `Minimum ${field.minLength} characters required. Current: ${field.value.length}`
    } else if (field.validity.tooLong) {
      errorElement.textContent = `Maximum ${field.maxLength} characters allowed. Current: ${field.value.length}`
    } else if (field.validity.patternMismatch) {
      errorElement.textContent = field.title || "Invalid format."
    } else {
      errorElement.textContent = "Invalid input."
    }

    field.classList.add("invalid")
    errorElement.style.display = "block"
  }

  clearError(field, errorElement) {
    errorElement.textContent = ""
    errorElement.style.display = "none"
    field.classList.remove("invalid")
  }

  validateForm(formElement) {
    const inputs = formElement.querySelectorAll("input[required], textarea[required]")
    let isValid = true

    inputs.forEach((input) => {
      if (!input.validity.valid) {
        isValid = false
        const errorId = input.getAttribute("aria-describedby")
        if (errorId) {
          this.showError(input, document.getElementById(errorId))
        }
      }
    })

    return isValid
  }
}

class ThemeManager {
  constructor(storage) {
    this.storage = storage
    this.themeToggle = document.getElementById("themeToggle")
    this.init()
  }

  init() {
    // Load saved theme preference from localStorage
    const savedTheme = this.storage.getLocal("theme") || "light"
    this.applyTheme(savedTheme)

    // Add event listener for theme toggle
    if (this.themeToggle) {
      this.themeToggle.addEventListener("click", () => this.toggleTheme())
    }
  }

  applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-mode")
      if (this.themeToggle) {
        this.themeToggle.textContent = "☀️"
        this.themeToggle.title = "Toggle Light Mode"
      }
    } else {
      document.body.classList.remove("dark-mode")
      if (this.themeToggle) {
        this.themeToggle.textContent = "🌙"
        this.themeToggle.title = "Toggle Dark Mode"
      }
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode")
    const newTheme = isDark ? "light" : "dark"

    this.applyTheme(newTheme)
    this.storage.setLocal("theme", newTheme)

    console.log(`[v0] Theme switched to ${newTheme} mode`)
  }
}

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

    loadVideoBtn.addEventListener("click", () => this.loadVideo())
    playBtn.addEventListener("click", () => this.playVideo())
    pauseBtn.addEventListener("click", () => this.pauseVideo())
    stopBtn.addEventListener("click", () => this.stopVideo())
    muteBtn.addEventListener("click", () => this.muteVideo())
    unmuteBtn.addEventListener("click", () => this.unmuteVideo())
    fullscreenBtn.addEventListener("click", () => this.toggleFullscreen())

    // Load saved video ID
    const savedVideoId = this.storage.getLocal("youtubeVideoId")
    if (savedVideoId) {
      document.getElementById("youtubeVideoId").value = savedVideoId
    }
  }

  loadVideo() {
    const videoId = document.getElementById("youtubeVideoId").value.trim()
    const videoStatus = document.getElementById("videoStatus")

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
            document.getElementById("videoControls").style.display = "flex"
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
    if (this.player) {
      this.player.playVideo()
    }
  }

  pauseVideo() {
    if (this.player) {
      this.player.pauseVideo()
    }
  }

  stopVideo() {
    if (this.player) {
      this.player.stopVideo()
    }
  }

  muteVideo() {
    if (this.player) {
      this.player.mute()
    }
  }

  unmuteVideo() {
    if (this.player) {
      this.player.unMute()
    }
  }

  toggleFullscreen() {
    if (this.player) {
      const iframe = this.player.getIframe()
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
}

class JournalManager {
  constructor(storage, browserAPIs) {
    this.storage = storage
    this.browserAPIs = browserAPIs
    this.journalBtn = document.getElementById("journalBtn")
    this.journalModal = document.getElementById("journalModal")
    this.journalForm = document.getElementById("journalForm")
    this.journalSettingsBtn = document.getElementById("journalSettingsBtn")
    this.resetJournalBtn = document.getElementById("resetJournalBtn")
    this.journalEntries = document.getElementById("journalEntries")
    this.journalEmptyState = document.getElementById("journalEmptyState")
    this.validationManager = null

    this.init()
  }

  async init() {
    // Load existing journal entries from IndexedDB
    await this.loadJournals()

    // Event listeners
    if (this.journalBtn) {
      this.journalBtn.addEventListener("click", () => this.openModal())
    }
    if (this.journalSettingsBtn) {
      this.journalSettingsBtn.addEventListener("click", () => this.toggleForm())
    }
    if (this.journalForm) {
      this.journalForm.addEventListener("submit", (e) => this.handleSubmit(e))
    }
    if (this.resetJournalBtn) {
      this.resetJournalBtn.addEventListener("click", () => this.resetJournals())
    }
  }

  setValidationManager(manager) {
    this.validationManager = manager
  }

  openModal() {
    if (this.journalModal) {
      this.journalModal.style.display = "block"
      updateDateTime("journalDatetime")
    }
  }

  toggleForm() {
    if (this.journalForm) {
      const isHidden = this.journalForm.style.display === "none"
      this.journalForm.style.display = isHidden ? "block" : "none"
    }
  }

  async handleSubmit(e) {
    e.preventDefault()

    if (this.validationManager && !this.validationManager.validateForm(this.journalForm)) {
      alert("Please fix the errors in the form before submitting.")
      return
    }

    const titleInput = document.getElementById("journalTitle")
    const contentInput = document.getElementById("journalContent")

    if (!titleInput || !contentInput) return

    const title = titleInput.value
    const content = contentInput.value

    const entry = {
      title,
      content,
      timestamp: new Date().toISOString(),
      dateString: new Date().toLocaleString(),
    }

    try {
      // Save to IndexedDB
      await this.storage.addToIndexedDB("journals", entry)

      // Also save to localStorage as backup
      const localJournals = this.storage.getLocal("journals") || []
      localJournals.push(entry)
      this.storage.setLocal("journals", localJournals)

      console.log("[v0] Journal entry saved successfully")

      if (this.browserAPIs) {
        this.browserAPIs.sendNotification("Journal Entry Saved!", `Your entry "${title}" has been saved successfully.`)
      }

      // Reset form and reload entries
      this.journalForm.reset()
      this.journalForm.style.display = "none"
      const charCount = document.getElementById("charCount")
      if (charCount) charCount.textContent = "0"
      await this.loadJournals()
    } catch (error) {
      console.error("[v0] Error saving journal:", error)
      alert("Error saving journal entry. Please try again.")
    }
  }

  async loadJournals() {
    try {
      // Load from IndexedDB
      const journals = await this.storage.getAllFromIndexedDB("journals")

      if (journals.length === 0) {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block"
        if (this.journalEntries) this.journalEntries.innerHTML = ""
        return
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      // Sort by timestamp (newest first)
      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.journalEntries) {
        this.journalEntries.innerHTML = journals
          .map(
            (entry, index) => `
          <div class="journal-entry">
            <h3>${this.escapeHtml(entry.title)}</h3>
            <p>${this.escapeHtml(entry.content)}</p>
            <small>Created: ${entry.dateString}</small>
            <button class="copy-entry-btn" data-index="${index}">📋 Copy Entry</button>
          </div>
        `,
          )
          .join("")

        // Add copy functionality to each entry
        document.querySelectorAll(".copy-entry-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index
            const entry = journals[index]
            const text = `${entry.title}\n\n${entry.content}\n\nCreated: ${entry.dateString}`
            if (this.browserAPIs) {
              this.browserAPIs.copyToClipboard(text)
            }
          })
        })
      }

      console.log(`[v0] Loaded ${journals.length} journal entries from IndexedDB`)
    } catch (error) {
      console.error("[v0] Error loading journals:", error)
    }
  }

  async resetJournals() {
    if (confirm("Are you sure you want to delete all journal entries? This cannot be undone.")) {
      try {
        await this.storage.clearIndexedDB("journals")
        this.storage.removeLocal("journals")
        await this.loadJournals()
        console.log("[v0] All journal entries cleared")
      } catch (error) {
        console.error("[v0] Error clearing journals:", error)
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Update date and time display
function updateDateTime(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    const now = new Date()
    element.textContent = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }
}

// Update page datetime every second
function startPageDateTime() {
  updateDateTime("pageDateTime")
  setInterval(() => updateDateTime("pageDateTime"), 1000)
}

// Modal close functionality
function initializeModals() {
  const modals = document.querySelectorAll(".modal")
  const closeButtons = document.querySelectorAll(".close-button")

  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      this.closest(".modal").style.display = "none"
    })
  })

  window.addEventListener("click", (event) => {
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })
}

// Initialize other modal buttons (Projects, About, CV, etc.)
function initializeOtherModals(storage) {
  // Projects Modal
  const projectsBtn = document.getElementById("projectsBtn")
  const projectsModal = document.getElementById("projectsModal")
  if (projectsBtn && projectsModal) {
    projectsBtn.addEventListener("click", () => {
      projectsModal.style.display = "block"
      updateDateTime("projectsDatetime")
    })
  }

  // About Modal
  const aboutBtn = document.getElementById("aboutBtn")
  const aboutModal = document.getElementById("aboutModal")
  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener("click", () => {
      aboutModal.style.display = "block"
      updateDateTime("aboutDatetime")
    })
  }

  // CV Modal
  const cvBtn = document.getElementById("cvBtn")
  const cvModal = document.getElementById("cvModal")
  if (cvBtn && cvModal) {
    cvBtn.addEventListener("click", () => {
      cvModal.style.display = "block"
      updateDateTime("cvDatetime")
    })
  }

  // Edit Hero Modal
  const editHeroBtn = document.getElementById("editHeroBtn")
  const editHeroModal = document.getElementById("editHeroModal")
  const editHeroForm = document.getElementById("editHeroForm")

  if (editHeroBtn && editHeroModal && editHeroForm) {
    editHeroBtn.addEventListener("click", () => {
      const currentName = document.getElementById("heroName")?.textContent || ""
      const currentDesc = document.getElementById("heroDescription")?.textContent || ""

      const nameInput = document.getElementById("editHeroName")
      const descInput = document.getElementById("editHeroDesc")

      if (nameInput) nameInput.value = currentName
      if (descInput) descInput.value = currentDesc

      editHeroModal.style.display = "block"
    })

    editHeroForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const newName = document.getElementById("editHeroName")?.value || ""
      const newDesc = document.getElementById("editHeroDesc")?.value || ""

      const heroName = document.getElementById("heroName")
      const heroDesc = document.getElementById("heroDescription")

      if (heroName) heroName.textContent = newName
      if (heroDesc) heroDesc.textContent = newDesc

      // Save to localStorage
      storage.setLocal("heroName", newName)
      storage.setLocal("heroDescription", newDesc)

      editHeroModal.style.display = "none"
    })
  }

  // Load saved hero content
  const savedName = storage.getLocal("heroName")
  const savedDesc = storage.getLocal("heroDescription")

  const heroName = document.getElementById("heroName")
  const heroDesc = document.getElementById("heroDescription")

  if (savedName && heroName) heroName.textContent = savedName
  if (savedDesc && heroDesc) heroDesc.textContent = savedDesc
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Initializing Learning Journal PWA with modular architecture")

  // Initialize storage manager first
  const storage = new StorageManager()

  // Initialize all managers with dependencies
  const themeManager = new ThemeManager(storage)
  const browserAPIs = new BrowserAPIsManager(storage)
  const youtubeManager = new YouTubeManager(storage)
  const formValidation = new FormValidationManager()
  const journalManager = new JournalManager(storage, browserAPIs)

  // Set validation manager for journal
  journalManager.setValidationManager(formValidation)

  // Initialize UI components
  startPageDateTime()
  initializeModals()
  initializeOtherModals(storage)

  // Make browserAPIs globally accessible for notifications
  window.browserAPIs = browserAPIs

  console.log("[v0] All features initialized successfully")
  console.log("[v0] Storage APIs: LocalStorage, SessionStorage, and IndexedDB are active")
  console.log("[v0] Browser APIs: Geolocation, Notifications, and Clipboard are active")
  console.log("[v0] Form Validation API: Constraint validation is active")
  console.log("[v0] YouTube Player API: Enhanced with fullscreen and status tracking")
  console.log("[v0] Modular architecture: storage.js, browser.js, thirdparty.js loaded")
})
