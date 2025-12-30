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

// Player Manager Class - into QuizGameManager
class PlayerManager {
  constructor(storage) {
    this.storage = storage;
    this.players = this.loadPlayers();
    this.currentPlayer = null;
  }

  loadPlayers() {
    try {
      const playersData = this.storage.getLocal("quizPlayers");
      if (!playersData) return {};
      
     
      if (typeof playersData === 'object' && playersData !== null) {
        return playersData;
      }
      
      
      if (typeof playersData === 'string') {

        // Remove any corrupted characters
        const cleaned = playersData.trim();
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          try {
            return JSON.parse(cleaned);
          } catch (parseError) {
            console.error("Error parsing quizPlayers JSON:", parseError);
            return {};
          }
        }
      }
      
      return {};
    } catch (error) {
      console.error("Error loading players:", error);
      return {};
    }
  }

  savePlayers() {
    this.storage.setLocal("quizPlayers", JSON.stringify(this.players));
  }

  playerExists(name) {
    return this.players.hasOwnProperty(name.toLowerCase());
  }

  getPlayer(name) {
    return this.players[name.toLowerCase()];
  }

  createPlayer(name, gameMode = 'normal') {
    const playerKey = name.toLowerCase();
    this.players[playerKey] = {
      name: name,
      level: 1, // Current highest unlocked level
      scores: {}, // Stores scores for each level
      gameMode: gameMode,
      totalStars: 0,
      totalScore: 0,
      lastPlayed: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.savePlayers();
    return this.players[playerKey];
  }

  updatePlayerProgress(name, level, score, stars, gameMode) {
    const player = this.getPlayer(name);
    if (!player) {
      console.error(`Player "${name}" not found`);
      return;
    }
    
    // Update game mode
    player.gameMode = gameMode;
    player.lastPlayed = new Date().toISOString();
    
    // Save score for this level
    const levelKey = `level${level}`;
    const currentBest = player.scores[levelKey];
    
    // Only update if this is a better score or if no score exists
    if (!currentBest || score > currentBest.score || stars > currentBest.stars) {
      player.scores[levelKey] = {
        score: score,
        stars: stars,
        gameMode: gameMode,
        date: new Date().toISOString()
      };
    }
    
    // Unlock next level if earned at least 1 star
    if (stars >= 1) {
      // Unlock the next level (level + 1)
      const nextLevel = level + 1;
      
      // Only update if next level is higher than current unlocked level
      if (nextLevel <= 5 && nextLevel > player.level) {
        player.level = nextLevel;
        console.log(`Player ${name} unlocked level ${nextLevel} (completed level ${level} with ${stars} stars)`);
      }
      
      // Also, if player completed a higher level than their current level, update it
      if (level > player.level) {
        player.level = level;
      }
    }
    
    // Update total stars and score
    this.calculateTotals(player);
    this.savePlayers();
    
    // Debug log
    console.log(`Updated player ${name}: Level ${level} completed, Stars: ${stars}, Can play up to: ${player.level}`);
  }

  calculateTotals(player) {
    let totalStars = 0;
    let totalScore = 0;
    
    Object.values(player.scores).forEach(levelData => {
      totalStars += levelData.stars || 0;
      totalScore += levelData.score || 0;
    });
    
    player.totalStars = totalStars;
    player.totalScore = totalScore;
  }

  getHighestUnlockedLevel(playerName) {
    const player = this.getPlayer(playerName);
    return player ? player.level : 1;
  }

  getLevelScore(playerName, level) {
    const player = this.getPlayer(playerName);
    if (player && player.scores[`level${level}`]) {
      return player.scores[`level${level}`];
    }
    return null;
  }

  resetAllPlayers() {
    this.players = {};
    this.savePlayers();
    this.currentPlayer = null;
  }
}

// Quiz Game Manager Class 
class QuizGameManager {
  constructor(storage) {
    this.storage = storage;
    this.playerName = "";
    this.currentLevel = 1;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.totalStars = 0;
    this.currentQuestions = [];
    this.correctAnswers = 0;
    this.timerInterval = null;
    this.questionTimerInterval = null;
    this.startTime = null;
    this.elapsedTime = 0;
    this.gameMode = "normal";
    this.questionTimeLimit = 10;
    this.questionStartTime = null;
    this.currentProfile = null;
    this.isChallengeMode = false;
    this.playerManager = new PlayerManager(storage);

    // Questions data
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
    };

