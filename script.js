// Modal functionality
function initializeModals() {
  // Get modal elements
  const journalModal = document.getElementById("journalModal")
  const projectsModal = document.getElementById("projectsModal")
  const aboutModal = document.getElementById("aboutModal")

  const journalBtn = document.getElementById("journalBtn")
  const projectsBtn = document.getElementById("projectsBtn")
  const aboutBtn = document.getElementById("aboutBtn")

  const closeButtons = document.getElementsByClassName("close-button")

  // Open modals
  journalBtn.onclick = () => {
    journalModal.style.display = "block"
    updateDateTime()
  }

  projectsBtn.onclick = () => {
    projectsModal.style.display = "block"
    updateDateTime()
  }

  aboutBtn.onclick = () => {
    aboutModal.style.display = "block"
    updateDateTime()
  }

  // Close modals when clicking (x)
  Array.from(closeButtons).forEach((button) => {
    button.onclick = () => {
      journalModal.style.display = "none"
      projectsModal.style.display = "none"
      aboutModal.style.display = "none"
    }
  })

  // Close modals when clicking outside
  window.onclick = (event) => {
    if (event.target == journalModal) {
      journalModal.style.display = "none"
    }
    if (event.target == projectsModal) {
      projectsModal.style.display = "none"
    }
    if (event.target == aboutModal) {
      aboutModal.style.display = "none"
    }
  }
}

// Function to update date and time
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

  const journalDateTime = document.getElementById("journalDatetime")
  if (journalDateTime) {
    journalDateTime.textContent = dateTimeString
  }

  const projectsDateTime = document.getElementById("projectsDatetime")
  if (projectsDateTime) {
    projectsDateTime.textContent = dateTimeString
  }

  const aboutDateTime = document.getElementById("aboutDatetime")
  if (aboutDateTime) {
    aboutDateTime.textContent = dateTimeString
  }

  const pageDateTime = document.getElementById("pageDateTime")
  if (pageDateTime) {
    pageDateTime.textContent = dateTimeString
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeModals()
  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime() // Initial call

  // Journal functionality
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

      // Create new journal entry
      const entry = document.createElement("div")
      entry.className = "journal-entry"
      entry.innerHTML = `
                <h3>${title}</h3>
                <p>${content}</p>
                <small>${new Date().toLocaleString()}</small>
            `

      // Add entry to the list
      journalEntries.insertBefore(entry, journalEntries.firstChild)

      // Clear form
      journalForm.reset()
    })

    // New button functionality
    document.getElementById("newButton").addEventListener("click", () => {
      journalForm.reset()
      document.getElementById("journalTitle").focus()
    })
  }

  // Projects functionality
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

      // Create new project entry
      const project = document.createElement("div")
      project.className = "project-entry"

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

      // Add project to the list
      projectsList.insertBefore(project, projectsList.firstChild)

      // Clear form
      projectForm.reset()
    })

    // New button functionality
    document.getElementById("newProjectButton").addEventListener("click", () => {
      projectForm.reset()
      document.getElementById("projectTitle").focus()
    })
  }

  // Hero button functionality
  const journalBtnHero = document.getElementById("journalBtnHero")
  const projectsBtnHero = document.getElementById("projectsBtnHero")
  const journalModal = document.getElementById("journalModal")
  const projectsModal = document.getElementById("projectsModal")

  if (journalBtnHero) {
    journalBtnHero.onclick = () => {
      journalModal.style.display = "block"
      updateDateTime()
      loadJournalEntries()
    }
  }

  if (projectsBtnHero) {
    projectsBtnHero.onclick = () => {
      projectsModal.style.display = "block"
      updateDateTime()
      loadProjects()
    }
  }
})

// Function to load journal entries
function loadJournalEntries() {
  // Placeholder for loading journal entries
  console.log("Loading journal entries...")
}

// Function to load projects
function loadProjects() {
  // Placeholder for loading projects
  console.log("Loading projects...")
}
