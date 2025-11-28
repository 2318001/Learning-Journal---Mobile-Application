// Journal Manager - Handles journal entries with form validation and filters
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

    this.currentFilters = {
      keyword: "",
      date: "",
      length: "all",
    }

    this.init()
  }

  async init() {
    await this.loadJournals()

    if (this.journalSettingsBtn) {
      this.journalSettingsBtn.addEventListener("click", () => this.toggleForm())
    }
    if (this.journalForm) {
      this.journalForm.addEventListener("submit", (e) => this.handleSubmit(e))
    }
    if (this.resetJournalBtn) {
      this.resetJournalBtn.addEventListener("click", () => this.resetJournals())
    }

    this.setupFilters()
  }

  setupFilters() {
    const keywordInput = document.getElementById("journalKeywordFilter")
    const dateInput = document.getElementById("journalDateFilter")
    const lengthSelect = document.getElementById("journalLengthFilter")

    if (keywordInput) {
      keywordInput.addEventListener("input", (e) => {
        this.currentFilters.keyword = e.target.value
        this.loadJournals()
      })
    }

    if (dateInput) {
      dateInput.addEventListener("change", (e) => {
        this.currentFilters.date = e.target.value
        this.loadJournals()
      })
    }

    if (lengthSelect) {
      lengthSelect.addEventListener("change", (e) => {
        this.currentFilters.length = e.target.value
        this.loadJournals()
      })
    }
  }

  filterJournals(journals) {
    let filtered = [...journals]

    // Filter by keyword
    if (this.currentFilters.keyword) {
      const keyword = this.currentFilters.keyword.toLowerCase()
      filtered = filtered.filter(
        (entry) => entry.title.toLowerCase().includes(keyword) || entry.content.toLowerCase().includes(keyword),
      )
    }

    // Filter by date
    if (this.currentFilters.date) {
      const filterDate = new Date(this.currentFilters.date).toDateString()
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.timestamp).toDateString()
        return entryDate === filterDate
      })
    }

    // Filter by length
    if (this.currentFilters.length !== "all") {
      filtered = filtered.filter((entry) => {
        const contentLength = entry.content.length
        if (this.currentFilters.length === "short") return contentLength < 200
        if (this.currentFilters.length === "medium") return contentLength >= 200 && contentLength < 500
        if (this.currentFilters.length === "long") return contentLength >= 500
        return true
      })
    }

    return filtered
  }

  setValidationManager(manager) {
    this.validationManager = manager
  }

  openModal() {
    if (this.journalModal) {
      this.journalModal.style.display = "block"
      updateDateTime("journalDatetime")
      if (this.journalForm) this.journalForm.style.display = "none"
    }
  }

  toggleForm() {
    if (this.journalForm) {
      const isHidden = this.journalForm.style.display === "none"
      this.journalForm.style.display = isHidden ? "block" : "none"
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
        this.updateCounter(0, 0)
        return
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      const filtered = this.filterJournals(journals)

      this.updateCounter(filtered.length, journals.length)

      if (this.journalEntries) {
        this.journalEntries.innerHTML = filtered
          .map(
            (entry) => `
            <div class="journal-entry">
              <div class="entry-header">
                <h3>${this.escapeHtml(entry.title)}</h3>
                <small>${entry.dateString}</small>
              </div>
              <p>${this.escapeHtml(entry.content)}</p>
            </div>
          `,
          )
          .join("")
      }
    } catch (error) {
      console.error("Error loading journals:", error)
    }
  }

  updateCounter(filteredCount, totalCount) {
    const counter = document.getElementById("journalCounter")
    if (counter) {
      if (totalCount && filteredCount < totalCount) {
        counter.textContent = `Showing ${filteredCount} of ${totalCount} Reflection${totalCount !== 1 ? "s" : ""}`
      } else {
        counter.textContent = `${filteredCount} Reflection${filteredCount !== 1 ? "s" : ""}`
      }
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

// Projects Manager - Handles project entries with file upload
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

    // File upload elements
    this.projectFileInput = document.getElementById("projectFile")
    this.projectFileBtn = document.getElementById("projectFileBtn")
    this.projectFileName = document.getElementById("projectFileName")

    this.init()
  }

  async init() {
    await this.loadProjects()

    if (this.projectsSettingsBtn) {
      this.projectsSettingsBtn.addEventListener("click", () => this.toggleForm())
    }
    if (this.projectForm) {
      this.projectForm.addEventListener("submit", (e) => this.handleSubmit(e))
    }
    if (this.resetProjectsBtn) {
      this.resetProjectsBtn.addEventListener("click", () => this.resetProjects())
    }

    // File upload event listeners
    if (this.projectFileBtn && this.projectFileInput) {
      this.projectFileBtn.addEventListener("click", () => {
        this.projectFileInput.click()
      })
    }

    if (this.projectFileInput) {
      this.projectFileInput.addEventListener("change", () => {
        if (this.projectFileInput.files.length > 0) {
          this.projectFileName.textContent = this.projectFileInput.files[0].name
        } else {
          this.projectFileName.textContent = "No file chosen"
        }
      })
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

    if (this.projectFileInput && this.projectFileInput.files.length > 0) {
      const file = this.projectFileInput.files[0]
      project.fileName = file.name
      project.fileType = file.type
      project.fileSize = file.size

      try {
        project.fileData = await this.readFileAsDataURL(file)
      } catch (error) {
        console.error("Error reading file:", error)
        alert("Error reading the file. Please try again.")
        return
      }
    }

    try {
      if (this.storage && typeof this.storage.addToIndexedDB === "function") {
        await this.storage.addToIndexedDB("projects", project)
      }
      this.projectForm.reset()
      if (this.projectForm) this.projectForm.style.display = "none"

      this.resetFileInput()

      const localProjects = this.storage.getLocal("projects") || []
      localProjects.unshift(project)
      this.storage.setLocal("projects", localProjects)

      await this.loadProjects()
    } catch (error) {
      console.error("Error saving project:", error)
      alert("Error saving project. Please try again.")
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  resetFileInput() {
    if (this.projectFileInput) {
      this.projectFileInput.value = ""
    }
    if (this.projectFileName) {
      this.projectFileName.textContent = "No file chosen"
    }
  }

  downloadFile(fileData, fileName) {
    const link = document.createElement("a")
    link.href = fileData
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            (project, index) => `
            <div class="project-card">
              <div class="project-header">
                <h3>${this.escapeHtml(project.title)}</h3>
                <small>${project.dateString}</small>
              </div>
              <p>${this.escapeHtml(project.description)}</p>
              ${
                project.fileName
                  ? `
                <div class="project-file">
                  <p><strong>📎 File:</strong> ${this.escapeHtml(project.fileName)} (${this.formatFileSize(project.fileSize)})</p>
                  <button class="file-download" onclick="window.projectsManager.downloadFile(\`${project.fileData}\`, \`${this.escapeHtml(project.fileName)}\`)">
                    📥 Download File
                  </button>
                </div>
              `
                  : ""
              }
            </div>
          `,
          )
          .join("")
      }
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

// Quiz Game Manager - Handles quiz game functionality
class QuizGameManager {
  constructor(storage) {
    this.storage = storage
    this.quizBtn = document.getElementById("quizBtn")
    this.quizModal = document.getElementById("quizModal")
    this.quizCloseBtn = document.getElementById("quizCloseBtn")
    this.quizMenuBtn = document.getElementById("quizMenuBtn")
    this.quizNavMenu = document.getElementById("quizNavMenu")

    // Navigation items
    this.navItems = document.querySelectorAll(".nav-item")

    // Game elements
    this.rulesSection = document.getElementById("rulesSection")
    this.playerSetup = document.getElementById("playerSetup")
    this.levelSelection = document.getElementById("levelSelection")
    this.gameArea = document.getElementById("gameArea")
    this.resultsArea = document.getElementById("resultsArea")
    this.leaderboard = document.getElementById("leaderboard")

    // Inputs and buttons
    this.playerNameInput = document.getElementById("playerName")
    this.startGameBtn = document.getElementById("startGameBtn")
    this.levelButtons = document.querySelectorAll(".level-btn")
    this.nextQuestionBtn = document.getElementById("nextQuestionBtn")
    this.endGameBtn = document.getElementById("endGameBtn")
    this.playAgainBtn = document.getElementById("playAgainBtn")
    this.resetScoresBtn = document.getElementById("resetScoresBtn")
    this.viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn")
    this.backToMenuBtn = document.getElementById("backToMenuBtn")

    // Display elements
    this.currentPlayerName = document.getElementById("currentPlayerName")
    this.currentLevel = document.getElementById("currentLevel")
    this.currentScore = document.getElementById("currentScore")
    this.timerDisplay = document.getElementById("timer")
    this.progressFill = document.getElementById("progressFill")
    this.questionText = document.getElementById("questionText")
    this.optionsContainer = document.getElementById("optionsContainer")
    this.currentQuestionNum = document.getElementById("currentQuestionNum")
    this.totalQuestions = document.getElementById("totalQuestions")
    this.resultPlayerName = document.getElementById("resultPlayerName")
    this.resultLevel = document.getElementById("resultLevel")
    this.finalScore = document.getElementById("finalScore")
    this.highScoreMessage = document.getElementById("highScoreMessage")
    this.leaderboardContent = document.getElementById("leaderboardContent")
    this.nameError = document.getElementById("nameError")

    // Game state
    this.currentPlayer = ""
    this.currentDifficulty = ""
    this.score = 0
    this.currentQuestionIndex = 0
    this.timer = null
    this.timeLeft = 60
    this.totalTime = 60

    // Quiz questions by difficulty
    this.questions = {
      easy: [
        {
          question: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Hyper Transfer Markup Language",
            "Home Tool Markup Language",
          ],
          correct: 0,
        },
        {
          question: "Which language is used for styling web pages?",
          options: ["HTML", "JavaScript", "CSS", "Python"],
          correct: 2,
        },
        {
          question: "What is the latest version of HTML?",
          options: ["HTML4", "XHTML", "HTML5", "HTML2023"],
          correct: 2,
        },
        {
          question: "Which tag is used to create a hyperlink?",
          options: ["<link>", "<a>", "<href>", "<hyperlink>"],
          correct: 1,
        },
        {
          question: "What does CSS stand for?",
          options: [
            "Computer Style Sheets",
            "Creative Style System",
            "Cascading Style Sheets",
            "Colorful Style Sheets",
          ],
          correct: 2,
        },
      ],
      medium: [
        {
          question: "Which symbol is used for comments in JavaScript?",
          options: ["//", "<!-- -->", "**", "%%"],
          correct: 0,
        },
        {
          question: "Which method adds an element to the end of an array?",
          options: ["push()", "pop()", "shift()", "unshift()"],
          correct: 0,
        },
        {
          question: "What is the result of 2 + '2' in JavaScript?",
          options: ["4", "22", "NaN", "Error"],
          correct: 1,
        },
        {
          question: "Which HTML5 element is used for drawing graphics?",
          options: ["<graphic>", "<canvas>", "<draw>", "<svg>"],
          correct: 1,
        },
        {
          question: "What does API stand for?",
          options: [
            "Application Programming Interface",
            "Advanced Programming Instruction",
            "Automated Program Integration",
            "Application Process Integration",
          ],
          correct: 0,
        },
      ],
      hard: [
        {
          question: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
          correct: 1,
        },
        {
          question: "Which is NOT a JavaScript framework?",
          options: ["React", "Vue", "Angular", "Flask"],
          correct: 3,
        },
        {
          question: "What is a closure in JavaScript?",
          options: [
            "A function that has access to its outer function's scope",
            "A way to close a browser window",
            "A method to end a program",
            "A type of loop",
          ],
          correct: 0,
        },
        {
          question: "Which HTTP status code means 'Not Found'?",
          options: ["200", "301", "404", "500"],
          correct: 2,
        },
        {
          question: "What is the purpose of the 'virtual DOM' in React?",
          options: [
            "To improve rendering performance",
            "To create 3D effects",
            "To handle virtual reality",
            "To manage server-side rendering",
          ],
          correct: 0,
        },
      ],
    }

    this.init()
  }

  init() {
    // Event listeners for navigation
    if (this.quizMenuBtn) {
      this.quizMenuBtn.addEventListener("click", () => this.toggleNavMenu())
    }
    if (this.quizCloseBtn) {
      this.quizCloseBtn.addEventListener("click", () => this.closeModal())
    }

    if (this.navItems) {
      this.navItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          const section = e.target.dataset.section
          this.showSection(section)
          if (this.quizNavMenu) {
            this.quizNavMenu.classList.remove("active")
          }
        })
      })
    }

    // Game event listeners
    if (this.startGameBtn) {
      this.startGameBtn.addEventListener("click", () => this.startGame())
    }

    if (this.levelButtons) {
      this.levelButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.currentDifficulty = btn.dataset.level
          this.startQuiz()
        })
      })
    }

    if (this.nextQuestionBtn) {
      this.nextQuestionBtn.addEventListener("click", () => this.nextQuestion())
    }

    if (this.endGameBtn) {
      this.endGameBtn.addEventListener("click", () => this.endGame())
    }

    if (this.playAgainBtn) {
      this.playAgainBtn.addEventListener("click", () => this.playAgain())
    }

    if (this.viewLeaderboardBtn) {
      this.viewLeaderboardBtn.addEventListener("click", () => this.showSection("leaderboard"))
    }

    if (this.resetScoresBtn) {
      this.resetScoresBtn.addEventListener("click", () => this.resetLeaderboard())
    }

    if (this.backToMenuBtn) {
      this.backToMenuBtn.addEventListener("click", () => this.showSection("playerSetup"))
    }
  }

  openModal() {
    if (this.quizModal) {
      this.quizModal.style.display = "block"
      document.body.classList.add("modal-open")
      this.showSection("playerSetup")
    }
  }

  closeModal() {
    if (this.quizModal) {
      this.quizModal.style.display = "none"
      document.body.classList.remove("modal-open")
      this.resetGame()
    }
  }

  toggleNavMenu() {
    if (this.quizNavMenu) {
      this.quizNavMenu.classList.toggle("active")
    }
  }

  showSection(sectionName) {
    const sections = [
      this.rulesSection,
      this.playerSetup,
      this.levelSelection,
      this.gameArea,
      this.resultsArea,
      this.leaderboard,
    ]

    sections.forEach((section) => {
      if (section) {
        section.classList.remove("active")
      }
    })

    const targetSection = document.getElementById(sectionName)
    if (targetSection) {
      targetSection.classList.add("active")
    }

    if (sectionName === "leaderboard") {
      this.displayLeaderboard()
    }
  }

  startGame() {
    const playerName = this.playerNameInput ? this.playerNameInput.value.trim() : ""

    if (!playerName || playerName.length < 2) {
      if (this.nameError) {
        this.nameError.textContent = "Please enter a valid name (at least 2 characters)"
        this.nameError.style.display = "block"
      }
      if (this.playerNameInput) {
        this.playerNameInput.classList.add("invalid")
      }
      return
    }

    this.currentPlayer = playerName
    if (this.nameError) {
      this.nameError.style.display = "none"
    }
    if (this.playerNameInput) {
      this.playerNameInput.classList.remove("invalid")
    }

    this.showSection("levelSelection")
  }

  startQuiz() {
    this.score = 0
    this.currentQuestionIndex = 0
    this.timeLeft = this.totalTime

    if (this.currentPlayerName) this.currentPlayerName.textContent = this.currentPlayer
    if (this.currentLevel) this.currentLevel.textContent = this.currentDifficulty.toUpperCase()
    if (this.currentScore) this.currentScore.textContent = "0"

    this.showSection("gameArea")
    this.startTimer()
    this.displayQuestion()
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      this.timeLeft--

      if (this.timerDisplay) {
        this.timerDisplay.textContent = this.timeLeft
      }

      if (this.progressFill) {
        const percentage = (this.timeLeft / this.totalTime) * 100
        this.progressFill.style.width = percentage + "%"
      }

      if (this.timeLeft <= 0) {
        this.endGame()
      }
    }, 1000)
  }

  displayQuestion() {
    const questions = this.questions[this.currentDifficulty]
    if (!questions || this.currentQuestionIndex >= questions.length) {
      this.endGame()
      return
    }

    const question = questions[this.currentQuestionIndex]

    if (this.questionText) {
      this.questionText.textContent = question.question
    }

    if (this.currentQuestionNum) {
      this.currentQuestionNum.textContent = this.currentQuestionIndex + 1
    }

    if (this.totalQuestions) {
      this.totalQuestions.textContent = questions.length
    }

    if (this.optionsContainer) {
      this.optionsContainer.innerHTML = question.options
        .map(
          (option, index) => `
                <button class="option-btn" data-index="${index}">
                    ${option}
                </button>
            `,
        )
        .join("")

      const optionButtons = this.optionsContainer.querySelectorAll(".option-btn")
      optionButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => this.checkAnswer(Number.parseInt(e.target.dataset.index)))
      })
    }

    if (this.nextQuestionBtn) {
      this.nextQuestionBtn.style.display = "none"
    }
  }

  checkAnswer(selectedIndex) {
    const questions = this.questions[this.currentDifficulty]
    const question = questions[this.currentQuestionIndex]
    const optionButtons = this.optionsContainer.querySelectorAll(".option-btn")

    optionButtons.forEach((btn) => (btn.disabled = true))

    if (selectedIndex === question.correct) {
      optionButtons[selectedIndex].classList.add("correct")
      const points = this.currentDifficulty === "easy" ? 10 : this.currentDifficulty === "medium" ? 20 : 30
      this.score += points
      if (this.currentScore) {
        this.currentScore.textContent = this.score
      }
    } else {
      optionButtons[selectedIndex].classList.add("wrong")
      optionButtons[question.correct].classList.add("correct")
    }

    if (this.nextQuestionBtn) {
      this.nextQuestionBtn.style.display = "block"
    }
  }

  nextQuestion() {
    this.currentQuestionIndex++
    this.displayQuestion()
  }

  endGame() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    if (this.resultPlayerName) this.resultPlayerName.textContent = this.currentPlayer
    if (this.resultLevel) this.resultLevel.textContent = this.currentDifficulty.toUpperCase()
    if (this.finalScore) this.finalScore.textContent = this.score

    this.saveScore()
    this.showSection("resultsArea")
  }

  saveScore() {
    const scores = this.storage.getLocal("quizScores") || []

    scores.push({
      player: this.currentPlayer,
      level: this.currentDifficulty,
      score: this.score,
      date: new Date().toLocaleString(),
    })

    scores.sort((a, b) => b.score - a.score)

    const topScores = scores.slice(0, 10)
    this.storage.setLocal("quizScores", topScores)

    if (this.highScoreMessage) {
      const rank = topScores.findIndex((s) => s.player === this.currentPlayer && s.score === this.score) + 1
      if (rank <= 3) {
        this.highScoreMessage.textContent = `🎉 Congratulations! You're #${rank} on the leaderboard!`
        this.highScoreMessage.style.display = "block"
      } else {
        this.highScoreMessage.style.display = "none"
      }
    }
  }

  displayLeaderboard() {
    const scores = this.storage.getLocal("quizScores") || []

    if (this.leaderboardContent) {
      if (scores.length === 0) {
        this.leaderboardContent.innerHTML = `
                    <div class="empty-state">
                        <p>No scores yet. Be the first to play!</p>
                    </div>
                `
      } else {
        this.leaderboardContent.innerHTML = `
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Level</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scores
                              .map(
                                (score, index) => `
                                <tr class="${index < 3 ? "top-score" : ""}">
                                    <td>${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
                                    <td>${this.escapeHtml(score.player)}</td>
                                    <td>${score.level.toUpperCase()}</td>
                                    <td><strong>${score.score}</strong></td>
                                    <td>${score.date}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                `
      }
    }
  }

  resetLeaderboard() {
    if (confirm("Are you sure you want to reset all scores? This cannot be undone.")) {
      this.storage.removeLocal("quizScores")
      this.displayLeaderboard()
    }
  }

  playAgain() {
    this.showSection("levelSelection")
  }

  resetGame() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.currentPlayer = ""
    this.currentDifficulty = ""
    this.score = 0
    this.currentQuestionIndex = 0
    this.timeLeft = 60
    if (this.playerNameInput) {
      this.playerNameInput.value = ""
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

class YouTubeManager {
  constructor(storage) {
    this.storage = storage
    this.player = null
    this.currentVideoId = null
    this.loadVideoBtn = document.getElementById("loadVideoBtn")
    this.saveVideoBtn = document.getElementById("saveVideoBtn")
    this.youtubeVideoIdInput = document.getElementById("youtubeVideoId")
    this.videoControls = document.getElementById("videoControls")
    this.savedVideosList = document.getElementById("savedVideosList")

    this.init()
  }

  init() {
    if (this.loadVideoBtn) {
      this.loadVideoBtn.addEventListener("click", () => this.loadVideo())
    }

    if (this.saveVideoBtn) {
      this.saveVideoBtn.addEventListener("click", () => this.saveVideo())
    }

    if (this.youtubeVideoIdInput) {
      this.youtubeVideoIdInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.loadVideo()
        }
      })
    }

    this.initPlayerButtons()
    this.loadSavedVideos()
  }

  extractVideoId(input) {
    if (!input) return null

    input = input.trim()

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  loadVideo() {
    const input = this.youtubeVideoIdInput ? this.youtubeVideoIdInput.value.trim() : ""
    const videoId = this.extractVideoId(input)

    if (!videoId) {
      alert("Please enter a valid YouTube video ID or URL.")
      return
    }

    this.currentVideoId = videoId

    if (!this.player) {
      // Declare YT here to satisfy linter/compiler, assuming it's globally available
      const YT = window.YT
      this.player = new YT.Player("youtubePlayer", {
        height: "390",
        width: "100%",
        videoId: videoId,
        playerVars: {
          playsinline: 1,
        },
        events: {
          onReady: (event) => this.onPlayerReady(event),
        },
      })
    } else {
      this.player.loadVideoById(videoId)
    }

    if (this.videoControls) {
      this.videoControls.style.display = "flex"
    }
  }

  saveVideo() {
    if (!this.currentVideoId) {
      alert("Please load a video first before saving.")
      return
    }

    const videoTitle = this.youtubeVideoIdInput ? this.youtubeVideoIdInput.value.trim() : this.currentVideoId

    const savedVideos = this.storage.getLocal("savedVideos") || []

    // Check if video already exists
    const exists = savedVideos.some((v) => v.videoId === this.currentVideoId)
    if (exists) {
      alert("This video is already saved!")
      return
    }

    savedVideos.push({
      videoId: this.currentVideoId,
      title: videoTitle,
      savedDate: new Date().toLocaleString(),
    })

    this.storage.setLocal("savedVideos", savedVideos)
    this.loadSavedVideos()
    alert("Video saved successfully!")
  }

  loadSavedVideos() {
    const savedVideos = this.storage.getLocal("savedVideos") || []

    if (!this.savedVideosList) return

    if (savedVideos.length === 0) {
      this.savedVideosList.innerHTML =
        '<p style="color: var(--text-tertiary); text-align: center;">No saved videos yet.</p>'
      return
    }

    this.savedVideosList.innerHTML = savedVideos
      .map(
        (video, index) => `
      <div class="saved-video-item">
        <div class="saved-video-info">
          <div class="saved-video-title">${this.escapeHtml(video.title)}</div>
          <div class="saved-video-id">ID: ${video.videoId} • Saved: ${video.savedDate}</div>
        </div>
        <div class="saved-video-actions">
          <button class="saved-video-btn load" onclick="window.youtubeManager.loadSavedVideo('${video.videoId}')">
            ▶ Load
          </button>
          <button class="saved-video-btn delete" onclick="window.youtubeManager.deleteSavedVideo(${index})">
            🗑 Delete
          </button>
        </div>
      </div>
    `,
      )
      .join("")
  }

  loadSavedVideo(videoId) {
    if (this.youtubeVideoIdInput) {
      this.youtubeVideoIdInput.value = videoId
    }
    this.loadVideo()
  }

  deleteSavedVideo(index) {
    if (!confirm("Are you sure you want to delete this saved video?")) return

    const savedVideos = this.storage.getLocal("savedVideos") || []
    savedVideos.splice(index, 1)
    this.storage.setLocal("savedVideos", savedVideos)
    this.loadSavedVideos()
  }

  onPlayerReady(event) {
    console.log("YouTube player is ready")
  }

  initPlayerButtons() {
    const playBtn = document.getElementById("playBtn")
    const pauseBtn = document.getElementById("pauseBtn")

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        if (this.player) this.player.playVideo()
      })
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        if (this.player) this.player.pauseVideo()
      })
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Utility: Date/time update
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

// Modal system setup
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
      if (
        modalId === "journalModal" &&
        managers.journalManager &&
        typeof managers.journalManager.openModal === "function"
      ) {
        managers.journalManager.openModal()
      } else if (
        modalId === "projectsModal" &&
        managers.projectsManager &&
        typeof managers.projectsManager.openModal === "function"
      ) {
        managers.projectsManager.openModal()
      } else if (
        modalId === "quizModal" &&
        managers.quizManager &&
        typeof managers.quizManager.openModal === "function"
      ) {
        managers.quizManager.openModal()
      } else {
        modal.style.display = "block"
        const dtId = modalId.replace("Modal", "Datetime")
        updateDateTime(dtId)
      }
    })
  })

  // Fallback: support nav ids
  const navMap = {
    journalBtn: "journalModal",
    projectsBtn: "projectsModal",
    quizBtn: "quizModal",
    aboutBtn: "aboutModal",
    cvBtn: "cvModal",
  }

  Object.entries(navMap).forEach(([btnId, modalId]) => {
    const button = document.getElementById(btnId)
    const modal = document.getElementById(modalId)
    if (!button || !modal) return

    button.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (
        modalId === "journalModal" &&
        managers.journalManager &&
        typeof managers.journalManager.openModal === "function"
      ) {
        managers.journalManager.openModal()
      } else if (
        modalId === "projectsModal" &&
        managers.projectsManager &&
        typeof managers.projectsManager.openModal === "function"
      ) {
        managers.projectsManager.openModal()
      } else if (
        modalId === "quizModal" &&
        managers.quizManager &&
        typeof managers.quizManager.openModal === "function"
      ) {
        managers.quizManager.openModal()
      } else {
        modal.style.display = "block"
        updateDateTime(modalId.replace("Modal", "Datetime"))
      }
    })
  })
}

// Initialize other modals (About, CV, Hero, Profile Picture)
function initializeOtherModals(storage) {
  const editProfilePicBtn = document.getElementById("editProfilePicBtn")
  const profilePicInput = document.getElementById("profilePicInput")
  const profileImage = document.getElementById("profileImage")

  if (editProfilePicBtn && profilePicInput && profileImage) {
    editProfilePicBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      profilePicInput.click()
    })

    profilePicInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          profileImage.src = event.target.result
          storage.setLocal("profilePicture", event.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        alert("Please select a valid image file")
      }
    })

    const savedProfilePic = storage.getLocal("profilePicture")
    if (savedProfilePic) {
      profileImage.src = savedProfilePic
    }
  }

  // About section
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

  // CV section
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
      alert("CV content updated successfully!")
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
          alert(`CV file "${file.name}" uploaded successfully!`)
        }
        reader.readAsDataURL(file)
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

  const deleteCvBtn = document.createElement("button")
  deleteCvBtn.id = "deleteCvBtn"
  deleteCvBtn.className = "delete-btn"
  deleteCvBtn.textContent = "Delete CV"
  deleteCvBtn.style.marginLeft = "10px"

  if (cvFileDisplay && viewCvBtn) {
    viewCvBtn.parentNode.insertBefore(deleteCvBtn, viewCvBtn.nextSibling)
  }

  deleteCvBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete the CV? This cannot be undone.")) {
      storage.removeLocal("cvFileName")
      storage.removeLocal("cvFileData")
      if (cvFileDisplay) cvFileDisplay.style.display = "none"
      if (cvFileName) cvFileName.textContent = ""
      alert("CV file deleted successfully!")
    }
  })

  const savedCvFileName = storage.getLocal("cvFileName")
  if (savedCvFileName && cvFileName && cvFileDisplay) {
    cvFileName.textContent = savedCvFileName
    cvFileDisplay.style.display = "block"
  }

  const savedCv = storage.getLocal("cvContent")
  if (savedCv && cvContent) cvContent.innerHTML = savedCv

  // Hero section
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

// DOMContentLoaded: Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  // Check for required classes
  if (typeof StorageManager === "undefined") {
    console.error("StorageManager not found. Make sure storage.js is loaded before script.js")
    return
  }
  if (typeof window.BrowserAPIsManager === "undefined") {
    console.error("BrowserAPIsManager not found. Make sure browser.js is loaded before script.js")
    return
  }

  const storage = new StorageManager()
  const browserAPIs = new window.BrowserAPIsManager(storage)
  const youtubeManager = new YouTubeManager(storage)
  const journalManager = new JournalManager(storage, browserAPIs)
  const projectsManager = new ProjectsManager(storage, browserAPIs)
  const quizManager = new QuizGameManager(storage)

  window.youtubeManager = youtubeManager
  window.projectsManager = projectsManager

  if (browserAPIs && typeof journalManager.setValidationManager === "function") {
    journalManager.setValidationManager(browserAPIs)
  }

  startPageDateTime()
  setupModalSystem({ journalManager, projectsManager, quizManager })
  initializeOtherModals(storage)

  console.log("Learning Journal loaded successfully")
})
