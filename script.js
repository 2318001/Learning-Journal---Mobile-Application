// Modal functionality
function initializeModals() {
  // Get modal elements
  const journalModal = document.getElementById("journalModal")
  const projectsModal = document.getElementById("projectsModal")
  const aboutModal = document.getElementById("aboutModal")
  const editHeroModal = document.getElementById("editHeroModal")
  const editAboutModal = document.getElementById("editAboutModal")
  const cvModal = document.getElementById("cvModal")
  const editCVModal = document.getElementById("editCVModal")

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
    button.onclick = function () {
      this.closest(".modal").style.display = "none"
    }
  })

  // Close modals when clicking outside
  window.onclick = (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
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

  const cvDateTime = document.getElementById("cvDatetime")
  if (cvDateTime) {
    cvDateTime.textContent = dateTimeString
  }

  const pageDateTime = document.getElementById("pageDateTime")
  if (pageDateTime) {
    pageDateTime.textContent = dateTimeString
  }
}

function initializeEditHero() {
  const editHeroBtn = document.getElementById("editHeroBtn")
  const editHeroModal = document.getElementById("editHeroModal")
  const editHeroForm = document.getElementById("editHeroForm")

  editHeroBtn.onclick = () => {
    const currentName = document.getElementById("heroName").textContent
    const currentDesc = document.getElementById("heroDescription").textContent

    document.getElementById("editHeroName").value = currentName
    document.getElementById("editHeroDesc").value = currentDesc

    editHeroModal.style.display = "block"
  }

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

function initializeEditAbout() {
  const editAboutBtn = document.getElementById("editAboutBtn")
  const editAboutModal = document.getElementById("editAboutModal")
  const editAboutForm = document.getElementById("editAboutForm")

  editAboutBtn.onclick = () => {
    document.getElementById("editPurpose").value = document.getElementById("aboutPurpose").textContent
    document.getElementById("editFeatures").value = document.getElementById("aboutFeatures").textContent
    document.getElementById("editTech").value = document.getElementById("aboutTech").textContent
    document.getElementById("editMe").value = document.getElementById("aboutMe").textContent
    document.getElementById("editQuote").value = document.getElementById("aboutQuote").textContent

    editAboutModal.style.display = "block"
  }

  editAboutForm.onsubmit = (e) => {
    e.preventDefault()

    document.getElementById("aboutPurpose").textContent = document.getElementById("editPurpose").value
    document.getElementById("aboutFeatures").textContent = document.getElementById("editFeatures").value
    document.getElementById("aboutTech").textContent = document.getElementById("editTech").value
    document.getElementById("aboutMe").textContent = document.getElementById("editMe").value
    document.getElementById("aboutQuote").textContent = document.getElementById("editQuote").value

    editAboutModal.style.display = "none"
    alert("About section updated successfully!")
  }
}

function initializeCV() {
  const editCVBtn = document.getElementById("editCVBtn")
  const cvModal = document.getElementById("cvModal")
  const editCVModal = document.getElementById("editCVModal")
  const editCVForm = document.getElementById("editCVForm")

  // Add CV button to navigation
  const navList = document.querySelector(".nav-list")
  const cvNavItem = document.createElement("li")
  cvNavItem.innerHTML = '<a href="#" id="cvBtn">CV</a>'
  navList.appendChild(cvNavItem)

  const cvBtn = document.getElementById("cvBtn")
  cvBtn.onclick = () => {
    cvModal.style.display = "block"
    updateDateTime()
  }

  editCVBtn.onclick = () => {
    document.getElementById("editCVPersonal").value = document
      .getElementById("cvPersonal")
      .innerHTML.replace(/<br>/g, "\n")
    document.getElementById("editCVEducation").value = document
      .getElementById("cvEducation")
      .innerHTML.replace(/<br>/g, "\n")
    document.getElementById("editCVExperience").value = document
      .getElementById("cvExperience")
      .innerHTML.replace(/<br>/g, "\n")
    document.getElementById("editCVSkills").value = document.getElementById("cvSkills").textContent

    editCVModal.style.display = "block"
  }

  editCVForm.onsubmit = (e) => {
    e.preventDefault()

    document.getElementById("cvPersonal").innerHTML = document
      .getElementById("editCVPersonal")
      .value.replace(/\n/g, "<br>")
    document.getElementById("cvEducation").innerHTML = document
      .getElementById("editCVEducation")
      .value.replace(/\n/g, "<br>")
    document.getElementById("cvExperience").innerHTML = document
      .getElementById("editCVExperience")
      .value.replace(/\n/g, "<br>")
    document.getElementById("cvSkills").textContent = document.getElementById("editCVSkills").value

    editCVModal.style.display = "none"
    alert("CV updated successfully!")
  }
}

function initializeSettingsMenus() {
  const journalSettingsBtn = document.getElementById("journalSettingsBtn")
  const journalActionsMenu = document.getElementById("journalActionsMenu")
  const projectsSettingsBtn = document.getElementById("projectsSettingsBtn")
  const projectsActionsMenu = document.getElementById("projectsActionsMenu")

  journalSettingsBtn.onclick = () => {
    journalActionsMenu.style.display = journalActionsMenu.style.display === "none" ? "flex" : "none"
  }

  projectsSettingsBtn.onclick = () => {
    projectsActionsMenu.style.display = projectsActionsMenu.style.display === "none" ? "flex" : "none"
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeModals()
  initializeEditHero()
  initializeEditAbout()
  initializeCV()
  initializeSettingsMenus()

  // Update date and time every second
  setInterval(updateDateTime, 1000)
  updateDateTime() // Initial call

  // Journal functionality
  const journalForm = document.getElementById("journalForm")
  const journalEntries = document.getElementById("journalEntries")
  const addNewJournalBtn = document.getElementById("addNewJournalBtn")
  const resetAllJournalBtn = document.getElementById("resetAllJournalBtn")

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

      journalEntries.insertBefore(entry, journalEntries.firstChild)

      // Clear form
      journalForm.reset()
      alert("Journal entry added successfully!")
    })

    addNewJournalBtn.addEventListener("click", () => {
      journalForm.reset()
      document.getElementById("journalTitle").focus()
      document.getElementById("journalActionsMenu").style.display = "none"
    })

    resetAllJournalBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete ALL journal entries? This cannot be undone.")) {
        journalEntries.innerHTML = ""
        journalForm.reset()
        document.getElementById("journalActionsMenu").style.display = "none"
        alert("All journal entries have been deleted.")
      }
    })
  }

  // Projects functionality
  const projectForm = document.getElementById("projectForm")
  const projectsList = document.getElementById("projectsList")
  const addNewProjectBtn = document.getElementById("addNewProjectBtn")
  const resetAllProjectsBtn = document.getElementById("resetAllProjectsBtn")

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

      projectsList.insertBefore(project, projectsList.firstChild)

      // Clear form
      projectForm.reset()
      alert("Project added successfully!")
    })

    addNewProjectBtn.addEventListener("click", () => {
      projectForm.reset()
      document.getElementById("projectTitle").focus()
      document.getElementById("projectsActionsMenu").style.display = "none"
    })

    resetAllProjectsBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete ALL projects? This cannot be undone.")) {
        projectsList.innerHTML = ""
        projectForm.reset()
        document.getElementById("projectsActionsMenu").style.display = "none"
        alert("All projects have been deleted.")
      }
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
    }
  }

  if (projectsBtnHero) {
    projectsBtnHero.onclick = () => {
      projectsModal.style.display = "block"
      updateDateTime()
    }
  }
})
