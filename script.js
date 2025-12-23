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
                     Download File
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

// Quiz Game Manager Class
class QuizGameManager {
  constructor(storage) {
    this.storage = storage
    this.playerName = ""
    this.currentLevel = 1
    this.currentQuestionIndex = 0
    this.score = 0
    this.totalStars = 0
    this.currentQuestions = []
    this.correctAnswers = 0
    this.timerInterval = null
    this.questionTimerInterval = null
    this.startTime = null
    this.elapsedTime = 0
    this.gameMode = "normal" // "normal" or "challenge"
    this.questionTimeLimit = 10 // seconds for challenge mode
    this.questionStartTime = null
    this.profiles = {}
    this.currentProfile = null

    // Game mode states
    this.isChallengeMode = false

    // 15 questions per level, show only 10 random
    this.questions = {
      1: [
        {
          q: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Hyper Transfer Markup Language",
            "Home Tool Markup Language",
          ],
          correct: 0,
        },
        {
          q: "Which language is used for styling web pages?",
          options: ["HTML", "JavaScript", "CSS", "Python"],
          correct: 2,
        },
        { q: "What is the latest version of HTML?", options: ["HTML4", "XHTML", "HTML5", "HTML2023"], correct: 2 },
        {
          q: "Which tag is used to create a hyperlink?",
          options: ["<link>", "<a>", "<href>", "<hyperlink>"],
          correct: 1,
        },
        {
          q: "What does CSS stand for?",
          options: [
            "Computer Style Sheets",
            "Creative Style System",
            "Cascading Style Sheets",
            "Colorful Style Sheets",
          ],
          correct: 2,
        },
        {
          q: "Which HTML tag is used for the largest heading?",
          options: ["<h6>", "<heading>", "<h1>", "<head>"],
          correct: 2,
        },
        {
          q: "What is the correct HTML element for inserting a line break?",
          options: ["<break>", "<lb>", "<br>", "<newline>"],
          correct: 2,
        },
        {
          q: "Which attribute is used to provide a unique identifier for an HTML element?",
          options: ["class", "id", "name", "key"],
          correct: 1,
        },
        {
          q: "What does the <title> tag define?",
          options: ["Page heading", "Browser tab title", "Header content", "Main content"],
          correct: 1,
        },
        {
          q: "Which tag is used to define an unordered list?",
          options: ["<ol>", "<li>", "<ul>", "<list>"],
          correct: 2,
        },
        {
          q: "What is the correct HTML for making a text bold?",
          options: ["<b>", "<bold>", "<strong>", "Both <b> and <strong>"],
          correct: 3,
        },
        {
          q: "Which HTML attribute specifies an alternate text for an image?",
          options: ["title", "alt", "src", "text"],
          correct: 1,
        },
        {
          q: "What is the correct HTML for creating a checkbox?",
          options: ['<input type="check">', '<input type="checkbox">', "<checkbox>", "<check>"],
          correct: 1,
        },
        { q: "Which tag is used to define a table row?", options: ["<td>", "<th>", "<tr>", "<table>"], correct: 2 },
        {
          q: "What is the purpose of the <meta> tag?",
          options: ["Create links", "Define metadata", "Style elements", "Add scripts"],
          correct: 1,
        },
      ],
      2: [
        { q: "Which symbol is used for comments in JavaScript?", options: ["//", "<!-- -->", "**", "%%"], correct: 0 },
        {
          q: "Which method adds an element to the end of an array?",
          options: ["push()", "pop()", "shift()", "unshift()"],
          correct: 1,
        },
        { q: "What is the result of 2 + '2' in JavaScript?", options: ["4", "22", "NaN", "Error"], correct: 1 },
        {
          q: "Which HTML5 element is used for drawing graphics?",
          options: ["<graphic>", "<canvas>", "<draw>", "<svg>"],
          correct: 1,
        },
        {
          q: "What does API stand for?",
          options: [
            "Application Programming Interface",
            "Advanced Programming Instruction",
            "Automated Program Integration",
            "Application Process Integration",
          ],
          correct: 0,
        },
        {
          q: "Which JavaScript keyword is used to declare a constant?",
          options: ["var", "let", "const", "constant"],
          correct: 2,
        },
        {
          q: "What is the correct way to declare a JavaScript function?",
          options: ["function myFunc()", "function:myFunc()", "def myFunc()", "func myFunc()"],
          correct: 0,
        },
        { q: "Which operator is used to assign a value to a variable?", options: ["*", "=", "==", "==="], correct: 1 },
        {
          q: "What will 'typeof null' return in JavaScript?",
          options: ["null", "undefined", "object", "number"],
          correct: 2,
        },
        {
          q: "Which method is used to remove the last element from an array?",
          options: ["pop()", "shift()", "remove()", "delete()"],
          correct: 0,
        },
        {
          q: "What is the correct syntax for a for loop?",
          options: ["for (i = 0; i <= 5)", "for (i = 0; i <= 5; i++)", "for i = 1 to 5", "for (i <= 5; i++)"],
          correct: 1,
        },
        {
          q: "Which event occurs when a user clicks on an HTML element?",
          options: ["onmouseclick", "onchange", "onclick", "onpress"],
          correct: 2,
        },
        {
          q: "How do you round the number 7.25 to the nearest integer?",
          options: ["Math.round(7.25)", "Math.rnd(7.25)", "round(7.25)", "Math.floor(7.25)"],
          correct: 0,
        },
        {
          q: "Which built-in method returns the length of a string?",
          options: ["length()", "size()", ".length", "getSize()"],
          correct: 2,
        },
        {
          q: "What is the correct way to write an array in JavaScript?",
          options: [
            'var colors = "red", "green", "blue"',
            "var colors = (1:red, 2:green, 3:blue)",
            'var colors = ["red", "green", "blue"]',
            'var colors = {"red", "green", "blue"}',
          ],
          correct: 2,
        },
      ],
      3: [
        {
          q: "What is the purpose of the 'use strict' directive in JavaScript?",
          options: ["Enable ES6 features", "Enforce stricter parsing", "Add strict typing", "Improve performance"],
          correct: 1,
        },
        {
          q: "Which CSS property controls the text size?",
          options: ["text-size", "font-style", "font-size", "text-style"],
          correct: 2,
        },
        {
          q: "What is a closure in JavaScript?",
          options: [
            "A loop structure",
            "A function with access to outer scope",
            "A type of object",
            "An error handler",
          ],
          correct: 1,
        },
        { q: "Which HTTP method is used to update data?", options: ["GET", "POST", "PUT", "DELETE"], correct: 2 },
        {
          q: "What does DOM stand for?",
          options: [
            "Document Object Model",
            "Data Object Management",
            "Digital Oriented Markup",
            "Document Orientation Method",
          ],
          correct: 0,
        },
        {
          q: "Which CSS selector has the highest specificity?",
          options: ["Element", "Class", "ID", "Universal"],
          correct: 2,
        },
        {
          q: "What is the purpose of async/await in JavaScript?",
          options: ["Handle errors", "Manage promises", "Create loops", "Define functions"],
          correct: 1,
        },
        {
          q: "Which HTML5 element is used for semantic main content?",
          options: ["<content>", "<main>", "<article>", "<section>"],
          correct: 1,
        },
        {
          q: "What is the box model in CSS?",
          options: ["A layout system", "Content, padding, border, margin", "A flexbox alternative", "A grid system"],
          correct: 1,
        },
        {
          q: "Which method is used to parse JSON in JavaScript?",
          options: ["JSON.parse()", "JSON.decode()", "parseJSON()", "decode()"],
          correct: 0,
        },
        {
          q: "What is the purpose of the 'this' keyword in JavaScript?",
          options: ["Define a constant", "Reference current object", "Create a variable", "Import a module"],
          correct: 1,
        },
        {
          q: "Which CSS property is used for animations?",
          options: ["animate", "animation", "transition", "transform"],
          correct: 1,
        },
        {
          q: "What is event bubbling?",
          options: [
            "Event propagation from child to parent",
            "Event handling method",
            "Animation technique",
            "Data flow pattern",
          ],
          correct: 0,
        },
        {
          q: "Which HTML attribute makes an element draggable?",
          options: ["drag", "draggable", "movable", "dragable"],
          correct: 1,
        },
        {
          q: "What is the purpose of webpack?",
          options: ["Test code", "Bundle modules", "Format code", "Debug applications"],
          correct: 1,
        },
      ],
      4: [
        {
          q: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
          correct: 1,
        },
        {
          q: "Which design pattern is used in Redux?",
          options: ["Observer", "Factory", "Flux", "Singleton"],
          correct: 2,
        },
        {
          q: "What is a Promise in JavaScript?",
          options: [
            "A callback function",
            "An object representing async operation",
            "A loop structure",
            "A variable type",
          ],
          correct: 1,
        },
        { q: "Which HTTP status code indicates 'Not Found'?", options: ["400", "401", "404", "500"], correct: 2 },
        {
          q: "What does CORS stand for?",
          options: [
            "Cross-Origin Resource Sharing",
            "Central Object Rendering System",
            "Core Origin Request Service",
            "Cross-Origin Routing System",
          ],
          correct: 0,
        },
        {
          q: "What is the virtual DOM?",
          options: ["A database", "A lightweight copy of the real DOM", "A framework", "A testing tool"],
          correct: 1,
        },
        {
          q: "Which method is used to merge arrays in JavaScript?",
          options: ["merge()", "concat()", "combine()", "join()"],
          correct: 1,
        },
        {
          q: "What is hoisting in JavaScript?",
          options: [
            "Variable declaration moved to top",
            "Function optimization",
            "Memory management",
            "Error handling",
          ],
          correct: 0,
        },
        {
          q: "Which tool is used for dependency management in Node.js?",
          options: ["pip", "npm", "gem", "cargo"],
          correct: 1,
        },
        {
          q: "What is useEffect in React?",
          options: ["State management", "Side effects handling", "Component creation", "Event handling"],
          correct: 1,
        },
        {
          q: "Which protocol is used for real-time communication?",
          options: ["HTTP", "FTP", "WebSocket", "SMTP"],
          correct: 2,
        },
        {
          q: "What is destructuring in JavaScript?",
          options: ["Error handling", "Unpacking values from arrays/objects", "Memory cleanup", "Code splitting"],
          correct: 1,
        },
        {
          q: "Which CSS framework uses utility classes?",
          options: ["Bootstrap", "Tailwind CSS", "Foundation", "Bulma"],
          correct: 1,
        },
        {
          q: "What is middleware in Express.js?",
          options: ["A database layer", "Functions that process requests", "A routing system", "A testing tool"],
          correct: 1,
        },
        {
          q: "Which method creates a new array with transformed elements?",
          options: ["forEach()", "map()", "filter()", "reduce()"],
          correct: 1,
        },
      ],
      5: [
        {
          q: "What is the difference between call() and apply()?",
          options: [
            "No difference",
            "call() takes individual args, apply() takes array",
            "call() is async, apply() is sync",
            "call() is deprecated",
          ],
          correct: 1,
        },
        {
          q: "What is memoization?",
          options: ["A memory leak", "Caching function results", "A design pattern", "A testing strategy"],
          correct: 1,
        },
        {
          q: "Which data structure uses LIFO?",
          options: ["Queue", "Stack", "Tree", "Graph"],
          correct: 1,
        },
        {
          q: "What is the purpose of useCallback in React?",
          options: ["Manage state", "Memoize functions", "Handle side effects", "Create refs"],
          correct: 1,
        },
        {
          q: "What does CI/CD stand for?",
          options: [
            "Code Integration/Code Deployment",
            "Continuous Integration/Continuous Deployment",
            "Central Integration/Central Deployment",
            "Computer Integration/Computer Delivery",
          ],
          correct: 1,
        },
        {
          q: "Which algorithm is used for shortest path?",
          options: ["Binary Search", "Dijkstra's", "Quick Sort", "Merge Sort"],
          correct: 1,
        },
        {
          q: "What is a closure's main benefit?",
          options: ["Faster execution", "Data encapsulation", "Better styling", "Simpler syntax"],
          correct: 1,
        },
        {
          q: "What is GraphQL?",
          options: ["A database", "A query language for APIs", "A CSS framework", "A testing library"],
          correct: 1,
        },
        {
          q: "Which HTTP method is idempotent?",
          options: ["POST", "GET", "PATCH", "All methods"],
          correct: 1,
        },
        {
          q: "What is the purpose of Docker?",
          options: ["Version control", "Containerization", "Code editing", "Database management"],
          correct: 1,
        },
        {
          q: "What is lazy loading?",
          options: ["Slow internet", "Loading resources on demand", "A design pattern", "A testing method"],
          correct: 1,
        },
        {
          q: "Which pattern separates concerns in MVC?",
          options: ["Model handles everything", "View-Controller-Model", "Model-View-Controller", "Controller only"],
          correct: 2,
        },
        {
          q: "What is OAuth used for?",
          options: ["Database queries", "Authorization", "Styling", "Testing"],
          correct: 1,
        },
        {
          q: "What is the purpose of Redis?",
          options: ["Web server", "In-memory data store", "Code editor", "Version control"],
          correct: 1,
        },
        {
          q: "What is tree shaking?",
          options: ["Animation technique", "Removing unused code", "Data structure operation", "Testing method"],
          correct: 1,
        },
      ],
    }

