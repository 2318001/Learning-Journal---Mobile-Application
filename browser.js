// Browser APIs Manager - Handles Geolocation, Notifications, and Clipboard APIs
class BrowserAPIsManager {
  constructor(storage) {
    this.storage = storage
    this.init()
  }

  init() {
    // Form Validation Manager - Handles HTML5 Constraint Validation API
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

// Export for use in other modules
if (typeof window !== "undefined") {
  window.BrowserAPIsManager = BrowserAPIsManager
}