    this.init();
  }

  init() {
    console.log("Initializing QuizGameManager with Player Management");

    
    this.cleanupCorruptedData();

    // Setup navigation
    document.querySelectorAll(".quiz-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.showSection(btn.dataset.section);
      });
    });

    // Setup level buttons
    document.querySelectorAll(".start-level-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = Number.parseInt(btn.dataset.level);
        this.startLevel(level);
      });
    });

    // Setup game mode toggle
    this.setupGameModeToggle();

    // Setup control buttons
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");
    const endGameBtn = document.getElementById("endGameBtn");
    const playAgainBtn = document.getElementById("playAgainBtn");
    const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
    const resetQuizBtn = document.getElementById("resetQuizBtn");

    if (nextQuestionBtn) nextQuestionBtn.addEventListener("click", () => this.nextQuestion());
    if (endGameBtn) endGameBtn.addEventListener("click", () => this.endGame());
    if (playAgainBtn) playAgainBtn.addEventListener("click", () => this.resetToSetup());
    if (viewLeaderboardBtn) viewLeaderboardBtn.addEventListener("click", () => this.showSection("leaderboard"));
    if (resetQuizBtn) resetQuizBtn.addEventListener("click", () => this.resetAllProgress());

    // Setup leaderboard toggle
    this.setupLeaderboardToggle();

    // Setup player detection
    this.setupPlayerDetection();

    // Setup resume button
    this.setupResumeButton();

    // Load progress for current player if exists
    this.checkForCurrentPlayer();
  }

 
  cleanupCorruptedData() {
    console.log("Checking for corrupted data...");
    
    try {
      // Check currentPlayer
      const currentPlayer = this.storage.getLocal('currentPlayer');
      if (currentPlayer && typeof currentPlayer === 'string' && currentPlayer.length < 2) {
        console.log("Removing corrupted currentPlayer data:", currentPlayer);
        this.storage.removeLocal('currentPlayer');
      }
      
      // Check quizPlayers
      const quizPlayers = this.storage.getLocal('quizPlayers');
      if (quizPlayers && typeof quizPlayers === 'string') {
        
        if (quizPlayers.length < 10 && !quizPlayers.includes('{') && !quizPlayers.includes('[')) {
          console.log("Removing corrupted quizPlayers data:", quizPlayers);
          this.storage.removeLocal('quizPlayers');
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  setupPlayerDetection() {
    const playerNameInput = document.getElementById('playerName');
    if (!playerNameInput) {
      console.warn("playerName input not found");
      return;
    }

    playerNameInput.addEventListener('input', () => {
      this.handlePlayerNameInput();
    });

    
    playerNameInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.handlePlayerNameInput();
      }, 100);
    });
  }

  setupResumeButton() {
    const resumeBtn = document.getElementById('resumeLastLevelBtn');
    if (!resumeBtn) {
      console.warn("resumeLastLevelBtn not found");
      return;
    }

    resumeBtn.addEventListener('click', () => {
      const playerName = document.getElementById('playerName')?.value.trim();
      if (!playerName || !this.playerManager.playerExists(playerName)) {
        alert('Please enter a valid player name');
        return;
      }

      const player = this.playerManager.getPlayer(playerName);
      const highestLevel = player.level;

      // Set game mode from player's preference
      const gameMode = player.gameMode || 'normal';
      const modeRadio = document.querySelector(`input[name="gameMode"][value="${gameMode}"]`);
      if (modeRadio) modeRadio.checked = true;

      // Start the game
      this.startGameFromLevel(playerName, highestLevel, gameMode);
    });
  }

  checkForCurrentPlayer() {
    try {
      const lastPlayer = this.storage.getLocal('currentPlayer');
      if (lastPlayer && typeof lastPlayer === 'string' && lastPlayer.trim().length >= 2) {
        const playerNameInput = document.getElementById('playerName');
        if (playerNameInput) {
          playerNameInput.value = lastPlayer;
          setTimeout(() => {
            this.handlePlayerNameInput();
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error checking for current player:", error);
    }
  }

  handlePlayerNameInput() {
    const playerNameInput = document.getElementById('playerName');
    if (!playerNameInput) return;
    
    const playerName = playerNameInput.value.trim();
    const playerStatus = document.getElementById('playerStatus');
    const resumeButtonContainer = document.getElementById('resumeButtonContainer');
    
    if (playerName.length < 2) {
      if (playerStatus) playerStatus.style.display = 'none';
      if (resumeButtonContainer) resumeButtonContainer.style.display = 'none';
      this.resetLevelCards();
      return;
    }
    
    if (this.playerManager.playerExists(playerName)) {
      // Returning player
      const player = this.playerManager.getPlayer(playerName);
      const highestLevel = player.level;
      
      if (playerStatus) {
        playerStatus.innerHTML = `
          <div class="returning-player">
            <strong>Welcome back, ${player.name}!</strong><br>
            You have unlocked up to <strong>Level ${highestLevel}</strong>
            ${player.totalStars > 0 ? `<br>Total Stars: ${player.totalStars} ⭐` : ''}
          </div>
        `;
        playerStatus.style.display = 'block';
      }
      
      // Show resume button
      if (resumeButtonContainer) {
        resumeButtonContainer.style.display = 'block';
        const resumeBtn = document.getElementById('resumeLastLevelBtn');
        if (resumeBtn) {
          resumeBtn.innerHTML = `
            <span class="resume-icon">↻</span>
            Resume from Level ${highestLevel}
          `;
        }
      }
      
      // Update level cards based on player's progress
      this.updateLevelCardsForPlayer(playerName);
      
      // Highlight the level they can resume from
      this.highlightResumeLevel(highestLevel);
    } else {
      // New player
      if (playerStatus) {
        playerStatus.innerHTML = `
          <div class="new-player">
            <strong>New Player Detected</strong><br>
            You will start from Level 1
          </div>
        `;
        playerStatus.style.display = 'block';
      }
      if (resumeButtonContainer) resumeButtonContainer.style.display = 'none';
      
      // Reset level cards to default (all locked except level 1)
      this.resetLevelCards();
    }
  }

  updateLevelCardsForPlayer(playerName) {
    const player = this.playerManager.getPlayer(playerName);
    if (!player) {
      console.log(`Player ${playerName} not found, resetting cards`);
      this.resetLevelCards();
      return;
    }

    const highestLevel = player.level;
    
    for (let level = 1; level <= 5; level++) {
      const levelCard = document.querySelector(`.level-card[data-level="${level}"]`);
      if (!levelCard) {
        console.warn(`Level card for level ${level} not found`);
        continue;
      }
      
      const levelStars = document.getElementById(`stars-${level}`);
      const levelStatus = levelCard.querySelector('.level-status');
      const startButton = levelCard.querySelector('.start-level-btn');
      
      if (!levelStatus || !startButton) {
        console.warn(`Level ${level} card missing status or button`);
        continue;
      }
      
      if (level <= highestLevel) {
        // Unlock this level
        levelCard.classList.remove('locked');
        startButton.disabled = false;
        startButton.textContent = `Play Level ${level}`;
        
        // Show stars if completed
        const levelScore = player.scores[`level${level}`];
        if (levelScore && levelScore.stars > 0) {
          const stars = levelScore.stars || 0;
          if (levelStars) {
            levelStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          }
          
          levelStatus.textContent = `Completed (${stars}★)`;
          levelStatus.className = 'level-status completed';
        } else {
          levelStatus.textContent = 'Unlocked';
          levelStatus.className = 'level-status unlocked';
          
          if (levelStars) {
            levelStars.textContent = '☆☆☆';
          }
        }
      } else {
        // Lock this level
        levelCard.classList.add('locked');
        startButton.disabled = true;
        startButton.textContent = 'Locked';
        levelStatus.textContent = `Complete Level ${level - 1}`;
        levelStatus.className = 'level-status';
        
        if (levelStars) {
          levelStars.textContent = '☆☆☆';
        }
      }
    }
    
    // Highlight the resume level
    this.highlightResumeLevel(highestLevel);
  }

  highlightResumeLevel(level) {
    // Remove highlight from all cards
    document.querySelectorAll('.level-card').forEach(card => {
      card.classList.remove('resume-level');
    });
    
    // Highlight the resume level
    const resumeCard = document.querySelector(`.level-card[data-level="${level}"]`);
    if (resumeCard) {
      resumeCard.classList.add('resume-level');
      
      // Update status text
      const statusEl = resumeCard.querySelector('.level-status');
      if (statusEl && statusEl.textContent.includes('Unlocked')) {
        statusEl.textContent = 'Resume Here';
        statusEl.className = 'level-status resume-here';
      }
    }
  }

  resetLevelCards() {
    for (let level = 1; level <= 5; level++) {
      const levelCard = document.querySelector(`.level-card[data-level="${level}"]`);
      if (!levelCard) {
        console.warn(`Level card for level ${level} not found in reset`);
        continue;
      }
      
      const levelStars = document.getElementById(`stars-${level}`);
      const levelStatus = levelCard.querySelector('.level-status');
      const startButton = levelCard.querySelector('.start-level-btn');
      
      if (!levelStatus || !startButton) {
        console.warn(`Level ${level} card missing elements in reset`);
        continue;
      }
      
      // Reset to default state
      if (level === 1) {
        levelCard.classList.remove('locked');
        startButton.disabled = false;
        startButton.textContent = 'Play Level 1';
        levelStatus.textContent = 'Unlocked';
        levelStatus.className = 'level-status unlocked';
      } else {
        levelCard.classList.add('locked');
        startButton.disabled = true;
        startButton.textContent = 'Locked';
        levelStatus.textContent = `Complete Level ${level - 1}`;
        levelStatus.className = 'level-status';
      }
      
      // Reset stars
      if (levelStars) {
        levelStars.textContent = '☆☆☆';
      }
    }
  }

  setupGameModeToggle() {
    const modeRadios = document.querySelectorAll('input[name="gameMode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.gameMode = e.target.value;
        this.isChallengeMode = this.gameMode === 'challenge';
        
        // Update player's preferred game mode
        const playerName = document.getElementById('playerName')?.value.trim();
        if (playerName && this.playerManager.playerExists(playerName)) {
          const player = this.playerManager.getPlayer(playerName);
          player.gameMode = this.gameMode;
          this.playerManager.savePlayers();
        }
      });
    });
  }

  setupLeaderboardToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-switch .toggle-btn');
    const leaderboardContents = document.querySelectorAll('#leaderboard .leaderboard-content');
    
    // Set default active state
    toggleBtns.forEach(btn => {
      if (btn.dataset.mode === 'normal') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    leaderboardContents.forEach(content => {
      if (content.id === 'normalLeaderboardContent') {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // Update toggle buttons
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding leaderboard
        leaderboardContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${mode}LeaderboardContent`) {
            content.classList.add('active');
          }
        });
        
        // Load data for the selected mode
        this.loadLeaderboardData(mode);
      });
    });
    
    // Load normal mode data by default
    setTimeout(() => this.loadLeaderboardData('normal'), 100);
  }

  loadLeaderboardData(mode) {
    // Get all players and calculate their scores for the selected mode
    const players = this.playerManager.players;
    const playerScores = [];
    
    Object.values(players).forEach(player => {
      let modeStars = 0;
      let modeScore = 0;
      let highestLevel = 0;
      
      // Calculate totals for this game mode
      Object.entries(player.scores).forEach(([levelKey, levelData]) => {
        if (levelData.gameMode === mode) {
          modeStars += levelData.stars || 0;
          modeScore += levelData.score || 0;
          const levelNum = Number.parseInt(levelKey.replace('level', ''));
          if (levelNum > highestLevel) highestLevel = levelNum;
        }
      });
      
      if (modeStars > 0 || modeScore > 0) {
        playerScores.push({
          playerName: player.name,
          stars: modeStars,
          score: modeScore,
          highestLevel: highestLevel
        });
      }
    });
    
    // Sort scores (by stars, then by score)
    const sortedScores = playerScores.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.score - a.score;
    });
    
    // Display leaderboard
    this.displayLeaderboardEntries(mode, sortedScores);
    
    // Update statistics
    this.updateLeaderboardStats(mode, sortedScores);
  }

  displayLeaderboardEntries(mode, scores) {
    const listElement = document.getElementById(`${mode}LeaderboardList`);
    const noEntriesElement = document.getElementById(`no${mode.charAt(0).toUpperCase() + mode.slice(1)}Entries`);
    
    if (!listElement) {
      console.error(`Leaderboard list element not found: ${mode}LeaderboardList`);
      return;
    }
    
    if (scores.length === 0) {
      listElement.innerHTML = '';
      if (noEntriesElement) noEntriesElement.style.display = 'block';
      return;
    }
    
    if (noEntriesElement) noEntriesElement.style.display = 'none';
    
    let html = '';
    scores.forEach((player, index) => {
      const currentPlayerName = document.getElementById('playerName')?.value.trim();
      const isCurrentPlayer = player.playerName === currentPlayerName;
      
      html += `
        <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}">
          <div class="leaderboard-rank">#${index + 1}</div>
          <div class="leaderboard-player">${player.playerName}</div>
          <div class="leaderboard-stars">
            ${'★'.repeat(Math.min(player.stars, 3))}${'☆'.repeat(Math.max(3 - player.stars, 0))}
          </div>
          <div class="leaderboard-score">${player.score}</div>
          <div class="leaderboard-levels">${player.highestLevel}</div>
        </div>
      `;
    });
    
    listElement.innerHTML = html;
  }

  updateLeaderboardStats(mode, scores) {
    const totalPlayers = scores.length;
    const totalGames = scores.reduce((sum, player) => sum + 1, 0);
    const avgScore = totalPlayers > 0 
      ? Math.round(scores.reduce((sum, player) => sum + player.score, 0) / totalPlayers)
      : 0;
    
    const totalPlayersEl = document.getElementById('totalPlayers');
    const gamesPlayedEl = document.getElementById('gamesPlayed');
    const avgScoreEl = document.getElementById('avgScore');
    
    if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
    if (gamesPlayedEl) gamesPlayedEl.textContent = totalGames;
    if (avgScoreEl) avgScoreEl.textContent = avgScore;
  }

  displayLeaderboard() {
    this.loadLeaderboardData('normal');
  }

  startLevel(level) {
    const playerNameInput = document.getElementById("playerName");
    if (!playerNameInput) {
      alert("Player name input not found!");
      return;
    }
    
    this.playerName = playerNameInput.value.trim() || "Player";

    if (!this.playerName || this.playerName === "Player") {
      alert("Please enter your name!");
      playerNameInput.focus();
      return;
    }

    // Get game mode
    const selectedMode = document.querySelector('input[name="gameMode"]:checked');
    this.gameMode = selectedMode?.value || 'normal';
    this.isChallengeMode = this.gameMode === 'challenge';

    // Check if player exists or create new
    if (!this.playerManager.playerExists(this.playerName)) {
      this.playerManager.createPlayer(this.playerName, this.gameMode);
    }

    // Set current player
    this.playerManager.currentPlayer = this.playerManager.getPlayer(this.playerName);

    // Save current player
    this.storage.setLocal('currentPlayer', this.playerName);

    this.currentLevel = level;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;

    // Select 10 random questions from the 15 available
    const allQuestions = [...this.questions[level]];
    this.currentQuestions = this.shuffleArray(allQuestions).slice(0, 10);

    this.startTimer();

    // Update player display with mode indicator
    const playerDisplay = document.getElementById("currentPlayerName");
    if (playerDisplay) {
      playerDisplay.textContent = this.playerName;
      if (this.isChallengeMode) {
        playerDisplay.innerHTML = `${this.playerName} <span class="challenge-indicator">Challenge Mode</span>`;
      }
    }

    this.showSection("gameArea");
    this.displayQuestion();
  }

  startGameFromLevel(playerName, level, gameMode = 'normal') {
    // Set player name
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
      playerNameInput.value = playerName;
    }
    this.playerName = playerName;

    // Set game mode
    this.gameMode = gameMode;
    this.isChallengeMode = this.gameMode === 'challenge';
    const modeRadio = document.querySelector(`input[name="gameMode"][value="${gameMode}"]`);
    if (modeRadio) modeRadio.checked = true;

    // Check if player exists or create new
    if (!this.playerManager.playerExists(this.playerName)) {
      this.playerManager.createPlayer(this.playerName, this.gameMode);
    }

    // Set current player
    this.playerManager.currentPlayer = this.playerManager.getPlayer(this.playerName);

    // Save current player
    this.storage.setLocal('currentPlayer', this.playerName);

    this.currentLevel = level;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;

    // Select 10 random questions from the 15 available
    const allQuestions = [...this.questions[level]];
    this.currentQuestions = this.shuffleArray(allQuestions).slice(0, 10);

    this.startTimer();

    // Update player display
    const playerDisplay = document.getElementById("currentPlayerName");
    if (playerDisplay) {
      playerDisplay.textContent = this.playerName;
      if (this.isChallengeMode) {
        playerDisplay.innerHTML = `${this.playerName} <span class="challenge-indicator">Challenge Mode</span>`;
      }
    }

    this.showSection("gameArea");
    this.displayQuestion();
  }

  startTimer() {
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateTimerDisplay();
    }, 1000);
  }

  startQuestionTimer() {
    if (!this.isChallengeMode) return;

    this.questionStartTime = Date.now();
    this.updateQuestionTimerDisplay(this.questionTimeLimit);

    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }

    this.questionTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
      const remaining = Math.max(0, this.questionTimeLimit - elapsed);
      
      this.updateQuestionTimerDisplay(remaining);

      if (remaining <= 0) {
        this.handleTimeUp();
        clearInterval(this.questionTimerInterval);
      }
    }, 1000);
  }

  stopQuestionTimer() {
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
      this.questionTimerInterval = null;
    }
  }

  updateQuestionTimerDisplay(remainingTime) {
    let timerDisplay = document.getElementById('questionTimer');
    
    if (!timerDisplay && this.isChallengeMode) {
      const questionHeader = document.querySelector('.question-header');
      if (questionHeader) {
        timerDisplay = document.createElement('div');
        timerDisplay.id = 'questionTimer';
        timerDisplay.className = 'challenge-timer';
        timerDisplay.innerHTML = `⏱️ <span id="timerValue">${remainingTime}</span>s`;
        questionHeader.appendChild(timerDisplay);
      }
    }

    if (timerDisplay) {
      const timerValue = document.getElementById('timerValue');
      if (timerValue) {
        timerValue.textContent = remainingTime;
        
        if (remainingTime <= 10) {
          timerValue.classList.add('time-critical');
        } else {
          timerValue.classList.remove('time-critical');
        }
      }
    }
  }

  handleTimeUp() {
    if (!this.isChallengeMode) return;

    document.querySelectorAll(".option-btn").forEach(btn => {
      if (!btn.disabled) {
        btn.disabled = true;
        
        const question = this.currentQuestions[this.currentQuestionIndex];
        const index = Number.parseInt(btn.dataset.index);
        if (index === question.correct) {
          btn.classList.add('correct');
        }
      }
    });

    const feedbackEl = document.getElementById("feedbackMessage");
    if (feedbackEl) {
      feedbackEl.textContent = "Time's up! Question skipped.";
      feedbackEl.className = "feedback-message wrong";
    }

    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      const nextQuestionBtn = document.getElementById("nextQuestionBtn");
      if (nextQuestionBtn) nextQuestionBtn.style.display = "inline-block";
    } else {
      setTimeout(() => this.showResults(), 1500);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.stopQuestionTimer();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = this.elapsedTime % 60;
    const timerElement = document.getElementById("quizTimer");
    if (timerElement) {
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  showSection(sectionId) {
    document.querySelectorAll(".quiz-nav-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.section === sectionId) {
        btn.classList.add("active");
      }
    });

    document.querySelectorAll(".quiz-section").forEach((section) => {
      section.classList.remove("active");
    });
    
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.classList.add("active");
    }

    if (sectionId === "leaderboard") {
      this.displayLeaderboard();
    }
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  displayQuestion() {
    const question = this.currentQuestions[this.currentQuestionIndex];
    if (!question || !Array.isArray(question.options)) {
      console.error("Invalid question state", {
        index: this.currentQuestionIndex,
        total: this.currentQuestions.length
      });
      this.showResults();
      return;
    }

    // Update header
    const currentLevelDisplay = document.getElementById("currentLevelDisplay");
    const currentScore = document.getElementById("currentScore");
    const currentStars = document.getElementById("currentStars");
    
    if (currentLevelDisplay) currentLevelDisplay.textContent = this.currentLevel;
    if (currentScore) currentScore.textContent = this.score;
    if (currentStars) currentStars.textContent = this.totalStars;

    // Update question
    const currentQuestionNum = document.getElementById("currentQuestionNum");
    const totalQuestions = document.getElementById("totalQuestions");
    const questionText = document.getElementById("questionText");
    
    if (currentQuestionNum) currentQuestionNum.textContent = this.currentQuestionIndex + 1;
    if (totalQuestions) totalQuestions.textContent = this.currentQuestions.length;
    if (questionText) questionText.textContent = question.q;

    // Update progress bar
    const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
    const progressFill = document.getElementById("progressFill");
    if (progressFill) progressFill.style.width = `${progress}%`;

    const validOptions = question.options.filter((opt) => opt && opt.toString().trim() !== "");

    if (validOptions.length === 0) {
      console.error("No valid options for question", question);
      this.showResults();
      return;
    }

    // Display options
    const optionsContainer = document.getElementById("optionsContainer");
    if (optionsContainer) {
      optionsContainer.innerHTML = validOptions
        .map(
          (option, index) => `
          <button class="option-btn" data-index="${index}">
            ${this.escapeHtml(option)}
          </button>
        `
        )
        .join("");

      // Add event listeners to options
      optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.selectAnswer(Number.parseInt(btn.dataset.index)));
      });
    }

    // Remove challenge timer if exists
    const existingTimer = document.getElementById('questionTimer');
    if (existingTimer) {
      existingTimer.remove();
    }

    // Hide feedback and next button
    const feedbackMessage = document.getElementById("feedbackMessage");
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");
    
    if (feedbackMessage) {
      feedbackMessage.textContent = "";
      feedbackMessage.className = "feedback-message";
    }
    if (nextQuestionBtn) nextQuestionBtn.style.display = "none";

    // Start question timer for challenge mode
    if (this.isChallengeMode) {
      this.startQuestionTimer();
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  selectAnswer(selectedIndex) {
    // Stop question timer
    this.stopQuestionTimer();

    // Disable all buttons
    document.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);

    const question = this.currentQuestions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    // Highlight correct/wrong answers
    document.querySelectorAll(".option-btn").forEach((btn) => {
      const index = Number.parseInt(btn.dataset.index);
      if (index === question.correct) {
        btn.classList.add("correct");
      } else if (index === selectedIndex && !isCorrect) {
        btn.classList.add("wrong");
      }
    });

    // Calculate points
    let points = 10;
    let timeBonus = 0;
    
    // Add time bonus in challenge mode if answered quickly
    if (this.isChallengeMode) {
      const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
      if (isCorrect && elapsed < 10) {
        timeBonus = Math.floor((10 - elapsed) * 0.5); // Up to 5 bonus points
        points += timeBonus;
      }
    }

    // Show feedback
    const feedbackEl = document.getElementById("feedbackMessage");
    if (isCorrect) {
      this.score += points;
      this.correctAnswers++;
      
      if (feedbackEl) {
        if (timeBonus > 0) {
          feedbackEl.textContent = `Correct! +${points} points (10 + ${timeBonus} time bonus)`;
        } else {
          feedbackEl.textContent = `Correct! +${points} points`;
        }
        feedbackEl.className = "feedback-message correct";
      }
    } else {
      if (feedbackEl) {
        feedbackEl.textContent = " Wrong answer. The correct answer is highlighted.";
        feedbackEl.className = "feedback-message wrong";
      }
    }

    // Update score display
    const currentScore = document.getElementById("currentScore");
    if (currentScore) currentScore.textContent = this.score;

    // Show next button or go to results
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      if (nextQuestionBtn) nextQuestionBtn.style.display = "inline-block";
    } else {
      setTimeout(() => this.showResults(), 1500);
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= this.currentQuestions.length - 1) return;
    this.currentQuestionIndex++;
    this.displayQuestion();
  }

  endGame() {
    if (confirm("Are you sure you want to end the game? Your progress will be saved.")) {
      this.showResults();
    }
  }

  showResults() {
    this.stopTimer();
    this.stopQuestionTimer();

    const percentage = (this.correctAnswers / this.currentQuestions.length) * 100;
    let stars = 0;
    if (percentage >= 95) stars = 3;
    else if (percentage >= 70) stars = 2;
    else if (percentage >= 60) stars = 1;

    this.totalStars += stars;

    // Save progress to player manager
    if (this.playerManager.currentPlayer) {
      const playerName = this.playerManager.currentPlayer.name;
      console.log(`Saving progress for ${playerName}: Level ${this.currentLevel}, Stars: ${stars}`);
      
      try {
        this.playerManager.updatePlayerProgress(playerName, this.currentLevel, this.score, stars, this.gameMode);
        
        // Refresh the UI immediately
        this.updateLevelCardsForPlayer(playerName);
        
        // Debug: Check what level was unlocked
        const updatedPlayer = this.playerManager.getPlayer(playerName);
        console.log(`Player ${playerName} now unlocked up to level: ${updatedPlayer.level}`);
      } catch (error) {
        console.error("Error saving player progress:", error);
      }
    }

    // Also save to separate leaderboard storage
    this.saveScoreToLeaderboard(stars);

    // Display results
    const resultPlayerName = document.getElementById("resultPlayerName");
    const resultLevel = document.getElementById("resultLevel");
    const resultTime = document.getElementById("resultTime");
    const correctAnswers = document.getElementById("correctAnswers");
    const levelScore = document.getElementById("levelScore");
    const totalStarsDisplay = document.getElementById("totalStarsDisplay");
    const finalScore = document.getElementById("finalScore");
    
    if (resultPlayerName) resultPlayerName.textContent = this.playerName;
    if (resultLevel) resultLevel.textContent = this.currentLevel;
    if (resultTime) resultTime.textContent = this.formatTime(this.elapsedTime);
    if (correctAnswers) correctAnswers.textContent = `${this.correctAnswers}/${this.currentQuestions.length}`;
    if (levelScore) levelScore.textContent = this.score;
    if (totalStarsDisplay) totalStarsDisplay.textContent = "⭐".repeat(stars) || "No stars";
    if (finalScore) finalScore.textContent = this.score;

    // Show level pass message
    const passMessage = document.getElementById("levelPassMessage");
    if (passMessage) {
      if (stars >= 1) {
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= 5) {
          passMessage.innerHTML = `
             Congratulations! You earned ${stars} star${stars > 1 ? "s" : ""}!<br>
            <strong>Level ${nextLevel} is now unlocked!</strong>
          `;
        } else {
          passMessage.innerHTML = `
             Congratulations! You earned ${stars} star${stars > 1 ? "s" : ""}!<br>
            <strong>You've completed all levels!</strong>
          `;
        }
        passMessage.style.color = "#10b981";
        passMessage.style.background = "#d1fae5";
        passMessage.style.padding = "1rem";
        passMessage.style.borderRadius = "10px";
        passMessage.style.margin = "1rem 0";
      } else {
        passMessage.innerHTML = `
          You need at least 1 star (60% correct) to unlock the next level.<br>
          Try again to improve your score!
        `;
        passMessage.style.color = "#ef4444";
        passMessage.style.background = "#fee2e2";
        passMessage.style.padding = "1rem";
        passMessage.style.borderRadius = "10px";
        passMessage.style.margin = "1rem 0";
      }
    }

    this.showSection("resultsArea");
    
    // Force refresh the leaderboard after completing a level
    this.loadLeaderboardData(this.gameMode);
  }

  saveScoreToLeaderboard(stars) {
    const savedScores = this.storage.getLocal('quizScores') || [];
    
    // Only save if this is a better score for this level and mode
    const existingScore = savedScores.find(s => 
      s.playerName === this.playerName && 
      s.mode === this.gameMode && 
      s.level === this.currentLevel
    );
    
    if (!existingScore || this.score > existingScore.score || stars > existingScore.stars) {
      // Remove previous score for this level if exists
      const filteredScores = savedScores.filter(s => 
        !(s.playerName === this.playerName && s.mode === this.gameMode && s.level === this.currentLevel)
      );
      
      // Add new score
      filteredScores.push({
        playerName: this.playerName,
        mode: this.gameMode,
        level: this.currentLevel,
        score: this.score,
        stars: stars,
        timeTaken: this.elapsedTime,
        date: new Date().toISOString()
      });
      
      this.storage.setLocal('quizScores', filteredScores);
    }
  }

  resetToSetup() {
    this.stopTimer();
    this.stopQuestionTimer();
    this.showSection("playerSetup");
    
    // IMPORTANT: Refresh the level cards when returning to setup
    if (this.playerName) {
      this.updateLevelCardsForPlayer(this.playerName);
    }
  }

  resetAllProgress() {
    if (confirm("Are you sure you want to reset ALL quiz progress, players, and leaderboard? This cannot be undone.")) {
      this.storage.removeLocal("quizProgress");
      this.storage.removeLocal("quizProfiles");
      this.storage.removeLocal("quizScores");
      this.storage.removeLocal("quizPlayers");
      this.storage.removeLocal("currentPlayer");
      
      this.playerManager.resetAllPlayers();
      this.currentProfile = null;
      this.playerName = "";
      this.currentLevel = 1;
      this.score = 0;
      this.totalStars = 0;
      
      // Clear player name input
      const playerNameInput = document.getElementById('playerName');
      if (playerNameInput) playerNameInput.value = '';
      
      // Reset UI
      this.resetLevelCards();
      
      // Hide player status and resume button
      const playerStatus = document.getElementById('playerStatus');
      const resumeButtonContainer = document.getElementById('resumeButtonContainer');
      if (playerStatus) playerStatus.style.display = 'none';
      if (resumeButtonContainer) resumeButtonContainer.style.display = 'none';
      
      // Refresh leaderboard display
      this.loadLeaderboardData('normal');
      
      alert("All progress has been reset!");
    }
  }
}

// Hero Section Manager
class HeroManager {
  constructor(storage) {
    this.storage = storage;
    this.editHeroBtn = document.getElementById("editHeroBtn");
    this.editHeroModal = document.getElementById("editHeroModal");
    this.editHeroForm = document.getElementById("editHeroForm");
    this.heroName = document.getElementById("heroName");
    this.heroDescription = document.getElementById("heroDescription");

    this.init();
  }

  init() {
    const savedHeroName = this.storage.getLocal("heroName");
    const savedHeroDesc = this.storage.getLocal("heroDescription");

    if (savedHeroName && this.heroName) {
      this.heroName.textContent = savedHeroName;
    }
    if (savedHeroDesc && this.heroDescription) {
      this.heroDescription.textContent = savedHeroDesc;
    }

    if (this.editHeroBtn && this.editHeroModal && this.editHeroForm) {
      this.editHeroBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("editHeroName");
        const descInput = document.getElementById("editHeroDesc");

        if (nameInput) nameInput.value = this.heroName?.textContent || "";
        if (descInput) descInput.value = this.heroDescription?.textContent || "";

        this.editHeroModal.style.display = "block";
      });

      this.editHeroForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newName = document.getElementById("editHeroName")?.value || "";
        const newDesc = document.getElementById("editHeroDesc")?.value || "";

        if (this.heroName) this.heroName.textContent = newName;
        if (this.heroDescription) this.heroDescription.textContent = newDesc;

        this.storage.setLocal("heroName", newName);
        this.storage.setLocal("heroDescription", newDesc);

        this.editHeroModal.style.display = "none";
      });
    }
  }
}

// DateTime functions
function updateDateTime(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    element.textContent = now.toLocaleDateString("en-US", options);
  }
}

function startPageDateTime() {
  updateDateTime("pageDateTime");
  setInterval(() => updateDateTime("pageDateTime"), 1000);
}

// Modal system setup
function setupModalSystem(managers = {}) {
  const modals = document.querySelectorAll(".modal");

  // Close buttons inside modals
  document.querySelectorAll(".close-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });

  // Click outside to close
  window.addEventListener("click", (event) => {
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Generic openers: data-open="modalId"
  document.querySelectorAll("[data-open]").forEach((el) => {
    const modalId = el.getAttribute("data-open");
    const modal = document.getElementById(modalId);
    if (!modal) return;

    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        modalId === "journalModal" &&
        managers.journalManager &&
        typeof managers.journalManager.openModal === "function"
      ) {
        managers.journalManager.openModal();
      } else if (
        modalId === "projectsModal" &&
        managers.projectsManager &&
        typeof managers.projectsManager.openModal === "function"
      ) {
        managers.projectsManager.openModal();
      } else if (
        modalId === "quizModal" &&
        managers.quizManager &&
        typeof managers.quizManager.openModal === "function"
      ) {
        managers.quizManager.openModal();
      } else {
        modal.style.display = "block";
        const dtId = modalId.replace("Modal", "Datetime");
        updateDateTime(dtId);
      }
    });
  });
}

// Initialize other modals (About, CV, Hero, Profile Picture)
function initializeOtherModals(storage) {
  const editProfilePicBtn = document.getElementById("editProfilePicBtn");
  const profilePicInput = document.getElementById("profilePicInput");
  const profileImage = document.getElementById("profileImage");

  if (editProfilePicBtn && profilePicInput && profileImage) {
    editProfilePicBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      profilePicInput.click();
    });

    profilePicInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          profileImage.src = event.target.result;
          storage.setLocal("profilePicture", event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select a valid image file");
      }
    });

    const savedProfilePic = storage.getLocal("profilePicture");
    if (savedProfilePic) {
      profileImage.src = savedProfilePic;
    }
  }

  const editAboutBtn = document.getElementById("editAboutBtn");
  const uploadAboutBtn = document.getElementById("uploadAboutBtn");
  const aboutFileInput = document.getElementById("aboutFileInput");
  const editAboutModal = document.getElementById("editAboutModal");
  const editAboutForm = document.getElementById("editAboutForm");
  const aboutContent = document.getElementById("aboutContent");

  if (editAboutBtn && editAboutModal && editAboutForm) {
    editAboutBtn.addEventListener("click", () => {
      const currentText = aboutContent?.textContent || "";
      const textInput = document.getElementById("editAboutText");
      if (textInput) textInput.value = currentText;
      editAboutModal.style.display = "block";
    });

    editAboutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newText = document.getElementById("editAboutText")?.value || "";
      if (aboutContent) aboutContent.textContent = newText;
      storage.setLocal("aboutContent", newText);
      editAboutModal.style.display = "none";
    });
  }

  if (uploadAboutBtn && aboutFileInput) {
    uploadAboutBtn.addEventListener("click", () => {
      aboutFileInput.click();
    });

    aboutFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          if (aboutContent) aboutContent.textContent = content;
          storage.setLocal("aboutContent", content);
          alert(`File "${file.name}" uploaded successfully!`);
        };
        reader.readAsText(file);
      }
    });
  }

  const savedAbout = storage.getLocal("aboutContent");
  if (savedAbout && aboutContent) aboutContent.textContent = savedAbout;

  const editCvBtn = document.getElementById("editCvBtn");
  const editCvModal = document.getElementById("editCvModal");
  const editCvForm = document.getElementById("editCvForm");
  const cvContent = document.getElementById("cvContent");
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  const cvFileInput = document.getElementById("cvFileInput");
  const cvFileDisplay = document.getElementById("cvFileDisplay");
  const cvFileName = document.getElementById("cvFileName");
  const viewCvBtn = document.getElementById("viewCvBtn");

  if (editCvBtn && editCvModal && editCvForm) {
    editCvBtn.addEventListener("click", () => {
      const currentText = cvContent?.innerHTML || "";
      const textInput = document.getElementById("editCvText");
      if (textInput) textInput.value = currentText;
      editCvModal.style.display = "block";
    });

    editCvForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newText = document.getElementById("editCvText")?.value || "";
      if (cvContent) cvContent.innerHTML = newText;
      storage.setLocal("cvContent", newText);
      editCvModal.style.display = "none";
      alert("CV content updated successfully!");
    });
  }

  if (uploadCvBtn && cvFileInput) {
    uploadCvBtn.addEventListener("click", () => {
      cvFileInput.click();
    });

    cvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (cvFileName) cvFileName.textContent = file.name;
        if (cvFileDisplay) cvFileDisplay.style.display = "block";
        storage.setLocal("cvFileName", file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
          storage.setLocal("cvFileData", event.target.result);
          alert(`CV file "${file.name}" uploaded successfully!`);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (viewCvBtn) {
    viewCvBtn.addEventListener("click", () => {
      const fileData = storage.getLocal("cvFileData");
      const fileName = storage.getLocal("cvFileName");
      if (fileData && fileName) {
        const link = document.createElement("a");
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("No CV file uploaded yet.");
      }
    });
  }

  const savedCvContent = storage.getLocal("cvContent");
  if (savedCvContent && cvContent) cvContent.innerHTML = savedCvContent;

  const savedCvFileName = storage.getLocal("cvFileName");
  if (savedCvFileName && cvFileName && cvFileDisplay) {
    cvFileName.textContent = savedCvFileName;
    cvFileDisplay.style.display = "block";
  }
}

// DOMContentLoaded: Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  // Check for required classes
  if (typeof StorageManager === "undefined") {
    console.error("StorageManager not found. Make sure storage.js is loaded before script.js");
    return;
  }
  if (typeof window.BrowserAPIsManager === "undefined") {
    console.error("BrowserAPIsManager not found. Make sure browser.js is loaded before script.js");
    return;
  }

  const storage = new StorageManager();
  const browserAPIs = new window.BrowserAPIsManager(storage);
  const youtubeManager = new window.YouTubeManager(storage);
  const journalManager = new JournalManager(storage, browserAPIs);
  const projectsManager = new ProjectsManager(storage, browserAPIs);
  const quizManager = new QuizGameManager(storage);
  const heroManager = new HeroManager(storage);

  window.youtubeManager = youtubeManager;
  window.projectsManager = projectsManager;

  if (browserAPIs && typeof journalManager.setValidationManager === "function") {
    journalManager.setValidationManager(browserAPIs);
  }

  startPageDateTime();
  setupModalSystem({ journalManager, projectsManager, quizManager });
  initializeOtherModals(storage);

  console.log("Learning Journal loaded successfully");
});