

/*

/ ============================================
// MODAL FUNCTIONALITY
// ============================================
// Handles opening and closing of all modals
function initializeModals() {
  console.log("[v0] initializeModals() called")

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
    console.log("[v0] Journal button clicked - opening modal")
    journalModal.style.display = "block"
    updateDateTime()
    checkJournalEmpty()
    showMobileFAB("journal")
  }

  // Open projects modal when clicking Projects button
  projectsBtn.onclick = () => {
    console.log("[v0] Projects button clicked - opening modal")
    projectsModal.style.display = "block"
    updateDateTime()
    checkProjectsEmpty()
    showMobileFAB("projects")
  }

  aboutBtn.onclick = () => {
    console.log("[v0] About button clicked - opening modal")
    aboutModal.style.display = "block"
    updateDateTime()
    hideMobileFAB()
  }

  cvBtn.onclick = () => {
    console.log("[v0] CV button clicked - opening modal")
    cvModal.style.display = "block"
    updateDateTime()
    hideMobileFAB()
  }

  // Close modals when clicking (x) button
  Array.from(closeButtons).forEach((button) => {
    button.onclick = function () {
      console.log("[v0] Close button clicked")
      this.closest(".modal").style.display = "none"
      hideMobileFAB()
    }
  })

  // Close modals when clicking outside the modal content
  window.onclick = (event) => {
    if (event.target.classList.contains("modal")) {
      console.log("[v0] Clicked outside modal - closing")
      event.target.style.display = "none"
      hideMobileFAB()
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
// EDIT ABOUT SECTION
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
// EDIT CV SECTION
// ============================================
// Allows editing of CV content and uploading CV files
function initializeEditCv() {
  const editCvBtn = document.getElementById("editCvBtn")
  const editCvModal = document.getElementById("editCvModal")
  const editCvForm = document.getElementById("editCvForm")
  const uploadCvBtn = document.getElementById("uploadCvBtn")
  const cvFileInput = document.getElementById("cvFileInput")

  let uploadedCvFile = null
  let uploadedCvURL = null

  if (!editCvBtn || !editCvModal || !editCvForm) {
    console.log("[v0] CV elements not found")
    return
  }

  console.log("[v0] CV edit functionality initialized")

  // Open edit modal and populate with current value
  editCvBtn.onclick = () => {
    console.log("[v0] Edit CV button clicked")
    const currentText = document.getElementById("cvContent").innerText.trim()
    document.getElementById("editCvText").value = currentText
    editCvModal.style.display = "block"
  }

  // Save changes when form is submitted
  editCvForm.onsubmit = (e) => {
    e.preventDefault()
    console.log("[v0] CV form submitted")

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
      console.log("[v0] Upload CV button clicked")
      cvFileInput.click()
    }

    cvFileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        console.log("[v0] CV file selected:", file.name)
        uploadedCvFile = file

        if (uploadedCvURL) {
          URL.revokeObjectURL(uploadedCvURL)
        }
        uploadedCvURL = URL.createObjectURL(file)

        // Display uploaded file name with view button
        const cvFileDisplay = document.getElementById("cvFileDisplay")
        const cvFileName = document.getElementById("cvFileName")
        const viewBtn = document.getElementById("viewCvBtn")

        cvFileName.textContent = file.name
        cvFileDisplay.style.display = "block"

        if (viewBtn) {
          viewBtn.onclick = () => {
            console.log("[v0] Opening uploaded CV:", uploadedCvURL)
            window.open(uploadedCvURL, "_blank")
          }
        }

        alert(`CV file "${file.name}" uploaded successfully! Click "View Uploaded CV" button to open it.`)
      }
    }
  } else {
    console.log("[v0] Upload CV button or file input not found")
  }
}

// ============================================
// SETTINGS MENU TOGGLES (+ BUTTONS)
// ============================================
// Handles the + button clicks to show/hide journal and project forms
function initializeSettingsMenus() {
  console.log("[v0] initializeSettingsMenus() called")

  const journalSettingsBtn = document.getElementById("journalSettingsBtn")
  const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")
  const journalForm = document.getElementById("journalForm")
  const projectForm = document.getElementById("projectForm")

  console.log("[v0] Journal settings button found:", !!journalSettingsBtn)
  console.log("[v0] Projects settings button found:", !!projectsSettingsBtn)
  console.log("[v0] Journal form found:", !!journalForm)
  console.log("[v0] Project form found:", !!projectForm)

  // Toggle journal form when clicking + button
  if (journalSettingsBtn && journalForm) {
    console.log("[v0] Attaching click handler to journal settings button")
    journalSettingsBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("[v0] ===== JOURNAL SETTINGS BUTTON CLICKED =====")
      console.log("[v0] Current form display:", journalForm.style.display)

      if (journalForm.style.display === "none" || journalForm.style.display === "") {
        journalForm.style.display = "block"
        journalSettingsBtn.textContent = "×"
        journalSettingsBtn.title = "Close Form"
        console.log("[v0] Journal form is now VISIBLE")
      } else {
        journalForm.style.display = "none"
        journalSettingsBtn.textContent = "+"
        journalSettingsBtn.title = "Add New Journal"
        journalForm.reset()
        console.log("[v0] Journal form is now HIDDEN")
      }
    }
    console.log("[v0] Journal settings button click handler attached successfully")
  } else {
    console.error("[v0] ERROR: Could not attach journal settings handler!")
  }

  // Toggle project form when clicking + button
  if (projectsSettingsBtn && projectForm) {
    console.log("[v0] Attaching click handler to projects settings button")
    projectsSettingsBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("[v0] ===== PROJECTS SETTINGS BUTTON CLICKED =====")
      console.log("[v0] Current form display:", projectForm.style.display)

      if (projectForm.style.display === "none" || projectForm.style.display === "") {
        projectForm.style.display = "block"
        projectsSettingsBtn.textContent = "×"
        projectsSettingsBtn.title = "Close Form"
        console.log("[v0] Project form is now VISIBLE")
      } else {
        projectForm.style.display = "none"
        projectsSettingsBtn.textContent = "+"
        projectsSettingsBtn.title = "Add New Project"
        projectForm.reset()
        console.log("[v0] Project form is now HIDDEN")
      }
    }
    console.log("[v0] Projects settings button click handler attached successfully")
  } else {
    console.error("[v0] ERROR: Could not attach projects settings handler!")
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] ========================================")
  console.log("[v0] PAGE LOADED - STARTING INITIALIZATION")
  console.log("[v0] ========================================")

  // Initialize all modal functionality
  initializeModals()

  // Initialize hero section editing
  initializeEditHero()

  // Initialize About and CV editing
  initializeEditAbout()
  initializeEditCv()

  initializeSettingsMenus()

  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime()

  // Initialize journal functionality
  const journalForm = document.getElementById("journalForm")
  const journalEntries = document.getElementById("journalEntries")

  console.log("[v0] Journal form element:", !!journalForm)
  console.log("[v0] Journal entries container:", !!journalEntries)

  if (journalForm) {
    journalForm.addEventListener("submit", (e) => {
      e.preventDefault()
      console.log("[v0] ===== JOURNAL FORM SUBMITTED =====")

      const title = document.getElementById("journalTitle").value
      const content = document.getElementById("journalContent").value

      console.log("[v0] Title:", title)
      console.log("[v0] Content length:", content.length)

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
      console.log("[v0] Journal entry added to DOM")

      // Clear form and hide it
      journalForm.reset()
      journalForm.style.display = "none"
      document.getElementById("journalSettingsBtn").textContent = "+"

      // Update empty state
      checkJournalEmpty()

      alert("Journal entry added successfully!")
    })
    console.log("[v0] Journal form submit handler attached")
  }

  // Initialize projects functionality
  const projectForm = document.getElementById("projectForm")
  const projectsList = document.getElementById("projectsList")

  console.log("[v0] Project form element:", !!projectForm)
  console.log("[v0] Projects list container:", !!projectsList)

  if (projectForm) {
    projectForm.addEventListener("submit", (e) => {
      e.preventDefault()
      console.log("[v0] ===== PROJECT FORM SUBMITTED =====")

      const title = document.getElementById("projectTitle").value
      const description = document.getElementById("projectDescription").value
      const files = document.getElementById("projectFiles").files

      console.log("[v0] Title:", title)
      console.log("[v0] Description length:", description.length)
      console.log("[v0] Files count:", files.length)

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
      console.log("[v0] Project entry added to DOM")

      // Clear form and hide it
      projectForm.reset()
      projectForm.style.display = "none"
      document.getElementById("projectsSettingsBtn").textContent = "+"

      // Update empty state
      checkProjectsEmpty()

      alert("Project added successfully!")
    })
    console.log("[v0] Project form submit handler attached")
  }

  // Initial empty state checks
  checkJournalEmpty()
  checkProjectsEmpty()

  console.log("[v0] ========================================")
  console.log("[v0] INITIALIZATION COMPLETE")
  console.log("[v0] ========================================")
})

// ============================================
// EMPTY STATE CHECKS
// ============================================
// Check if journal has entries and show/hide empty state message
function checkJournalEmpty() {
  const journalEntries = document.getElementById("journalEntries")
  const emptyState = document.getElementById("journalEmptyState")

  if (journalEntries && emptyState) {
    if (journalEntries.children.length === 0) {
      emptyState.style.display = "block"
    } else {
      emptyState.style.display = "none"
    }
  }
}

// Check if projects has entries and show/hide empty state message
function checkProjectsEmpty() {
  const projectsList = document.getElementById("projectsList")
  const emptyState = document.getElementById("projectsEmptyState")

  if (projectsList && emptyState) {
    if (projectsList.children.length === 0) {
      emptyState.style.display = "block"
    } else {
      emptyState.style.display = "none"
    }
  }
}

// ============================================
// MOBILE FLOATING ACTION BUTTON (FAB)
// ============================================
function showMobileFAB(type) {
  let fab = document.getElementById("mobileFAB")

  // Create FAB if it doesn't exist
  if (!fab) {
    fab = document.createElement("button")
    fab.id = "mobileFAB"
    fab.className = "mobile-fab"
    fab.innerHTML = "+"
    fab.title = "Add New Entry"
    document.body.appendChild(fab)
  }

  // Set up click handler based on type
  fab.onclick = () => {
    if (type === "journal") {
      const journalForm = document.getElementById("journalForm")
      const journalSettingsBtn = document.getElementById("journalSettingsBtn")

      if (journalForm.style.display === "none" || journalForm.style.display === "") {
        journalForm.style.display = "block"
        fab.innerHTML = "×"
        if (journalSettingsBtn) journalSettingsBtn.textContent = "×"
      } else {
        journalForm.style.display = "none"
        fab.innerHTML = "+"
        if (journalSettingsBtn) journalSettingsBtn.textContent = "+"
        journalForm.reset()
      }
    } else if (type === "projects") {
      const projectForm = document.getElementById("projectForm")
      const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")

      if (projectForm.style.display === "none" || projectForm.style.display === "") {
        projectForm.style.display = "block"
        fab.innerHTML = "×"
        if (projectsSettingsBtn) projectsSettingsBtn.textContent = "×"
      } else {
        projectForm.style.display = "none"
        fab.innerHTML = "+"
        if (projectsSettingsBtn) projectsSettingsBtn.textContent = "+"
        projectForm.reset()
      }
    }
  }

  fab.style.display = "flex"
}

function hideMobileFAB() {
  const fab = document.getElementById("mobileFAB")
  if (fab) {
    fab.style.display = "none"
  }
}

*/
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
    showMobileFAB("journal")
  }

  // Open projects modal when clicking Projects button
  projectsBtn.onclick = () => {
    projectsModal.style.display = "block"
    updateDateTime()
    checkProjectsEmpty()
    showMobileFAB("projects")
  }

  aboutBtn.onclick = () => {
    aboutModal.style.display = "block"
    updateDateTime()
    hideMobileFAB()
  }

  cvBtn.onclick = () => {
    cvModal.style.display = "block"
    updateDateTime()
    hideMobileFAB()
  }

  // Close modals when clicking (x) button
  Array.from(closeButtons).forEach((button) => {
    button.onclick = function () {
      this.closest(".modal").style.display = "none"
      hideMobileFAB()
    }
  })

  // Close modals when clicking outside the modal content
  window.onclick = (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
      hideMobileFAB()
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
// EDIT ABOUT SECTION
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
// EDIT CV SECTION
// ============================================
// Allows editing of CV content and uploading CV files
function initializeEditCv() {
  const editCvBtn = document.getElementById("editCvBtn")
  const editCvModal = document.getElementById("editCvModal")
  const editCvForm = document.getElementById("editCvForm")
  const uploadCvBtn = document.getElementById("uploadCvBtn")
  const cvFileInput = document.getElementById("cvFileInput")

  let uploadedCvFile = null
  let uploadedCvURL = null

  if (!editCvBtn || !editCvModal || !editCvForm) {
    return
  }

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
        uploadedCvFile = file

        if (uploadedCvURL) {
          URL.revokeObjectURL(uploadedCvURL)
        }
        uploadedCvURL = URL.createObjectURL(file)

        // Display uploaded file name with view button
        const cvFileDisplay = document.getElementById("cvFileDisplay")
        const cvFileName = document.getElementById("cvFileName")
        const viewBtn = document.getElementById("viewCvBtn")

        cvFileName.textContent = file.name
        cvFileDisplay.style.display = "block"

        if (viewBtn) {
          viewBtn.onclick = () => {
            window.open(uploadedCvURL, "_blank")
          }
        }

        alert(`CV file "${file.name}" uploaded successfully! Click "View Uploaded CV" button to open it.`)
      }
    }
  }
}

