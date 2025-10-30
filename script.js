// ============================================
// MODAL FUNCTIONALITY
// ============================================
// Handles opening and closing of all modals
function initializeModals() {
  // Get modal elements
  const journalModal = document.getElementById("journalModal")
  const projectsModal = document.getElementById("projectsModal")
  const editHeroModal = document.getElementById("editHeroModal")
  const aboutModal = document.getElementById("aboutModal")
  const cvModal = document.getElementById("cvModal")

  // Get button elements
  const journalBtn = document.getElementById("journalBtn")
  const projectsBtn = document.getElementById("projectsBtn")
  const aboutBtn = document.getElementById("aboutBtn")
  const cvBtn = document.getElementById("cvBtn")

  const closeButtons = document.getElementsByClassName("close-button")

  // Open journal modal when clicking Journal button
  journalBtn.onclick = () => {
    journalModal.style.display = "block"
    updateDateTime()
    checkJournalEmpty()
  }

  // Open projects modal when clicking Projects button
  projectsBtn.onclick = () => {
    projectsModal.style.display = "block"
    updateDateTime()
    checkProjectsEmpty()
  }

  aboutBtn.onclick = () => {
    aboutModal.style.display = "block"
    updateDateTime()
  }

  cvBtn.onclick = () => {
    cvModal.style.display = "block"
    updateDateTime()
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

  const aboutDateTime = document.getElementById("aboutDatetime")
  if (aboutDateTime) {
    aboutDateTime.textContent = dateTimeString
  }

  const cvDateTime = document.getElementById("cvDatetime")
  if (cvDateTime) {
    cvDateTime.textContent = dateTimeString
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

  if (!editHeroBtn || !editHeroModal || !editHeroForm) return

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
// ============================================
// Allows editing of the About introduction text
function initializeEditAbout() {
  const editAboutBtn = document.getElementById("editAboutBtn")
  const editAboutModal = document.getElementById("editAboutModal")
  const editAboutForm = document.getElementById("editAboutForm")

  if (!editAboutBtn || !editAboutModal || !editAboutForm) return

  // Open edit modal and populate with current value
  editAboutBtn.onclick = () => {
    const currentText = document.getElementById("aboutContent").textContent.trim()
    document.getElementById("editAboutText").value = currentText
    editAboutModal.style.display = "block"
  }

  // Save changes when form is submitted
  editAboutForm.onsubmit = (e) => {
    e.preventDefault()

    const newText = document.getElementById("editAboutText").value
    document.getElementById("aboutContent").innerHTML = `<p>${newText}</p>`

    editAboutModal.style.display = "none"
    alert("About section updated successfully!")
  }
}

// ============================================
// ============================================
// Allows editing of CV content and uploading CV files
function initializeEditCv() {
  const editCvBtn = document.getElementById("editCvBtn")
  const editCvModal = document.getElementById("editCvModal")
  const editCvForm = document.getElementById("editCvForm")
  const uploadCvBtn = document.getElementById("uploadCvBtn")
  const cvFileInput = document.getElementById("cvFileInput")

  if (!editCvBtn || !editCvModal || !editCvForm) return

  // Open edit modal and populate with current value
  editCvBtn.onclick = () => {
    const currentText = document.getElementById("cvContent").innerText.trim()
    document.getElementById("editCvText").value = currentText
    editCvModal.style.display = "block"
  }

  // Save changes when form is submitted
  editCvForm.onsubmit = (e) => {
    e.preventDefault()

    const newText = document.getElementById("editCvText").value
    // Convert line breaks to HTML
    const formattedText = newText.replace(/\n/g, "<br>")
    document.getElementById("cvContent").innerHTML = formattedText

    editCvModal.style.display = "none"
    alert("CV updated successfully!")
  }

  // Handle CV file upload
  if (uploadCvBtn && cvFileInput) {
    uploadCvBtn.onclick = () => {
      cvFileInput.click()
    }

    cvFileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        // Display uploaded file name
        document.getElementById("cvFileName").textContent = file.name
        document.getElementById("cvFileDisplay").style.display = "block"
        alert(`CV file "${file.name}" uploaded successfully!`)
      }
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

  initializeEditAbout()
  initializeEditCv()

  // Initialize settings menu toggles
  initializeSettingsMenus()

  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime()

  // Initialize journal functionality
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

  // Initialize projects functionality
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

// Declare the missing functions
function checkJournalEmpty() {
  const journalEntries = document.getElementById("journalEntries")
  if (journalEntries && journalEntries.children.length === 0) {
    document.getElementById("journalEmptyMessage").style.display = "block"
  } else {
    document.getElementById("journalEmptyMessage").style.display = "none"
  }
}

function checkProjectsEmpty() {
  const projectsList = document.getElementById("projectsList")
  if (projectsList && projectsList.children.length === 0) {
    document.getElementById("projectsEmptyMessage").style.display = "block"
  } else {
    document.getElementById("projectsEmptyMessage").style.display = "none"
  }
}

function initializeSettingsMenus() {
  // Placeholder for settings menu initialization logic
  console.log("Settings menus initialized")
}
