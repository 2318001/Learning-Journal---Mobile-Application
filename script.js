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
    await this.loadJournals()

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
      await this.storage.addToIndexedDB("journals", entry)

      const localJournals = this.storage.getLocal("journals") || []
      localJournals.push(entry)
      this.storage.setLocal("journals", localJournals)

      this.journalForm.reset()
      this.journalForm.style.display = "none"
      const charCount = document.getElementById("charCount")
      if (charCount) charCount.textContent = "0"
      await this.loadJournals()
    } catch (error) {
      alert("Error saving journal entry. Please try again.")
    }
  }

  async loadJournals() {
    try {
      const journals = await this.storage.getAllFromIndexedDB("journals")

      if (journals.length === 0) {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block"
        if (this.journalEntries) this.journalEntries.innerHTML = ""
        return
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.journalEntries) {
        this.journalEntries.innerHTML = journals
          .map(
            (entry, index) => `
          <div class="journal-entry">
            <h3>${this.escapeHtml(entry.title)}</h3>
            <p>${this.escapeHtml(entry.content)}</p>
            <small>Created: ${entry.dateString}</small>
          </div>
        `,
          )
          .join("")
      }
    } catch (error) {
      console.error("Error loading journals:", error)
    }
  }

  async resetJournals() {
    if (confirm("Are you sure you want to delete all journal entries? This cannot be undone.")) {
      try {
        await this.storage.clearIndexedDB("journals")
        this.storage.removeLocal("journals")
        await this.loadJournals()
      } catch (error) {
        console.error("Error clearing journals:", error)
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

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

function startPageDateTime() {
  updateDateTime("pageDateTime")
  setInterval(() => updateDateTime("pageDateTime"), 1000)
}

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

function initializeOtherModals(storage) {
  const projectsBtn = document.getElementById("projectsBtn")
  const projectsModal = document.getElementById("projectsModal")
  if (projectsBtn && projectsModal) {
    projectsBtn.addEventListener("click", () => {
      projectsModal.style.display = "block"
      updateDateTime("projectsDatetime")
    })
  }

  const aboutBtn = document.getElementById("aboutBtn")
  const aboutModal = document.getElementById("aboutModal")
  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener("click", () => {
      aboutModal.style.display = "block"
      updateDateTime("aboutDatetime")
    })
  }

  const cvBtn = document.getElementById("cvBtn")
  const cvModal = document.getElementById("cvModal")
  if (cvBtn && cvModal) {
    cvBtn.addEventListener("click", () => {
      cvModal.style.display = "block"
      updateDateTime("cvDatetime")
    })
  }

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

      storage.setLocal("heroName", newName)
      storage.setLocal("heroDescription", newDesc)

      editHeroModal.style.display = "none"
    })
  }

  const savedName = storage.getLocal("heroName")
  const savedDesc = storage.getLocal("heroDescription")

  const heroName = document.getElementById("heroName")
  const heroDesc = document.getElementById("heroDescription")

  if (savedName && heroName) heroName.textContent = savedName
  if (savedDesc && heroDesc) heroDesc.textContent = savedDesc
}

document.addEventListener("DOMContentLoaded", () => {
  const storage = new StorageManager()
  const browserAPIs = new BrowserAPIsManager(storage)
  const youtubeManager = new YouTubeManager(storage)
  const journalManager = new JournalManager(storage, browserAPIs)

  journalManager.setValidationManager(browserAPIs)

  startPageDateTime()
  initializeModals()
  initializeOtherModals(storage)
})

// Declare BrowserAPIsManager and YouTubeManager classes or import them here
class BrowserAPIsManager {
  constructor(storage) {
    this.storage = storage
  }

  validateForm(form) {
    // Implementation for form validation
    return true
  }
}

class YouTubeManager {
  constructor(storage) {
    this.storage = storage
  }
}

class StorageManager {
  addToIndexedDB(dbName, entry) {
    // Implementation for adding to IndexedDB
  }

  getAllFromIndexedDB(dbName) {
    // Implementation for getting all from IndexedDB
    return Promise.resolve([])
  }

  clearIndexedDB(dbName) {
    // Implementation for clearing IndexedDB
  }

  setLocal(key, value) {
    // Implementation for setting local storage
    localStorage.setItem(key, JSON.stringify(value))
  }

  getLocal(key) {
    // Implementation for getting local storage
    return JSON.parse(localStorage.getItem(key))
  }

  removeLocal(key) {
    // Implementation for removing local storage
    localStorage.removeItem(key)
  }
}
