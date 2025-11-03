// Browser APIs Manager - Handles Geolocation, Notifications, and Clipboard APIs
class BrowserAPIsManager {
  constructor(storage) {
    this.storage = storage
    this.locationBtn = document.getElementById("locationBtn")
    this.notificationBtn = document.getElementById("notificationBtn")
    this.locationDisplay = document.getElementById("locationDisplay")
    this.init()
  }

  init() {
    if (this.locationBtn) {
      this.locationBtn.addEventListener("click", () => this.getLocation())
    }

    if (this.notificationBtn) {
      this.notificationBtn.addEventListener("click", () => this.requestNotificationPermission())
    }

    // Check if notifications are already enabled
    if (Notification.permission === "granted" && this.notificationBtn) {
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
    if (!this.locationDisplay) return

    this.locationDisplay.style.display = "block"
    this.locationDisplay.innerHTML = `
      <strong>Your Location:</strong> 
      Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}
      <button id="copyLocationBtn" class="copy-btn">📋 Copy</button>
    `

    // Add copy to clipboard functionality
    const copyBtn = document.getElementById("copyLocationBtn")
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        this.copyToClipboard(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
      })
    }
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

// Export for use in other modules
if (typeof window !== "undefined") {
  window.BrowserAPIsManager = BrowserAPIsManager
}
