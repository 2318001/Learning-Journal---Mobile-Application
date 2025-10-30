// ============================================
// MODAL FUNCTIONALITY
// ============================================
// Handles opening and closing of all modals
function initializeModals() {
  // Get modal elements
  const journalModal = document.getElementById("journalModal")
  const projectsModal = document.getElementById("projectsModal")
  const editHeroModal = document.getElementById("editHeroModal")

  // Get button elements
  const journalBtn = document.getElementById("journalBtn")
  const projectsBtn = document.getElementById("projectsBtn")

  const closeButtons = document.getElementsByClassName("close-button")

  // Open journal modal when clicking Journal button
  journalBtn.onclick = () => {
    journalModal.style.display = "block"
    updateDateTime()
    checkJournalEmpty() // Check if empty state should be shown
  }

  // Open projects modal when clicking Projects button
  projectsBtn.onclick = () => {
    projectsModal.style.display = "block"
    updateDateTime()
    checkProjectsEmpty() // Check if empty state should be shown
  }

  // Close modals when clicking (x) button
  Array.from(closeButtons).forEach((button) => {
    button.onclick = function () {
      this.closest(".modal").style.display = "none"
    }
  })

  // Close modals when clicking outside the modal content
  window.onclick = (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
    }
  }
}

// ============================================
// DATE AND TIME UPDATES
// ============================================
// Updates date and time displays across the application
function updateDateTime() {
  const now = new Date()
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }
  const dateTimeString = now.toLocaleString("en-US", options)

  // Update journal modal datetime
  const journalDateTime = document.getElementById("journalDatetime")
  if (journalDateTime) {
    journalDateTime.textContent = dateTimeString
  }

  // Update projects modal datetime
  const projectsDateTime = document.getElementById("projectsDatetime")
  if (projectsDateTime) {
    projectsDateTime.textContent = dateTimeString
  }

  // Update home page datetime banner
  const pageDateTime = document.getElementById("pageDateTime")
  if (pageDateTime) {
    pageDateTime.textContent = dateTimeString
  }
}

// ============================================
// EDIT HERO SECTION (HOME PAGE INTRODUCTION)
// ============================================
// Allows editing of the introduction text on home page
function initializeEditHero() {
  const editHeroBtn = document.getElementById("editHeroBtn")
  const editHeroModal = document.getElementById("editHeroModal")
  const editHeroForm = document.getElementById("editHeroForm")

  // Open edit modal and populate with current values
  editHeroBtn.onclick = () => {
    const currentName = document.getElementById("heroName").textContent
    const currentDesc = document.getElementById("heroDescription").textContent

    document.getElementById("editHeroName").value = currentName
    document.getElementById("editHeroDesc").value = currentDesc

    editHeroModal.style.display = "block"
  }

  // Save changes when form is submitted
  editHeroForm.onsubmit = (e) => {
    e.preventDefault()

    const newName = document.getElementById("editHeroName").value
    const newDesc = document.getElementById("editHeroDesc").value

    document.getElementById("heroName").textContent = newName
    document.getElementById("heroDescription").textContent = newDesc

    editHeroModal.style.display = "none"
    alert("Introduction updated successfully!")
  }
}

// ============================================
// JOURNAL EMPTY STATE CHECK
// ============================================
// Shows/hides empty state message based on journal entries
function checkJournalEmpty() {
  const journalEntries = document.getElementById("journalEntries")
  const emptyState = document.getElementById("journalEmptyState")

  // Show empty state if no entries exist
  if (journalEntries.children.length === 0) {
    emptyState.style.display = "block"
  } else {
    emptyState.style.display = "none"
  }
}

// ============================================
// PROJECTS EMPTY STATE CHECK
// ============================================
// Shows/hides empty state message based on project entries
function checkProjectsEmpty() {
  const projectsList = document.getElementById("projectsList")
  const emptyState = document.getElementById("projectsEmptyState")

  // Show empty state if no projects exist
  if (projectsList.children.length === 0) {
    emptyState.style.display = "block"
  } else {
    emptyState.style.display = "none"
  }
}

// ============================================
// SETTINGS MENU TOGGLE
// ============================================
// Toggles form visibility when clicking settings icon
function initializeSettingsMenus() {
  const journalSettingsBtn = document.getElementById("journalSettingsBtn")
  const journalForm = document.getElementById("journalForm")

  const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")
  const projectForm = document.getElementById("projectForm")

  // Toggle journal form visibility
  journalSettingsBtn.onclick = () => {
    if (journalForm.style.display === "none") {
      journalForm.style.display = "block"
      journalSettingsBtn.textContent = "×" // Change to close icon
    } else {
      journalForm.style.display = "none"
      journalForm.reset() // Clear form when hiding
      journalSettingsBtn.textContent = "+" // Change back to add icon
    }
  }

  // Toggle projects form visibility
  projectsSettingsBtn.onclick = () => {
    if (projectForm.style.display === "none") {
      projectForm.style.display = "block"
      projectsSettingsBtn.textContent = "×" // Change to close icon
    } else {
      projectForm.style.display = "none"
      projectForm.reset() // Clear form when hiding
      projectsSettingsBtn.textContent = "+" // Change back to add icon
    }
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all modal functionality
  initializeModals()

  // Initialize hero section editing
  initializeEditHero()

  // Initialize settings menu toggles
  initializeSettingsMenus()

  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime() // Initial call

  // ============================================
  // JOURNAL FUNCTIONALITY
  // ============================================
  const journalForm = document.getElementById("journalForm")
  const journalEntries = document.getElementById("journalEntries")

  if (journalForm) {
    // Handle journal form submission
    journalForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("journalTitle").value
      const content = document.getElementById("journalContent").value

      if (!title || !content) {
        alert("Please fill in all fields")
        return
      }

      // Create new journal entry element
      const entry = document.createElement("div")
      entry.className = "journal-entry"
      entry.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
        <small>${new Date().toLocaleString()}</small>
      `

      // Insert new entry at the top (newest first)
      journalEntries.insertBefore(entry, journalEntries.firstChild)

      // Clear form and hide it
      journalForm.reset()
      journalForm.style.display = "none"
      document.getElementById("journalSettingsBtn").textContent = "+"

      // Update empty state
      checkJournalEmpty()

      alert("Journal entry added successfully!")
    })
  }

  // ============================================
  // PROJECTS FUNCTIONALITY
  // ============================================
  const projectForm = document.getElementById("projectForm")
  const projectsList = document.getElementById("projectsList")

  if (projectForm) {
    // Handle project form submission
    projectForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("projectTitle").value
      const description = document.getElementById("projectDescription").value
      const files = document.getElementById("projectFiles").files

      if (!title || !description) {
        alert("Please fill in all required fields")
        return
      }

      // Create new project entry element
      const project = document.createElement("div")
      project.className = "project-entry"

      // Build file list if files were uploaded
      let filesList = ""
      if (files.length > 0) {
        filesList = '<ul class="files-list">'
        for (let i = 0; i < files.length; i++) {
          filesList += `<li>${files[i].name}</li>`
        }
        filesList += "</ul>"
      }

      project.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        ${filesList}
        <small>Added on: ${new Date().toLocaleString()}</small>
      `

      // Insert new project at the top (newest first)
      projectsList.insertBefore(project, projectsList.firstChild)

      // Clear form and hide it
      projectForm.reset()
      projectForm.style.display = "none"
      document.getElementById("projectsSettingsBtn").textContent = "+"

      // Update empty state
      checkProjectsEmpty()

      alert("Project added successfully!")
    })
  }

  // Initial empty state checks
  checkJournalEmpty()
  checkProjectsEmpty()
})
