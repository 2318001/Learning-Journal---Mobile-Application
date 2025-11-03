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

    const title = titleInput.value.trim()
    const content = contentInput.value.trim()

    // Additional validation
    if (title.length < 3 || title.length > 100) {
      alert("Title must be between 3 and 100 characters.")
      return
    }

    if (content.length < 10 || content.length > 5000) {
      alert("Content must be between 10 and 5000 characters.")
      return
    }

    const now = new Date()
    const entry = {
      title,
      content,
      timestamp: now.toISOString(),
      dateString: now.toLocaleString(),
    }

    try {
      console.log("🔄 Starting to save journal entry...", entry)
      
      // Save to IndexedDB
      const indexedDBResult = await this.storage.addToIndexedDB("journals", entry)
      console.log("✅ Saved to IndexedDB:", indexedDBResult)
      
      // Also save to localStorage as backup
      const localJournals = this.storage.getLocal("journals") || []
      localJournals.push(entry)
      this.storage.setLocal("journals", localJournals)
      console.log("✅ Saved to localStorage")

      // Reset form
      this.journalForm.reset()
      this.journalForm.style.display = "none"
      
      // Reset character count
      const charCount = document.getElementById("charCount")
      if (charCount) charCount.textContent = "0"
      
      // Reload and display entries
      await this.loadJournals()
      
      alert("✅ Journal entry saved successfully!")
    } catch (error) {
      console.error("❌ Error saving journal:", error)
      alert("❌ Error saving journal entry. Please try again.")
    }
  }

  async loadJournals() {
    try {
      console.log("🔄 Loading journals...")
      
      let journals = []
      let source = "none"

      // Try IndexedDB first
      try {
        journals = await this.storage.getAllFromIndexedDB("journals")
        source = "IndexedDB"
        console.log(`📖 Loaded ${journals.length} journals from ${source}:`, journals)
      } catch (indexedDBError) {
        console.warn("⚠️ IndexedDB error, falling back to localStorage:", indexedDBError)
      }
      
      // Fallback to localStorage if IndexedDB fails or returns empty
      if (!journals || journals.length === 0) {
        journals = this.storage.getLocal("journals") || []
        source = "localStorage"
        console.log(`📖 Loaded ${journals.length} journals from ${source}:`, journals)
      }

      if (journals.length === 0) {
        console.log("📭 No journals found")
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block"
        if (this.journalEntries) this.journalEntries.innerHTML = ""
        return
      }

      console.log(`🎉 Found ${journals.length} journals from ${source}`)

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      // Sort by date - newest first
      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.journalEntries) {
        this.journalEntries.innerHTML = journals
          .map(
            (entry) => `
          <div class="journal-entry">
            <div class="entry-header">
              <h3>${this.escapeHtml(entry.title)}</h3>
              <small>${entry.dateString || new Date(entry.timestamp).toLocaleString()}</small>
            </div>
            <p>${this.escapeHtml(entry.content)}</p>
          </div>
        `
          )
          .join("")
        console.log("✅ Journals displayed in UI")
      }
    } catch (error) {
      console.error("❌ Error loading journals:", error)
      // Final fallback to localStorage
      const localJournals = this.storage.getLocal("journals") || []
      console.log("🔄 Final fallback to localStorage:", localJournals)
      
      if (localJournals.length === 0) {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block"
      } else {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "none"
        if (this.journalEntries) {
          this.journalEntries.innerHTML = localJournals
            .map(
              (entry) => `
            <div class="journal-entry">
              <div class="entry-header">
                <h3>${this.escapeHtml(entry.title)}</h3>
                <small>${entry.dateString || new Date(entry.timestamp).toLocaleString()}</small>
              </div>
              <p>${this.escapeHtml(entry.content)}</p>
            </div>
          `
            )
            .join("")
        }
      }
    }
  }

  async resetJournals() {
    if (confirm("Are you sure you want to delete all journal entries? This cannot be undone.")) {
      try {
        await this.storage.clearIndexedDB("journals")
        this.storage.removeLocal("journals")
        await this.loadJournals()
        alert("All journal entries have been deleted.")
      } catch (error) {
        console.error("Error clearing journals:", error)
        alert("Error clearing journals. Please try again.")
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

class ProjectsManager {
  constructor(storage, browserAPIs) {
    this.storage = storage
    this.browserAPIs = browserAPIs
    this.projectsBtn = document.getElementById("projectsBtn")
    this.projectsModal = document.getElementById("projectsModal")
    this.projectForm = document.getElementById("projectForm")
    this.projectsSettingsBtn = document.getElementById("projectsSettingsBtn")
    this.resetProjectsBtn = document.getElementById("resetProjectsBtn")
    this.projectsList = document.getElementById("projectsList")
    this.projectsEmptyState = document.getElementById("projectsEmptyState")

    this.init()
  }

  async init() {
    await this.loadProjects()

    if (this.projectsBtn) {
      this.projectsBtn.addEventListener("click", () => this.openModal())
    }
    if (this.projectsSettingsBtn) {
      this.projectsSettingsBtn.addEventListener("click", () => this.toggleForm())
    }
    if (this.projectForm) {
      this.projectForm.addEventListener("submit", (e) => this.handleSubmit(e))
    }
    if (this.resetProjectsBtn) {
      this.resetProjectsBtn.addEventListener("click", () => this.resetProjects())
    }
  }

  openModal() {
    if (this.projectsModal) {
      this.projectsModal.style.display = "block"
      updateDateTime("projectsDatetime")
    }
  }

  toggleForm() {
    if (this.projectForm) {
      const isHidden = this.projectForm.style.display === "none"
      this.projectForm.style.display = isHidden ? "block" : "none"
    }
  }

  async handleSubmit(e) {
    e.preventDefault()

    if (this.browserAPIs && !this.browserAPIs.validateForm(this.projectForm)) {
      alert("Please fix the errors in the form before submitting.")
      return
    }

    const titleInput = document.getElementById("projectTitle")
    const descInput = document.getElementById("projectDescription")

    if (!titleInput || !descInput) return

    const title = titleInput.value.trim()
    const description = descInput.value.trim()

    // Additional validation
    if (title.length < 3 || title.length > 100) {
      alert("Title must be between 3 and 100 characters.")
      return
    }

    if (description.length < 10 || description.length > 2000) {
      alert("Description must be between 10 and 2000 characters.")
      return
    }

    const now = new Date()
    const project = {
      title,
      description,
      timestamp: now.toISOString(),
      dateString: now.toLocaleString(),
    }

    try {
      console.log("🔄 Starting to save project...", project)
      
      await this.storage.addToIndexedDB("projects", project)
      console.log("✅ Saved to IndexedDB")
      
      // Also save to localStorage as backup
      const localProjects = this.storage.getLocal("projects") || []
      localProjects.push(project)
      this.storage.setLocal("projects", localProjects)
      console.log("✅ Saved to localStorage")

      this.projectForm.reset()
      this.projectForm.style.display = "none"
      await this.loadProjects()
      
      alert("✅ Project saved successfully!")
    } catch (error) {
      console.error("❌ Error saving project:", error)
      alert("❌ Error saving project. Please try again.")
    }
  }

  async loadProjects() {
    try {
      console.log("🔄 Loading projects...")
      
      let projects = []
      let source = "none"

      try {
        projects = await this.storage.getAllFromIndexedDB("projects")
        source = "IndexedDB"
        console.log(`📖 Loaded ${projects.length} projects from ${source}:`, projects)
      } catch (indexedDBError) {
        console.warn("⚠️ IndexedDB error, falling back to localStorage:", indexedDBError)
      }
      
      if (!projects || projects.length === 0) {
        projects = this.storage.getLocal("projects") || []
        source = "localStorage"
        console.log(`📖 Loaded ${projects.length} projects from ${source}:`, projects)
      }

      if (projects.length === 0) {
        console.log("📭 No projects found")
        if (this.projectsEmptyState) this.projectsEmptyState.style.display = "block"
        if (this.projectsList) this.projectsList.innerHTML = ""
        return
      }

      console.log(`🎉 Found ${projects.length} projects from ${source}`)

      if (this.projectsEmptyState) this.projectsEmptyState.style.display = "none"

      projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.projectsList) {
        this.projectsList.innerHTML = projects
          .map(
            (project) => `
          <div class="project-card">
            <div class="project-header">
              <h3>${this.escapeHtml(project.title)}</h3>
              <small>${project.dateString || new Date(project.timestamp).toLocaleString()}</small>
            </div>
            <p>${this.escapeHtml(project.description)}</p>
          </div>
        `
          )
          .join("")
        console.log("✅ Projects displayed in UI")
      }
    } catch (error) {
      console.error("❌ Error loading projects:", error)
      const localProjects = this.storage.getLocal("projects") || []
      console.log("🔄 Final fallback to localStorage:", localProjects)
      
      if (localProjects.length === 0) {
        if (this.projectsEmptyState) this.projectsEmptyState.style.display = "block"
      } else {
        if (this.projectsEmptyState) this.projectsEmptyState.style.display = "none"
        if (this.projectsList) {
          this.projectsList.innerHTML = localProjects
            .map(
              (project) => `
            <div class="project-card">
              <div class="project-header">
                <h3>${this.escapeHtml(project.title)}</h3>
                <small>${project.dateString || new Date(project.timestamp).toLocaleString()}</small>
              </div>
              <p>${this.escapeHtml(project.description)}</p>
            </div>
          `
            )
            .join("")
        }
      }
    }
  }

  async resetProjects() {
    if (confirm("Are you sure you want to delete all projects? This cannot be undone.")) {
      try {
        await this.storage.clearIndexedDB("projects")
        this.storage.removeLocal("projects")
        await this.loadProjects()
        alert("All projects have been deleted.")
      } catch (error) {
        console.error("Error clearing projects:", error)
        alert("Error clearing projects. Please try again.")
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Remove the duplicate classes at the bottom and keep only these functions:

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

// ... keep the rest of your initializeOtherModals function as it is ...

document.addEventListener("DOMContentLoaded", () => {
  const storage = new StorageManager()
  const browserAPIs = new BrowserAPIsManager(storage)
  const youtubeManager = new YouTubeManager(storage)
  const journalManager = new JournalManager(storage, browserAPIs)
  const projectsManager = new ProjectsManager(storage, browserAPIs)

  journalManager.setValidationManager(browserAPIs)

  startPageDateTime()
  initializeModals()
  initializeOtherModals(storage)
})

// REMOVE THESE DUPLICATE CLASSES FROM THE BOTTOM:
/*
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