// ============================================
// SETTINGS MENU TOGGLES (+ BUTTONS)
// ============================================
// Handles the + button clicks to show/hide journal and project forms
function initializeSettingsMenus() {
  const journalSettingsBtn = document.getElementById("journalSettingsBtn")
  const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")
  const journalForm = document.getElementById("journalForm")
  const projectForm = document.getElementById("projectForm")

  // Toggle journal form when clicking + button
  if (journalSettingsBtn && journalForm) {
    journalSettingsBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (journalForm.style.display === "none" || journalForm.style.display === "") {
        journalForm.style.display = "block"
        journalSettingsBtn.textContent = "×"
        journalSettingsBtn.title = "Close Form"
      } else {
        journalForm.style.display = "none"
        journalSettingsBtn.textContent = "+"
        journalSettingsBtn.title = "Add New Journal"
        journalForm.reset()
      }
    }
  }

  // Toggle project form when clicking + button
  if (projectsSettingsBtn && projectForm) {
    projectsSettingsBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (projectForm.style.display === "none" || projectForm.style.display === "") {
        projectForm.style.display = "block"
        projectsSettingsBtn.textContent = "×"
        projectsSettingsBtn.title = "Close Form"
      } else {
        projectForm.style.display = "none"
        projectsSettingsBtn.textContent = "+"
        projectsSettingsBtn.title = "Add New Project"
        projectForm.reset()
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

  // Initialize About and CV editing
  initializeEditAbout()
  initializeEditCv()

  initializeSettingsMenus()

  initializeResetButtons()

  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime()

  // Initialize journal functionality
  const journalForm = document.getElementById("journalForm")
  const journalEntries = document.getElementById("journalEntries")

  if (journalForm) {
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

      let filesList = ""
      if (files.length > 0) {
        filesList = '<ul class="files-list">'
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileURL = URL.createObjectURL(file)
          const fileType = file.type.startsWith("image/") ? "image" : "video"

          filesList += `<li>
            <a href="${fileURL}" target="_blank" class="file-link" data-type="${fileType}">
              📎 ${file.name}
            </a>
          </li>`
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

// ============================================
// EMPTY STATE CHECKS
// ============================================
// Check if journal has entries and show/hide empty state message
function checkJournalEmpty() {
  const journalEntries = document.getElementById("journalEntries")
  const emptyState = document.getElementById("journalEmptyState")

  if (journalEntries && emptyState) {
    if (journalEntries.children.length === 0) {
      emptyState.style.display = "block"
    } else {
      emptyState.style.display = "none"
    }
  }
}

// Check if projects has entries and show/hide empty state message
function checkProjectsEmpty() {
  const projectsList = document.getElementById("projectsList")
  const emptyState = document.getElementById("projectsEmptyState")

  if (projectsList && emptyState) {
    if (projectsList.children.length === 0) {
      emptyState.style.display = "block"
    } else {
      emptyState.style.display = "none"
    }
  }
}

// ============================================
// MOBILE FLOATING ACTION BUTTON (FAB)
// ============================================
function showMobileFAB(type) {
  let fab = document.getElementById("mobileFAB")

  // Create FAB if it doesn't exist
  if (!fab) {
    fab = document.createElement("button")
    fab.id = "mobileFAB"
    fab.className = "mobile-fab"
    fab.innerHTML = "+"
    fab.title = "Add New Entry"
    document.body.appendChild(fab)
  }

  // Set up click handler based on type
  fab.onclick = () => {
    if (type === "journal") {
      const journalForm = document.getElementById("journalForm")
      const journalSettingsBtn = document.getElementById("journalSettingsBtn")

      if (journalForm.style.display === "none" || journalForm.style.display === "") {
        journalForm.style.display = "block"
        fab.innerHTML = "×"
        if (journalSettingsBtn) journalSettingsBtn.textContent = "×"
      } else {
        journalForm.style.display = "none"
        fab.innerHTML = "+"
        if (journalSettingsBtn) journalSettingsBtn.textContent = "+"
        journalForm.reset()
      }
    } else if (type === "projects") {
      const projectForm = document.getElementById("projectForm")
      const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")

      if (projectForm.style.display === "none" || projectForm.style.display === "") {
        projectForm.style.display = "block"
        fab.innerHTML = "×"
        if (projectsSettingsBtn) projectsSettingsBtn.textContent = "×"
      } else {
        projectForm.style.display = "none"
        fab.innerHTML = "+"
        if (projectsSettingsBtn) projectsSettingsBtn.textContent = "+"
        projectForm.reset()
      }
    }
  }

  fab.style.display = "flex"
}

function hideMobileFAB() {
  const fab = document.getElementById("mobileFAB")
  if (fab) {
    fab.style.display = "none"
  }
}

// ============================================
// RESET BUTTONS FUNCTIONALITY
// ============================================
function initializeResetButtons() {
  const resetJournalBtn = document.getElementById("resetJournalBtn")
  const resetProjectsBtn = document.getElementById("resetProjectsBtn")

  console.log("Initializing reset buttons...")
  console.log("Reset Journal Button:", resetJournalBtn)
  console.log("Reset Projects Button:", resetProjectsBtn)

  // Reset all journal entries
  if (resetJournalBtn) {
    resetJournalBtn.onclick = () => {
      console.log("Reset Journal button clicked!")
      const confirmed = confirm("Are you sure you want to delete ALL journal entries? This cannot be undone!")

      if (confirmed) {
        console.log("User confirmed deletion")
        const journalEntries = document.getElementById("journalEntries")
        journalEntries.innerHTML = ""
        checkJournalEmpty()
        alert("All journal entries have been deleted.")
      } else {
        console.log("User cancelled deletion")
      }
    }
    console.log("Reset Journal button handler attached successfully")
  } else {
    console.error("Reset Journal button not found!")
  }

  // Reset all project entries
  if (resetProjectsBtn) {
    resetProjectsBtn.onclick = () => {
      console.log("Reset Projects button clicked!")
      const confirmed = confirm("Are you sure you want to delete ALL projects? This cannot be undone!")

      if (confirmed) {
        console.log("User confirmed deletion")
        const projectsList = document.getElementById("projectsList")
        projectsList.innerHTML = ""
        checkProjectsEmpty()
        alert("All projects have been deleted.")
      } else {
        console.log("User cancelled deletion")
      }
    }
    console.log("Reset Projects button handler attached successfully")
  } else {
    console.error("Reset Projects button not found!")
  }
}