    this.init()
  }

  init() {
    console.log("Initializing QuizGameManager")

    // Setup navigation
    document.querySelectorAll(".quiz-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.showSection(btn.dataset.section)
      })
    })

    // Setup level buttons
    document.querySelectorAll(".start-level-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = Number.parseInt(btn.dataset.level)
        this.startLevel(level)
      })
    })

    // Setup game mode toggle
    this.setupGameModeToggle()

    // Setup control buttons
    document.getElementById("nextQuestionBtn")?.addEventListener("click", () => this.nextQuestion())
    document.getElementById("endGameBtn")?.addEventListener("click", () => this.endGame())
    document.getElementById("playAgainBtn")?.addEventListener("click", () => this.resetToSetup())
    document.getElementById("viewLeaderboardBtn")?.addEventListener("click", () => this.showSection("leaderboard"))
    document.getElementById("resetQuizBtn")?.addEventListener("click", () => this.resetAllProgress())

    // Load saved progress
    this.loadProfiles()
    this.loadProgress()
  }

  setupGameModeToggle() {
    const modeRadios = document.querySelectorAll('input[name="gameMode"]')
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.gameMode = e.target.value
        this.isChallengeMode = this.gameMode === 'challenge'
      })
    })
  }

  startTimer() {
    this.startTime = Date.now()
    this.elapsedTime = 0
    this.updateTimerDisplay()
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000)
      this.updateTimerDisplay()
    }, 1000)
  }

  startQuestionTimer() {
    if (!this.isChallengeMode) return

    this.questionStartTime = Date.now()
    this.updateQuestionTimerDisplay(this.questionTimeLimit)

    // Clear any existing timer
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval)
    }

    // Start new timer
    this.questionTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000)
      const remaining = Math.max(0, this.questionTimeLimit - elapsed)
      
      this.updateQuestionTimerDisplay(remaining)

      // Check if time's up
      if (remaining <= 0) {
        this.handleTimeUp()
        clearInterval(this.questionTimerInterval)
      }
    }, 1000)
  }

  stopQuestionTimer() {
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval)
      this.questionTimerInterval = null
    }
  }

  updateQuestionTimerDisplay(remainingTime) {
    let timerDisplay = document.getElementById('questionTimer')
    
    // Create timer display if it doesn't exist
    if (!timerDisplay && this.isChallengeMode) {
      const questionHeader = document.querySelector('.question-header')
      if (questionHeader) {
        timerDisplay = document.createElement('div')
        timerDisplay.id = 'questionTimer'
        timerDisplay.className = 'challenge-timer'
        timerDisplay.innerHTML = `⏱️ <span id="timerValue">${remainingTime}</span>s`
        questionHeader.appendChild(timerDisplay)
      }
    }

    // Update timer value
    if (timerDisplay) {
      const timerValue = document.getElementById('timerValue')
      if (timerValue) {
        timerValue.textContent = remainingTime
        
        // Add warning class when time is low
        if (remainingTime <= 10) {
          timerValue.classList.add('time-critical')
        } else {
          timerValue.classList.remove('time-critical')
        }
      }
    }
  }

  handleTimeUp() {
    if (!this.isChallengeMode) return

    // Disable all options
    document.querySelectorAll(".option-btn").forEach(btn => {
      if (!btn.disabled) {
        btn.disabled = true
        
        // Highlight correct answer
        const question = this.currentQuestions[this.currentQuestionIndex]
        const index = Number.parseInt(btn.dataset.index)
        if (index === question.correct) {
          btn.classList.add('correct')
        }
      }
    })

    // Show feedback
    const feedbackEl = document.getElementById("feedbackMessage")
    feedbackEl.textContent = "⏰ Time's up! Question skipped."
    feedbackEl.className = "feedback-message wrong"

    // Show next button
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      document.getElementById("nextQuestionBtn").style.display = "inline-block"
    } else {
      setTimeout(() => this.showResults(), 1500)
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.stopQuestionTimer()
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.elapsedTime / 60)
    const seconds = this.elapsedTime % 60
    const timerElement = document.getElementById("quizTimer")
    if (timerElement) {
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  showSection(sectionId) {
    // Update navigation
    document.querySelectorAll(".quiz-nav-btn").forEach((btn) => {
      btn.classList.remove("active")
      if (btn.dataset.section === sectionId) {
        btn.classList.add("active")
      }
    })

    // Update sections
    document.querySelectorAll(".quiz-section").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(sectionId)?.classList.add("active")

    // Load leaderboard if showing that section
    if (sectionId === "leaderboard") {
      this.displayLeaderboard()
    }
  }

  startLevel(level) {
    const playerNameInput = document.getElementById("playerName")
    this.playerName = playerNameInput?.value.trim() || "Player"

    if (!this.playerName || this.playerName === "Player") {
      alert("Please enter your name!")
      playerNameInput?.focus()
      return
    }

    // Get game mode
    const selectedMode = document.querySelector('input[name="gameMode"]:checked')
    this.gameMode = selectedMode?.value || 'normal'
    this.isChallengeMode = this.gameMode === 'challenge'

    // Create or load player profile
    this.loadOrCreateProfile(this.playerName)

    this.currentLevel = level
    this.currentQuestionIndex = 0
    this.score = 0
    this.correctAnswers = 0

    // Select 10 random questions from the 15 available
    const allQuestions = [...this.questions[level]]
    this.currentQuestions = this.shuffleArray(allQuestions).slice(0, 10)

    this.startTimer()

    // Update player display with mode indicator
    const playerDisplay = document.getElementById("currentPlayerName")
    playerDisplay.textContent = this.playerName
    if (this.isChallengeMode) {
      playerDisplay.innerHTML = `${this.playerName} <span class="challenge-indicator">Challenge Mode</span>`
    }

    this.showSection("gameArea")
    this.displayQuestion()
  }

  loadOrCreateProfile(playerName) {
    // Load profiles from storage
    this.profiles = this.storage.getLocal("quizProfiles") || {}
    
    // Check if profile exists
    if (!this.profiles[playerName]) {
      // Create new profile
      this.profiles[playerName] = {
        name: playerName,
        unlockedLevels: 1,
        levels: {},
        totalStars: 0,
        totalScore: 0,
        created: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        gameMode: this.gameMode
      }
      this.saveProfiles()
    }
    
    // Set as current profile
    this.currentProfile = this.profiles[playerName]
    
    // Update last played
    this.currentProfile.lastPlayed = new Date().toISOString()
    this.currentProfile.gameMode = this.gameMode
    this.saveProfiles()
  }

  saveProfiles() {
    this.storage.setLocal("quizProfiles", this.profiles)
  }

  loadProfiles() {
    this.profiles = this.storage.getLocal("quizProfiles") || {}
  }

  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  displayQuestion() {
    const question = this.currentQuestions[this.currentQuestionIndex]
    if (!question || !Array.isArray(question.options)) {
      console.error("Invalid question state", {
        index: this.currentQuestionIndex,
        total: this.currentQuestions.length
      })
      this.showResults()
      return
    }

    // Update header
    document.getElementById("currentLevelDisplay").textContent = this.currentLevel
    document.getElementById("currentScore").textContent = this.score
    document.getElementById("currentStars").textContent = this.totalStars

    // Update question
    document.getElementById("currentQuestionNum").textContent = this.currentQuestionIndex + 1
    document.getElementById("totalQuestions").textContent = this.currentQuestions.length
    document.getElementById("questionText").textContent = question.q

    // Update progress bar
    const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100
    document.getElementById("progressFill").style.width = `${progress}%`

    const validOptions = question.options.filter((opt) => opt && opt.toString().trim() !== "")

    if (validOptions.length === 0) {
      console.error("No valid options for question", question)
      this.showResults()
      return
    }

    // Display options
    const optionsContainer = document.getElementById("optionsContainer")
    optionsContainer.innerHTML = validOptions
      .map(
        (option, index) => `
        <button class="option-btn" data-index="${index}">
          ${this.escapeHtml(option)}
        </button>
      `,
      )
      .join("")

    // Add event listeners to options
    optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.selectAnswer(Number.parseInt(btn.dataset.index)))
    })

    // Remove challenge timer if exists
    const existingTimer = document.getElementById('questionTimer')
    if (existingTimer) {
      existingTimer.remove()
    }

    // Hide feedback and next button
    document.getElementById("feedbackMessage").textContent = ""
    document.getElementById("feedbackMessage").className = "feedback-message"
    document.getElementById("nextQuestionBtn").style.display = "none"

    // Start question timer for challenge mode
    if (this.isChallengeMode) {
      this.startQuestionTimer()
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  selectAnswer(selectedIndex) {
    // Stop question timer
    this.stopQuestionTimer()

    // Disable all buttons
    document.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true)

    const question = this.currentQuestions[this.currentQuestionIndex]
    const isCorrect = selectedIndex === question.correct

    // Highlight correct/wrong answers
    document.querySelectorAll(".option-btn").forEach((btn) => {
      const index = Number.parseInt(btn.dataset.index)
      if (index === question.correct) {
        btn.classList.add("correct")
      } else if (index === selectedIndex && !isCorrect) {
        btn.classList.add("wrong")
      }
    })

    // Calculate points
    let points = 10
    let timeBonus = 0
    
    // Add time bonus in challenge mode if answered quickly
    if (this.isChallengeMode) {
      const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000)
      if (isCorrect && elapsed < 10) {
        timeBonus = Math.floor((10 - elapsed) * 0.5) // Up to 5 bonus points
        points += timeBonus
      }
    }

    // Show feedback
    const feedbackEl = document.getElementById("feedbackMessage")
    if (isCorrect) {
      this.score += points
      this.correctAnswers++
      
      if (timeBonus > 0) {
        feedbackEl.textContent = `✓ Correct! +${points} points (10 + ${timeBonus} time bonus)`
      } else {
        feedbackEl.textContent = `✓ Correct! +${points} points`
      }
      feedbackEl.className = "feedback-message correct"
    } else {
      feedbackEl.textContent = "✗ Wrong answer. The correct answer is highlighted."
      feedbackEl.className = "feedback-message wrong"
    }

    // Update score display
    document.getElementById("currentScore").textContent = this.score

    // Show next button or go to results
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      document.getElementById("nextQuestionBtn").style.display = "inline-block"
    } else {
      setTimeout(() => this.showResults(), 1500)
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= this.currentQuestions.length - 1) return
    this.currentQuestionIndex++
    this.displayQuestion()
  }

  endGame() {
    if (confirm("Are you sure you want to end the game? Your progress will be saved.")) {
      this.showResults()
    }
  }

  showResults() {
    this.stopTimer()
    this.stopQuestionTimer()

    const percentage = (this.correctAnswers / this.currentQuestions.length) * 100
    let stars = 0
    if (percentage >= 95) stars = 3
    else if (percentage >= 70) stars = 2
    else if (percentage >= 60) stars = 1

    this.totalStars += stars

    // Save progress to profile
    this.saveProfileProgress(stars)

    // Display results
    document.getElementById("resultPlayerName").textContent = this.playerName
    document.getElementById("resultLevel").textContent = this.currentLevel
    document.getElementById("resultTime").textContent = this.formatTime(this.elapsedTime)
    document.getElementById("correctAnswers").textContent = `${this.correctAnswers}/${this.currentQuestions.length}`
    document.getElementById("levelScore").textContent = this.score
    document.getElementById("totalStarsDisplay").textContent = "⭐".repeat(stars) || "No stars"
    document.getElementById("finalScore").textContent = this.score

    // Show level pass message
    const passMessage = document.getElementById("levelPassMessage")
    if (stars >= 1) {
      passMessage.textContent = `🎉 Congratulations! You earned ${stars} star${stars > 1 ? "s" : ""} and unlocked the next level!`
      passMessage.style.color = "#10b981"
      passMessage.style.background = "#d1fae5"
      passMessage.style.padding = "1rem"
      passMessage.style.borderRadius = "10px"
    } else {
      passMessage.textContent = "You need at least 1 star (60% correct) to unlock the next level. Try again!"
      passMessage.style.color = "#ef4444"
      passMessage.style.background = "#fee2e2"
      passMessage.style.padding = "1rem"
      passMessage.style.borderRadius = "10px"
    }

    this.showSection("resultsArea")
  }

  saveProfileProgress(stars) {
    if (!this.currentProfile) return

    const profile = this.currentProfile
    const levelKey = `level${this.currentLevel}`

    // Initialize level data if not exists
    if (!profile.levels[levelKey]) {
      profile.levels[levelKey] = {
        bestScore: 0,
        stars: 0,
        attempts: 0,
        time: this.elapsedTime
      }
    }

    const levelData = profile.levels[levelKey]

    // Update if this is a better score
    if (this.score > levelData.bestScore) {
      levelData.bestScore = this.score
    }

    // Update if more stars
    if (stars > levelData.stars) {
      levelData.stars = stars
    }

    levelData.attempts++
    profile.lastPlayed = new Date().toISOString()

    // Update unlocked levels if earned at least 1 star
    if (stars > 0 && this.currentLevel < 5 && profile.unlockedLevels <= this.currentLevel) {
      profile.unlockedLevels = this.currentLevel + 1
    }

    // Update totals
    profile.totalStars = Object.values(profile.levels).reduce((sum, l) => sum + (l.stars || 0), 0)
    profile.totalScore = Object.values(profile.levels).reduce((sum, l) => sum + (l.bestScore || 0), 0)

    this.saveProfiles()
    this.loadProgress()
  }

  loadProgress() {
    // Update level cards based on current profile
    if (!this.currentProfile) return

    const profile = this.currentProfile

    // Update level cards
    for (let level = 1; level <= 5; level++) {
      const card = document.querySelector(`.level-card[data-level="${level}"]`)
      const btn = document.querySelector(`.start-level-btn[data-level="${level}"]`)
      const starsEl = document.getElementById(`stars-${level}`)
      const statusEl = card?.querySelector(".level-status")

      if (!card || !btn) continue

      const levelKey = `level${level}`
      const levelData = profile.levels?.[levelKey]

      if (level <= profile.unlockedLevels) {
        // Level unlocked
        card.classList.remove("locked")
        btn.disabled = false
        
        if (levelData?.stars) {
          const stars = levelData.stars || 0
          const starDisplay = "★".repeat(stars) + "☆".repeat(3 - stars)
          if (starsEl) starsEl.textContent = starDisplay
          if (statusEl) {
            statusEl.textContent = `Completed (${stars}★)`
            statusEl.classList.add("unlocked")
          }
        } else {
          if (statusEl) {
            statusEl.textContent = "Unlocked"
            statusEl.classList.add("unlocked")
          }
        }
      } else {
        // Level locked
        card.classList.add("locked")
        btn.disabled = true
        if (statusEl) {
          statusEl.textContent = `🔒 Complete Level ${level - 1}`
          statusEl.classList.remove("unlocked")
        }
      }
    }
  }

  displayLeaderboard() {
    const container = document.getElementById("leaderboardContent")

    if (Object.keys(this.profiles).length === 0) {
      container.innerHTML = '<div class="empty-state">No players yet. Be the first to play!</div>'
      return
    }

    // Sort profiles by total stars, then total score
    const sortedProfiles = Object.values(this.profiles).sort((a, b) => {
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars
      return b.totalScore - a.totalScore
    })

    const tableHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Total Stars</th>
            <th>Total Score</th>
            <th>Levels</th>
            <th>Last Played</th>
          </tr>
        </thead>
        <tbody>
          ${sortedProfiles
            .slice(0, 20) // Show top 20
            .map(
              (profile, index) => `
            <tr class="${index < 3 ? "top-player" : ""}">
              <td>${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
              <td>${profile.name}</td>
              <td>${"⭐".repeat(Math.min(profile.totalStars, 15))}</td>
              <td>${profile.totalScore}</td>
              <td>${profile.unlockedLevels}/5</td>
              <td>${new Date(profile.lastPlayed).toLocaleDateString()}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `

    container.innerHTML = tableHTML
  }

  resetToSetup() {
    this.stopTimer()
    this.stopQuestionTimer()
    this.showSection("playerSetup")
  }

  resetAllProgress() {
    if (confirm("Are you sure you want to reset ALL quiz progress and profiles? This cannot be undone.")) {
      this.storage.removeLocal("quizProgress")
      this.storage.removeLocal("quizProfiles")
      this.profiles = {}
      this.currentProfile = null
      this.loadProgress()
      this.displayLeaderboard()
      alert("All progress has been reset!")
    }
  }

}




// Hero Section Manager
class HeroManager {
  constructor(storage) {
    this.storage = storage
    this.editHeroBtn = document.getElementById("editHeroBtn")
    this.editHeroModal = document.getElementById("editHeroModal")
    this.editHeroForm = document.getElementById("editHeroForm")
    this.heroName = document.getElementById("heroName")
    this.heroDescription = document.getElementById("heroDescription")

    this.init()
  }

  init() {
    const savedHeroName = this.storage.getLocal("heroName")
    const savedHeroDesc = this.storage.getLocal("heroDescription")

    if (savedHeroName && this.heroName) {
      this.heroName.textContent = savedHeroName
    }
    if (savedHeroDesc && this.heroDescription) {
      this.heroDescription.textContent = savedHeroDesc
    }

    if (this.editHeroBtn && this.editHeroModal && this.editHeroForm) {
      this.editHeroBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("editHeroName")
        const descInput = document.getElementById("editHeroDesc")

        if (nameInput) nameInput.value = this.heroName?.textContent || ""
        if (descInput) descInput.value = this.heroDescription?.textContent || ""

        this.editHeroModal.style.display = "block"
      })

      this.editHeroForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const newName = document.getElementById("editHeroName")?.value || ""
        const newDesc = document.getElementById("editHeroDesc")?.value || ""

        if (this.heroName) this.heroName.textContent = newName
        if (this.heroDescription) this.heroDescription.textContent = newDesc

        this.storage.setLocal("heroName", newName)
        this.storage.setLocal("heroDescription", newDesc)

        this.editHeroModal.style.display = "none"
      })
    }
  }
}












// DateTime functions
function updateDateTime(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
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
    element.textContent = now.toLocaleDateString("en-US", options)
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

  const savedCvContent = storage.getLocal("cvContent")
  if (savedCvContent && cvContent) cvContent.innerHTML = savedCvContent

  const savedCvFileName = storage.getLocal("cvFileName")
  if (savedCvFileName && cvFileName && cvFileDisplay) {
    cvFileName.textContent = savedCvFileName
    cvFileDisplay.style.display = "block"
  }
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
  const youtubeManager = new window.YouTubeManager(storage)
  const journalManager = new JournalManager(storage, browserAPIs)
  const projectsManager = new ProjectsManager(storage, browserAPIs)
  const quizManager = new QuizGameManager(storage)
  const heroManager = new HeroManager(storage)

  window.youtubeManager = youtubeManager
  window.projectsManager = projectsManager

  if (browserAPIs && typeof journalManager.setValidationManager === "function") {
    journalManager.setValidationManager(browserAPIs)
  }

  startPageDateTime()
  setupModalSystem({ journalManager, projectsManager, quizManager })
  initializeOtherModals(storage)

  console.log(" Learning Journal loaded successfully")
})
