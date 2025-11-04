/* ===== cleaned script.js =====
  - Single modal system (setupModalSystem)
  - Managers keep form/DB logic but DO NOT bind nav open clicks themselves
  - This file MUST be loaded after storage.js, browser.js, thirdparty.js
*/

// -------------------- Managers --------------------

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

    // NOTE: we do NOT attach click to journalBtn here (global modal system does)
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
      // Hide the form initially if there are no entries or we want default collapsed
      if (this.journalForm) this.journalForm.style.display = "none"
    }
  }

  toggleForm() {
    if (this.journalForm) {
      const isHidden = this.journalForm.style.display === "none"
      this.journalForm.style.display = isHidden ? "block" : "none"
      // Hide empty state when form is shown
      if (isHidden && this.journalEmptyState) {
        this.journalEmptyState.style.display = "none"
      } else {
        this.loadJournals()
      }
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

    const entry = {
      title: titleInput.value,
      content: contentInput.value,
      timestamp: new Date().toISOString(),
      dateString: new Date().toLocaleString(),
    }

    try {
      if (this.storage && typeof this.storage.addToIndexedDB === "function") {
        await this.storage.addToIndexedDB("journals", entry)
      }
      // keep a local copy as well (non-essential)
      const localJournals = this.storage.getLocal("journals") || []
      localJournals.unshift(entry)
      this.storage.setLocal("journals", localJournals)

      this.journalForm.reset()
      if (this.journalForm) this.journalForm.style.display = "none"
      const charCount = document.getElementById("charCount")
      if (charCount) charCount.textContent = "0"
      await this.loadJournals()
    } catch (error) {
      console.error("Error saving journal entry:", error)
      alert("Error saving journal entry. Please try again.")
    }
  }

  async loadJournals() {
    try {
      let journals = []
      if (this.storage && typeof this.storage.getAllFromIndexedDB === "function") {
        journals = await this.storage.getAllFromIndexedDB("journals")
      } else {
        journals = this.storage.getLocal("journals") || []
      }

      if (!Array.isArray(journals) || journals.length === 0) {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block"
        if (this.journalEntries) this.journalEntries.innerHTML = ""
        return
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.journalEntries) {
        this.journalEntries.innerHTML = journals
          .map(
            (entry) => `
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
    if (!confirm("Are you sure you want to delete all journal entries? This cannot be undone.")) return
    try {
      if (this.storage && typeof this.storage.clearIndexedDB === "function") {
        await this.storage.clearIndexedDB("journals")
      }
      this.storage.removeLocal("journals")
      await this.loadJournals()
    } catch (error) {
      console.error("Error clearing journals:", error)
      alert("Error clearing journals. Please try again.")
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

    // DO NOT attach click to projectsBtn here (global modal system does)
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
      if (this.projectForm) this.projectForm.style.display = "none"
    }
  }

  toggleForm() {
    if (this.projectForm) {
      const isHidden = this.projectForm.style.display === "none"
      this.projectForm.style.display = isHidden ? "block" : "none"
      if (isHidden && this.projectsEmptyState) {
        this.projectsEmptyState.style.display = "none"
      } else {
        this.loadProjects()
      }
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

    const project = {
      title: titleInput.value,
      description: descInput.value,
      timestamp: new Date().toISOString(),
      dateString: new Date().toLocaleString(),
    }

    try {
      if (this.storage && typeof this.storage.addToIndexedDB === "function") {
        await this.storage.addToIndexedDB("projects", project)
      }
      this.projectForm.reset()
      if (this.projectForm) this.projectForm.style.display = "none"

      // Maintain local copy
      const localProjects = this.storage.getLocal("projects") || []
      localProjects.unshift(project)
      this.storage.setLocal("projects", localProjects)

      await this.loadProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      alert("Error saving project. Please try again.")
    }
  }

  async loadProjects() {
    try {
      let projects = []
      if (this.storage && typeof this.storage.getAllFromIndexedDB === "function") {
        projects = await this.storage.getAllFromIndexedDB("projects")
      } else {
        projects = this.storage.getLocal("projects") || []
      }

      if (!Array.isArray(projects) || projects.length === 0) {
        if (this.projectsEmptyState) this.projectsEmptyState.style.display = "block"
        if (this.projectsList) this.projectsList.innerHTML = ""
        return
      }

      if (this.projectsEmptyState) this.projectsEmptyState.style.display = "none"

      projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.projectsList) {
        this.projectsList.innerHTML = projects
          .map(
            (project) => `
            <div class="project-card">
              <h3>${this.escapeHtml(project.title)}</h3>
              <p>${this.escapeHtml(project.description)}</p>
              <small>Created: ${project.dateString}</small>
            </div>
          `,
          )
          .join("")
      }
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  async resetProjects() {
    if (!confirm("Are you sure you want to delete all projects? This cannot be undone.")) return
    try {
      if (this.storage && typeof this.storage.clearIndexedDB === "function") {
        await this.storage.clearIndexedDB("projects")
      }
      this.storage.removeLocal("projects")
      await this.loadProjects()
    } catch (error) {
      console.error("Error clearing projects:", error)
      alert("Error clearing projects. Please try again.")
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// -------------------- Utility: Date/time --------------------

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

// -------------------- Single global modal system --------------------

/*
  - Handles:
    * close-button elements
    * click outside modal to close
    * openers by data-open="modalId"
    * fallback for nav ids: journalBtn/projectsBtn/aboutBtn/cvBtn
    * when opening, it will call manager.openModal() if provided (keeps managers in control of their internal state)
*/
function setupModalSystem(managers = {}) {
  const modals = document.querySelectorAll(".modal")

  // Close buttons inside modals
  document.querySelectorAll(".close-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal")
      if (modal) modal.style.display = "none"
    })
  })

  // Click outside to close
  window.addEventListener("click", (event) => {
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })

  // Generic openers: data-open="modalId"
  document.querySelectorAll("[data-open]").forEach((el) => {
    const modalId = el.getAttribute("data-open")
    const modal = document.getElementById(modalId)
    if (!modal) return

    el.addEventListener("click", (e) => {
      e.preventDefault()
      // If a manager is provided for this modal (journal/projects), prefer calling its openModal()
      if (modalId === "journalModal" && managers.journalManager && typeof managers.journalManager.openModal === "function") {
        managers.journalManager.openModal()
      } else if (modalId === "projectsModal" && managers.projectsManager && typeof managers.projectsManager.openModal === "function") {
        managers.projectsManager.openModal()
      } else {
        modal.style.display = "block"
        // update associated datetime if present
        const dtId = modalId.replace("Modal", "Datetime")
        updateDateTime(dtId)
      }
    })
  })

  // Fallback: support the existing nav ids without changing HTML
  const navMap = {
    journalBtn: "journalModal",
    projectsBtn: "projectsModal",
    aboutBtn: "aboutModal",
    cvBtn: "cvModal",
  }

  Object.entries(navMap).forEach(([btnId, modalId]) => {
    const button = document.getElementById(btnId)
    const modal = document.getElementById(modalId)
    if (!button || !modal) return

    button.addEventListener("click", (e) => {
      e.preventDefault()
      if (modalId === "journalModal" && managers.journalManager && typeof managers.journalManager.openModal === "function") {
        managers.journalManager.openModal()
      } else if (modalId === "projectsModal" && managers.projectsManager && typeof managers.projectsManager.openModal === "function") {
        managers.projectsManager.openModal()
      } else {
        modal.style.display = "block"
        updateDateTime(modalId.replace("Modal", "Datetime"))
      }
    })
  })
}

// -------------------- initializeOtherModals (About/CV/Hero/YT) --------------------

function initializeOtherModals(storage) {
  // About
  const editAboutBtn = document.getElementById("editAboutBtn")
  const uploadAboutBtn = document.getElementById("uploadAboutBtn")
  const aboutFileInput = document.getElementById("aboutFileInput")
  const editAboutModal = document.getElementById("editAboutModal")
  const editAboutForm = document.getElementById("editAboutForm")
  const aboutContent = document.getElementById("aboutContent")

  if (editAboutBtn && editAboutModal && editAboutForm) {
    editAboutBtn.addEventListener("click", () => {
      const currentText = aboutContent?.textContent || ""
      const textInput = document.getElementById("editAboutText")
      if (textInput) textInput.value = currentText
      editAboutModal.style.display = "block"
    })

    editAboutForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const newText = document.getElementById("editAboutText")?.value || ""
      if (aboutContent) aboutContent.textContent = newText
      storage.setLocal("aboutContent", newText)
      editAboutModal.style.display = "none"
    })
  }

  if (uploadAboutBtn && aboutFileInput) {
    uploadAboutBtn.addEventListener("click", () => {
      aboutFileInput.click()
    })

    aboutFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target.result
          if (aboutContent) aboutContent.textContent = content
          storage.setLocal("aboutContent", content)
          alert(`File "${file.name}" uploaded successfully!`)
        }
        reader.readAsText(file)
      }
    })
  }

  const savedAbout = storage.getLocal("aboutContent")
  if (savedAbout && aboutContent) aboutContent.textContent = savedAbout

  // CV
  const editCvBtn = document.getElementById("editCvBtn")
  const editCvModal = document.getElementById("editCvModal")
  const editCvForm = document.getElementById("editCvForm")
  const cvContent = document.getElementById("cvContent")
  const uploadCvBtn = document.getElementById("uploadCvBtn")
  const cvFileInput = document.getElementById("cvFileInput")
  const cvFileDisplay = document.getElementById("cvFileDisplay")
  const cvFileName = document.getElementById("cvFileName")
  const viewCvBtn = document.getElementById("viewCvBtn")

  if (editCvBtn && editCvModal && editCvForm) {
    editCvBtn.addEventListener("click", () => {
      const currentText = cvContent?.innerHTML || ""
      const textInput = document.getElementById("editCvText")
      if (textInput) textInput.value = currentText
      editCvModal.style.display = "block"
    })

    editCvForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const newText = document.getElementById("editCvText")?.value || ""
      if (cvContent) cvContent.innerHTML = newText
      storage.setLocal("cvContent", newText)
      editCvModal.style.display = "none"
    })
  }

  if (uploadCvBtn && cvFileInput) {
    uploadCvBtn.addEventListener("click", () => {
      cvFileInput.click()
    })

    cvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        if (cvFileName) cvFileName.textContent = file.name
        if (cvFileDisplay) cvFileDisplay.style.display = "block"
        storage.setLocal("cvFileName", file.name)

        const reader = new FileReader()
        reader.onload = (event) => {
          storage.setLocal("cvFileData", event.target.result)
        }
        reader.readAsDataURL(file)

        alert(`CV file "${file.name}" uploaded successfully!`)
      }
    })
  }

  if (viewCvBtn) {
    viewCvBtn.addEventListener("click", () => {
      const fileData = storage.getLocal("cvFileData")
      const fileName = storage.getLocal("cvFileName")
      if (fileData && fileName) {
        const link = document.createElement("a")
        link.href = fileData
        link.download = fileName
        link.click()
      } else {
        alert("No CV file uploaded yet.")
      }
    })
  }

  const savedCv = storage.getLocal("cvContent")
  if (savedCv && cvContent) cvContent.innerHTML = savedCv

  const savedCvFile = storage.getLocal("cvFileName")
  if (savedCvFile) {
    if (cvFileName) cvFileName.textContent = savedCvFile
    if (cvFileDisplay) cvFileDisplay.style.display = "block"
  }

  // Hero section edits
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

// -------------------- DOMContentLoaded: bootstrapping --------------------

document.addEventListener("DOMContentLoaded", () => {
  // Expect StorageManager, BrowserAPIsManager, YouTubeManager to be provided by other JS files
  if (typeof StorageManager === "undefined") {
    console.error("StorageManager not found. Make sure storage.js is loaded before script.js")
    return
  }
  if (typeof BrowserAPIsManager === "undefined") {
    console.error("BrowserAPIsManager not found. Make sure browser.js is loaded before script.js")
    return
  }

  const storage = new StorageManager()
  const browserAPIs = new BrowserAPIsManager(storage)
  const youtubeManager = (typeof YouTubeManager !== "undefined") ? new YouTubeManager(storage) : null
  const journalManager = new JournalManager(storage, browserAPIs)
  const projectsManager = new ProjectsManager(storage, browserAPIs)

  // Provide validation manager to journal
  if (browserAPIs && typeof journalManager.setValidationManager === "function") {
    journalManager.setValidationManager(browserAPIs)
  }

  // Start clocks and modals
  startPageDateTime()
  // Single modal system: pass managers so it can call their openModal() when appropriate
  setupModalSystem({ journalManager, projectsManager })
  initializeOtherModals(storage)

  console.log("Clean script.js initialized")
})
