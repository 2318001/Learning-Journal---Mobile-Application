
class JournalManager {
  constructor(storage, browserAPIs) {
    this.storage = storage;
    this.browserAPIs = browserAPIs;

    // DOM
    this.journalBtn = document.getElementById("journalBtn");
    this.journalModal = document.getElementById("journalModal");
    this.journalForm = document.getElementById("journalForm");
    this.journalSettingsBtn = document.getElementById("journalSettingsBtn");
    this.resetJournalBtn = document.getElementById("resetJournalBtn");
    this.journalEntries = document.getElementById("journalEntries");
    this.journalEmptyState = document.getElementById("journalEmptyState");

    // Optional offline banner
    this.offlineBanner = document.getElementById("offlineBanner");

    // Validation
    this.validationManager = null;

    // Filters
    this.currentFilters = {
      keyword: "",
      date: "",
      length: "all",
    };

    this.init();
  }

  setValidationManager(manager) {
    this.validationManager = manager;
  }

  async init() {
    // Open modal
    if (this.journalBtn) {
      this.journalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.openModal();
      });
    }

    // Toggle form
    if (this.journalSettingsBtn) {
      this.journalSettingsBtn.addEventListener("click", () => this.toggleForm());
    }

    // Submit form
    if (this.journalForm) {
      this.journalForm.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    // Reset journals
    if (this.resetJournalBtn) {
      this.resetJournalBtn.addEventListener("click", () => this.resetJournals());
    }

    // Filters + offline banner
    this.setupFilters();
    this.setupConnectivityUX();

    // Load existing entries
    await this.loadJournals();
  }

  setupConnectivityUX() {
    const updateBanner = () => {
      if (!this.offlineBanner) return;
      this.offlineBanner.style.display = navigator.onLine ? "none" : "block";
    };

    window.addEventListener("online", updateBanner);
    window.addEventListener("offline", updateBanner);
    updateBanner();
  }

  setupFilters() {
    const keywordInput = document.getElementById("journalKeywordFilter");
    const dateInput = document.getElementById("journalDateFilter");
    const lengthSelect = document.getElementById("journalLengthFilter");

    if (keywordInput) {
      keywordInput.addEventListener("input", (e) => {
        this.currentFilters.keyword = e.target.value || "";
        this.loadJournals();
      });
    }

    if (dateInput) {
      dateInput.addEventListener("change", (e) => {
        this.currentFilters.date = e.target.value || "";
        this.loadJournals();
      });
    }

    if (lengthSelect) {
      lengthSelect.addEventListener("change", (e) => {
        this.currentFilters.length = e.target.value || "all";
        this.loadJournals();
      });
    }
  }

  filterJournals(journals) {
    let filtered = [...journals];

    // Keyword filter
    if (this.currentFilters.keyword) {
      const keyword = this.currentFilters.keyword.toLowerCase();
      filtered = filtered.filter((entry) => {
        const t = (entry.title || "").toLowerCase();
        const c = (entry.content || "").toLowerCase();
        return t.includes(keyword) || c.includes(keyword);
      });
    }

    // Date filter (matches by toDateString)
    if (this.currentFilters.date) {
      const filterDate = new Date(this.currentFilters.date).toDateString();
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.timestamp).toDateString();
        return entryDate === filterDate;
      });
    }

    // Length filter
    if (this.currentFilters.length !== "all") {
      filtered = filtered.filter((entry) => {
        const len = (entry.content || "").length;
        if (this.currentFilters.length === "short") return len < 200;
        if (this.currentFilters.length === "medium") return len >= 200 && len < 500;
        if (this.currentFilters.length === "long") return len >= 500;
        return true;
      });
    }

    return filtered;
  }

  openModal() {
    if (!this.journalModal) return;
    this.journalModal.style.display = "block";

    // Update datetime if your helper exists
    if (typeof updateDateTime === "function") updateDateTime("journalDatetime");

    // Hide form by default
    if (this.journalForm) this.journalForm.style.display = "none";
  }

  toggleForm() {
    if (!this.journalForm) return;

    const isHidden =
      this.journalForm.style.display === "none" || this.journalForm.style.display === "";

    this.journalForm.style.display = isHidden ? "block" : "none";

    if (isHidden && this.journalEmptyState) {
      this.journalEmptyState.style.display = "none";
    } else {
      this.loadJournals();
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.validationManager && !this.validationManager.validateForm(this.journalForm)) {
      alert("Please fix the errors.");
      return;
    }

    const titleInput = document.getElementById("journalTitle");
    const contentInput = document.getElementById("journalContent");
    if (!titleInput || !contentInput) return;

    const now = new Date();
    const entry = {
      id: crypto?.randomUUID
        ? crypto.randomUUID()
        : `j_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      timestamp: now.toISOString(),
      dateString: now.toLocaleString(),
    };

    if (!entry.title || !entry.content) {
      alert("Please enter Title and a Reflection.");
      return;
    }

    try {
      await this.saveEntryLocally(entry);

      // Reset UI
      this.journalForm.reset();
      this.journalForm.style.display = "none";

      const charCount = document.getElementById("charCount");
      if (charCount) charCount.textContent = "0";

      await this.loadJournals();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Error saving journal entry. Please try again.");
    }
  }

  async saveEntryLocally(entry) {
    // 1) IndexedDB first (best offline storage)
    if (this.storage && typeof this.storage.addToIndexedDB === "function") {
      await this.storage.addToIndexedDB("journals", entry);
    }

    // 2) LocalStorage mirror/fallback
    const localJournals = this.storage?.getLocal?.("journals") || [];
    const arr = Array.isArray(localJournals) ? localJournals : [];
    arr.unshift(entry);
    this.storage?.setLocal?.("journals", arr);
  }

  async loadJournals() {
    try {
      let journals = [];

      // Load from IndexedDB if available
      if (this.storage && typeof this.storage.getAllFromIndexedDB === "function") {
        journals = await this.storage.getAllFromIndexedDB("journals");
      } else {
        journals = this.storage?.getLocal?.("journals") || [];
      }

      if (!Array.isArray(journals) || journals.length === 0) {
        if (this.journalEmptyState) this.journalEmptyState.style.display = "block";
        if (this.journalEntries) this.journalEntries.innerHTML = "";
        this.updateCounter(0, 0);
        return;
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none";

      // Sort newest first
      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const filtered = this.filterJournals(journals);
      this.updateCounter(filtered.length, journals.length);

      if (this.journalEntries) {
        this.journalEntries.innerHTML = filtered
          .map(
            (entry) => `
              <div class="journal-entry">
                <div class="entry-header">
                  <h3>${this.escapeHtml(entry.title || "")}</h3>
                  <small>${this.escapeHtml(entry.dateString || "")}</small>
                </div>
                <p>${this.escapeHtml(entry.content || "")}</p>
              </div>
            `
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading journals:", error);
    }
  }

  updateCounter(filteredCount, totalCount) {
    const counter = document.getElementById("journalCounter");
    if (!counter) return;

    if (totalCount && filteredCount < totalCount) {
      counter.textContent = `Showing ${filteredCount} of ${totalCount} Reflection${
        totalCount !== 1 ? "s" : ""
      }`;
    } else {
      counter.textContent = `${filteredCount} Reflection${filteredCount !== 1 ? "s" : ""}`;
    }
  }

  async resetJournals() {
    if (!confirm("Are you sure you want to delete all journal entries?")) {
      return;
    }

    try {
      if (this.storage && typeof this.storage.clearIndexedDB === "function") {
        await this.storage.clearIndexedDB("journals");
      }
      this.storage?.removeLocal?.("journals");

      await this.loadJournals();
    } catch (error) {
      console.error("Error clearing journals:", error);
      alert("Error clearing journals. Please try again.");
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
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
                  <p><strong>File:</strong> ${this.escapeHtml(project.fileName)} (${this.formatFileSize(project.fileSize)})</p>
                  <button class="file-download" onclick="window.projectsManager.downloadFile(\`${project.fileData}\`, \`${this.escapeHtml(project.fileName)}\`)">
                     Download File
                  </button>
                </div>
              `
                  : ""
              }
            </div>
          `
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
    if (!confirm("Are you sure you want to delete all projects?")) return
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



// Player Manager - per-category progress
class PlayerManager {
  constructor(storage) {
    this.storage = storage;
    this.players = this.loadPlayers();
    this.currentPlayer = null;
  }

  // ---- storage helpers ----
  loadPlayers() {
    try {
      const raw = this.storage.getLocal("quizPlayers");
      if (!raw) return {};

      // If already an object, accept it
      if (typeof raw === "object" && raw !== null) return raw;

      // If string, parse it safely
      if (typeof raw === "string") {
        const cleaned = raw.trim();
        if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
          try {
            return JSON.parse(cleaned);
          } catch (e) {
            console.error("Error parsing quizPlayers JSON:", e);
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
    // keep same storage format you used 
    this.storage.setLocal("quizPlayers", JSON.stringify(this.players));
  }

  //  player CRUD
  playerExists(name) {
    return !!this.players?.[String(name).toLowerCase()];
  }

  getPlayer(name) {
    return this.players?.[String(name).toLowerCase()];
  }

  // Ensure category progress object exists for this player
  ensureCategoryProgress(player, category) {
    const cat = category || "programming";
    if (!player.progress || typeof player.progress !== "object") {
      player.progress = {};
    }
    if (!player.progress[cat]) {
      player.progress[cat] = {
        level: 1,
        scores: {}, 
        totalStars: 0,
        totalScore: 0,
        lastPlayed: new Date().toISOString(),
      };
    }
    return player.progress[cat];
  }

  // Recalculate totals for a single category progress bucket
  calculateCategoryTotals(categoryProgress) {
    let totalStars = 0;
    let totalScore = 0;

    Object.values(categoryProgress.scores || {}).forEach((levelData) => {
      totalStars += levelData.stars || 0;
      totalScore += levelData.score || 0;
    });

    categoryProgress.totalStars = totalStars;
    categoryProgress.totalScore = totalScore;
  }

  // Optional: keep old overall totals too (across all categories)
  calculateOverallTotals(player) {
    let totalStars = 0;
    let totalScore = 0;

    const progress = player.progress || {};
    Object.values(progress).forEach((catProg) => {
      totalStars += catProg.totalStars || 0;
      totalScore += catProg.totalScore || 0;
    });

    player.totalStars = totalStars;
    player.totalScore = totalScore;
  }

  createPlayer(name, gameMode = "normal") {
    const key = String(name).toLowerCase();
    const now = new Date().toISOString();

    this.players[key] = {
      name,
      gameMode,
      // Per-category progress lives here
      progress: {},
     
      totalStars: 0,
      totalScore: 0,
      lastPlayed: now,
      createdAt: now,
    };

    // Create a default bucket for the default category 
    this.ensureCategoryProgress(this.players[key], "programming");

    this.savePlayers();
    return this.players[key];
  }

  // ---- progress API 
  updatePlayerProgress(name, category, level, score, stars, gameMode) {
    const player = this.getPlayer(name);
    if (!player) {
      console.error(`Player "${name}" not found`);
      return;
    }

    const cat = category || "programming";
    const catProg = this.ensureCategoryProgress(player, cat);

    // Update player-wide info
    player.gameMode = gameMode;
    player.lastPlayed = new Date().toISOString();

    // Update category info
    catProg.lastPlayed = new Date().toISOString();

    const levelKey = `level${level}`;
    const currentBest = catProg.scores[levelKey];

    // Only update if better
    if (
      !currentBest ||
      score > (currentBest.score || 0) ||
      stars > (currentBest.stars || 0)
    ) {
      catProg.scores[levelKey] = {
        score,
        stars,
        gameMode,
        category: cat,
        date: new Date().toISOString(),
      };
    }

    // Unlock next level within THIS category only
    if (stars >= 1) {
      const nextLevel = level + 1;
      if (nextLevel <= 5 && nextLevel > (catProg.level || 1)) {
        catProg.level = nextLevel;
        console.log(
          `Player ${name} unlocked ${cat} level ${nextLevel} (completed level ${level} with ${stars} stars)`
        );
      }

      
      if (level > (catProg.level || 1)) {
        catProg.level = level;
      }
    }

    // Totals
    this.calculateCategoryTotals(catProg);
    this.calculateOverallTotals(player);

    this.savePlayers();

    console.log(
      `Updated player ${name} (${cat}): Level ${level} completed, Stars: ${stars}, Can play up to: ${catProg.level}`
    );
  }

  getHighestUnlockedLevel(playerName, category) {
    const player = this.getPlayer(playerName);
    if (!player) return 1;
    const catProg = this.ensureCategoryProgress(player, category || "programming");
    return catProg.level || 1;
  }

  getLevelScore(playerName, category, level) {
    const player = this.getPlayer(playerName);
    if (!player) return null;
    const catProg = this.ensureCategoryProgress(player, category || "programming");
    return catProg.scores?.[`level${level}`] || null;
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




    // CATEGORY
    this.currentCategory = "programming";
    this.categories = ["programming", "sports", "general", "science", "computers"];

    this.currentProfile = null;
    this.playerManager = new PlayerManager(storage);

    // Questions data
       const programmingBank = {
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




// SPORTS (5 levels x 15 Qs)

const sportsBank = {
  1: [
    { q: "How many players are on a soccer team on the field?",
       options: ["9", "10", "11", "12"],
        correct: 2 },
    { q: "Which sport uses a bat and ball and has bases?",
       options: 
       ["Baseball", "Basketball", "Hockey", "Tennis"], correct: 0 },
    { q: "How many points is a touchdown worth in American football (before extra points)?", options: ["3", "6", "7", "2"], correct: 1 },
    { q: "Which sport is played at Wimbledon?", options: ["Golf", "Tennis", "Cricket", "Rugby"], correct: 1 },
    { q: "What color card means a player is sent off in soccer?", options: ["Blue", "Green", "Yellow", "Red"], correct: 3 },
    { q: "How many minutes are in a standard soccer match (not including extra time)?", options: ["60", "70", "80", "90"], correct: 3 },
    { q: "Which sport uses a hoop and a basketball?", options: ["Basketball", "Netball", "Volleyball", "Baseball"], correct: 0 },
    { q: "Which sport uses a puck?", options: ["Field hockey", "Ice hockey", "Golf", "Cricket"], correct: 1 },
    { q: "How many players are on a basketball team on the court?", options: ["4", "5", "6", "7"], correct: 1 },
    { q: "Which sport is known as 'the beautiful game'?", options: ["Soccer", "Tennis", "Cricket", "Boxing"], correct: 0 },
    { q: "What do you hit in badminton?", options: ["Puck", "Shuttlecock", "Ball", "Disc"], correct: 1 },
    { q: "How many holes are in a standard golf course round?", options: ["9", "12", "18", "20"], correct: 2 },
    { q: "Which sport uses a net, a racket, and a small yellow ball?", options: ["Tennis", "Cricket", "Rugby", "Hockey"], correct: 0 },
    { q: "Which sport has a 'home run'?", options: ["Baseball", "Soccer", "Tennis", "Hockey"], correct: 0 },
    { q: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], correct: 1 },
  ],
  2: [
    { q: "Which country hosted the first modern Olympics (1896)?", options: ["France", "Greece", "UK", "USA"], correct: 1 },
    { q: "How many points is a free throw worth in basketball?", options: ["1", "2", "3", "4"], correct: 0 },
    { q: "What is a 'hat-trick' in soccer?", options: ["2 goals", "3 goals", "4 goals", "5 goals"], correct: 1 },
    { q: "Which sport uses the term 'love' for zero?", options: ["Tennis", "Cricket", "Basketball", "Rugby"], correct: 0 },
    { q: "In volleyball, how many hits max per side before sending over?", options: ["2", "3", "4", "5"], correct: 1 },
    { q: "Which sport has positions called pitcher and catcher?", options: ["Baseball", "Soccer", "Tennis", "Golf"], correct: 0 },
    { q: "What is the main scoring unit in cricket?", options: ["Runs", "Goals", "Points", "Baskets"], correct: 0 },
    { q: "Which sport uses a 'tee' to start a hole?", options: ["Golf", "Tennis", "Soccer", "Hockey"], correct: 0 },
    { q: "What does 'KO' mean in boxing?", options: ["Kick Out", "Knockout", "Keep On", "Knock Over"], correct: 1 },
    { q: "Which country is famous for sumo wrestling?", options: ["China", "Japan", "Korea", "Thailand"], correct: 1 },
    { q: "How many players are on a baseball team on the field?", options: ["8", "9", "10", "11"], correct: 1 },
    { q: "In tennis, what comes after 40-40?", options: ["Tie", "Advantage", "Break", "Set"], correct: 1 },
    { q: "Which sport is played in the Tour de France?", options: ["Cycling", "Running", "Swimming", "Skiing"], correct: 0 },
    { q: "Which sport uses a scrum?", options: ["Rugby", "Basketball", "Tennis", "Golf"], correct: 0 },
    { q: "What do referees show for a warning in soccer?", options: ["Red card", "Yellow card", "Blue card", "Green card"], correct: 1 },
  ],
  3: [
    { q: "What does NBA stand for?", options: ["National Baseball Association", "National Basketball Association", "New Basketball Alliance", "National Ball Association"], correct: 1 },
    { q: "Which competition awards the Super Bowl trophy?", options: ["NBA", "NFL", "MLB", "NHL"], correct: 1 },
    { q: "In cricket, how many balls are in an over?", options: ["4", "5", "6", "8"], correct: 2 },
    { q: "Which sport uses the Ryder Cup?", options: ["Tennis", "Golf", "Cricket", "Soccer"], correct: 1 },
    { q: "A marathon is approximately how many kilometers?", options: ["21", "32", "42", "50"], correct: 2 },
    { q: "In baseball, how many strikes for an out?", options: ["2", "3", "4", "5"], correct: 1 },
    { q: "Which sport has positions called goalkeeper, defender, midfielder, forward?", options: ["Soccer", "Basketball", "Tennis", "Baseball"], correct: 0 },
    { q: "In ice hockey, how many players per team on ice (including goalie)?", options: ["5", "6", "7", "8"], correct: 1 },
    { q: "What is a 'birdie' in golf?", options: ["1 over par", "2 over par", "1 under par", "Even par"], correct: 2 },
    { q: "Which sport uses a 'shuttlecock'?", options: ["Badminton", "Squash", "Table tennis", "Hockey"], correct: 0 },
    { q: "In tennis, a set is usually won at how many games (with 2 game lead)?", options: ["4", "5", "6", "7"], correct: 2 },
    { q: "Which sport is Michael Jordan famous for?", options: ["Baseball", "Basketball", "Soccer", "Tennis"], correct: 1 },
    { q: "What is the main object hit in squash?", options: ["Puck", "Ball", "Shuttlecock", "Disc"], correct: 1 },
    { q: "What does FIFA govern?", options: ["Basketball", "Soccer", "Cricket", "Tennis"], correct: 1 },
    { q: "In rugby, what is a try worth (union)?", options: ["3", "5", "6", "7"], correct: 1 },
  ],
  4: [
    { q: "Which country has won the most FIFA World Cups (men)?", options: ["Germany", "Italy", "Brazil", "Argentina"], correct: 2 },
    { q: "In Formula 1, what does a checkered flag signal?", options: ["Start", "Finish", "Pit stop", "Crash"], correct: 1 },
    { q: "In snooker, what is the highest possible break?", options: ["155", "147", "140", "150"], correct: 1 },
    { q: "In tennis, what is a 'break of serve'?", options: ["Winning opponent’s service game", "Stopping play", "Tie-break start", "Changing ends"], correct: 0 },
    { q: "In cricket, what is LBW?", options: ["Leg Before Wicket", "Long Ball Wide", "Last Bat Wins", "Low Bounce Wicket"], correct: 0 },
    { q: "Which sport uses a 'power play'?", options: ["Ice hockey", "Soccer", "Tennis", "Golf"], correct: 0 },
    { q: "In basketball, how many quarters are in an NBA game?", options: ["2", "3", "4", "5"], correct: 2 },
    { q: "Which sport uses 'deuce'?", options: ["Tennis", "Cricket", "Rugby", "Golf"], correct: 0 },
    { q: "In baseball, how many innings in a standard game?", options: ["7", "8", "9", "10"], correct: 2 },
    { q: "What is the 'diamond' in baseball?", options: ["Pitcher mound", "Base paths area", "Stadium roof", "Bat shape"], correct: 1 },
    { q: "In soccer, what is offside based on?", options: ["Ball speed", "Player position", "Shoe size", "Goal size"], correct: 1 },
    { q: "Which sport has the Stanley Cup?", options: ["Basketball", "Ice hockey", "Baseball", "Soccer"], correct: 1 },
    { q: "In golf, what does 'par' mean?", options: ["Expected strokes", "Minimum strokes", "Maximum strokes", "Bonus points"], correct: 0 },
    { q: "Which sport uses 'wickets'?", options: ["Cricket", "Tennis", "Soccer", "Rugby"], correct: 0 },
    { q: "In volleyball, what is a 'block'?", options: ["Serve", "Defensive net stop", "Timeout", "Foul"], correct: 1 },
  ],
  5: [
    { q: "In chess boxing, what decides the winner if no knockout/checkmate?", options: ["Judges only", "Points after rounds", "Coin toss", "Timeouts"], correct: 1 },
    { q: "In Olympic decathlon, how many events are there?", options: ["8", "10", "12", "14"], correct: 1 },
    { q: "Which tennis tournament is played on clay?", options: ["Wimbledon", "US Open", "French Open", "Australian Open"], correct: 2 },
    { q: "In F1, what is 'pole position'?", options: ["Last place start", "First place start", "Middle start", "Pit lane start"], correct: 1 },
    { q: "What is the term for 3 under par on a hole in golf?", options: ["Birdie", "Eagle", "Albatross", "Bogey"], correct: 2 },
    { q: "In basketball, what is a 'triple-double'?", options: ["3 fouls", "10+ in 3 stats", "3 points", "3 quarters"], correct: 1 },
    { q: "In cricket, what is a 'duck'?", options: ["A hat-trick", "Zero runs", "Six runs", "No ball"], correct: 1 },
    { q: "In soccer, what is a 'clean sheet'?", options: ["No fouls", "No goals conceded", "No corners", "No offsides"], correct: 1 },
    { q: "Which sport uses 'touchline' and 'try line'?", options: ["Rugby", "Tennis", "Golf", "Baseball"], correct: 0 },
    { q: "In hockey, how many periods are played?", options: ["2", "3", "4", "5"], correct: 1 },
    { q: "In tennis, a tie-break is usually to how many points (win by 2)?", options: ["5", "7", "9", "11"], correct: 1 },
    { q: "In baseball, what is an RBI?", options: ["Run Batted In", "Rapid Ball In", "Runner Base In", "Run Blocked In"], correct: 0 },
    { q: "In cycling, what does 'peloton' mean?", options: ["Finish line", "Main group", "Solo rider", "Bike type"], correct: 1 },
    { q: "In rugby union, what is a conversion worth?", options: ["1", "2", "3", "5"], correct: 1 },
    { q: "In boxing, how many points is a knockdown typically worth advantage-wise?", options: ["1", "2", "10-8 round", "No effect"], correct: 2 },
  ],
};



// GENERAL (5 levels x 15 Qs)
const generalBank = {
  1: [
    { q: "What is the capital of France?", options: ["Rome", "Paris", "Madrid", "Berlin"], correct: 1 },
    { q: "How many days are in a week?", options: ["5", "6", "7", "8"], correct: 2 },
    { q: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Venus"], correct: 2 },
    { q: "Which animal says 'meow'?", options: ["Dog", "Cat", "Cow", "Sheep"], correct: 1 },
    { q: "What do you call frozen water?", options: ["Steam", "Ice", "Mist", "Rain"], correct: 1 },
    { q: "Which month comes after June?", options: ["May", "July", "August", "April"], correct: 1 },
    { q: "How many hours are in a day?", options: ["12", "18", "24", "30"], correct: 2 },
    { q: "What is the opposite of 'hot'?", options: ["Warm", "Cold", "Soft", "Fast"], correct: 1 },
    { q: "Which shape has 3 sides?", options: ["Square", "Triangle", "Circle", "Rectangle"], correct: 1 },
    { q: "What color do you get by mixing red and white?", options: ["Pink", "Purple", "Orange", "Brown"], correct: 0 },
    { q: "Which continent is Egypt in?", options: ["Europe", "Africa", "Asia", "Australia"], correct: 1 },
    { q: "Which is a fruit?", options: ["Carrot", "Potato", "Apple", "Onion"], correct: 2 },
    { q: "What is 10 + 5?", options: ["12", "15", "20", "25"], correct: 1 },
    { q: "Which direction does the sun rise?", options: ["North", "South", "East", "West"], correct: 2 },
    { q: "Which one is used to write?", options: ["Spoon", "Pencil", "Plate", "Cup"], correct: 1 },
  ],
  2: [
    { q: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct: 2 },
    { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
    { q: "Which country is famous for the Eiffel Tower?", options: ["Italy", "France", "Spain", "Germany"], correct: 1 },
    { q: "What is the currency of the UK?", options: ["Euro", "Dollar", "Pound", "Yen"], correct: 2 },
    { q: "What is the capital of Japan?", options: ["Seoul", "Tokyo", "Beijing", "Bangkok"], correct: 1 },
    { q: "Which planet is known as the Red Planet?", options: ["Mercury", "Venus", "Mars", "Saturn"], correct: 2 },
    { q: "What do bees make?", options: ["Milk", "Honey", "Water", "Oil"], correct: 1 },
    { q: "Which instrument has black and white keys?", options: ["Guitar", "Piano", "Drum", "Flute"], correct: 1 },
    { q: "How many letters are in the English alphabet?", options: ["24", "25", "26", "27"], correct: 2 },
    { q: "Which one is a primary color?", options: ["Green", "Purple", "Blue", "Pink"], correct: 2 },
    { q: "What is the tallest animal?", options: ["Elephant", "Giraffe", "Horse", "Lion"], correct: 1 },
    { q: "Which season comes after summer?", options: ["Spring", "Autumn", "Winter", "Monsoon"], correct: 1 },
    { q: "What is the main language of Brazil?", options: ["Spanish", "Portuguese", "French", "English"], correct: 1 },
    { q: "What is 9 x 3?", options: ["18", "21", "27", "30"], correct: 2 },
    { q: "Which gas do humans need to breathe?", options: ["Oxygen", "Carbon dioxide", "Helium", "Neon"], correct: 0 },
  ],
  3: [
    { q: "Who wrote 'Romeo and Juliet'?", options: ["Shakespeare", "Dickens", "Tolkien", "Austen"], correct: 0 },
    { q: "Which country has the largest population?", options: ["USA", "India", "China", "Russia"], correct: 1 },
    { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
    { q: "Which desert is the largest (hot desert)?", options: ["Gobi", "Sahara", "Kalahari", "Atacama"], correct: 1 },
    { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correct: 1 },
    { q: "Which metal is liquid at room temperature?", options: ["Iron", "Mercury", "Gold", "Silver"], correct: 1 },
    { q: "Which is the longest river (commonly taught)?", options: ["Amazon", "Nile", "Yangtze", "Danube"], correct: 1 },
    { q: "What is the boiling point of water (°C)?", options: ["90", "95", "100", "110"], correct: 2 },
    { q: "Which country gifted the Statue of Liberty to the USA?", options: ["UK", "France", "Germany", "Spain"], correct: 1 },
    { q: "Which is the smallest continent?", options: ["Europe", "Australia", "Africa", "Antarctica"], correct: 1 },
    { q: "Which blood type is known as the universal donor?", options: ["A", "B", "AB", "O negative"], correct: 3 },
    { q: "Which organ is used to pump blood?", options: ["Lungs", "Heart", "Liver", "Kidney"], correct: 1 },
    { q: "What is the main ingredient in bread?", options: ["Flour", "Sugar", "Salt", "Oil"], correct: 0 },
    { q: "Which is a renewable energy source?", options: ["Coal", "Oil", "Wind", "Gas"], correct: 2 },
    { q: "Which animal is the fastest on land?", options: ["Lion", "Horse", "Cheetah", "Wolf"], correct: 2 },
  ],
  4: [
    { q: "What does UNESCO stand for (best match)?", options: ["UN culture group", "UN education/science/culture org", "UN sports org", "UN trade org"], correct: 1 },
    { q: "Which country is both in Europe and Asia?", options: ["Turkey", "Portugal", "Norway", "Ireland"], correct: 0 },
    { q: "Which city is known as the 'Big Apple'?", options: ["Los Angeles", "New York City", "Chicago", "Miami"], correct: 1 },
    { q: "What is the hardest natural substance?", options: ["Iron", "Diamond", "Gold", "Quartz"], correct: 1 },
    { q: "Which language has the most native speakers (commonly listed)?", options: ["English", "Spanish", "Mandarin Chinese", "French"], correct: 2 },
    { q: "Which country is known for the Great Barrier Reef?", options: ["Australia", "USA", "South Africa", "Japan"], correct: 0 },
    { q: "What is the chemical symbol for gold?", options: ["Ag", "Au", "Gd", "Go"], correct: 1 },
    { q: "What is the largest mammal?", options: ["Elephant", "Blue whale", "Giraffe", "Hippo"], correct: 1 },
    { q: "Which is NOT a prime number?", options: ["2", "3", "9", "11"], correct: 2 },
    { q: "Which planet is known for its rings?", options: ["Mars", "Saturn", "Mercury", "Earth"], correct: 1 },
    { q: "What is the main language spoken in Egypt?", options: ["Arabic", "French", "Spanish", "Italian"], correct: 0 },
    { q: "What is the capital of Canada?", options: ["Toronto", "Ottawa", "Vancouver", "Montreal"], correct: 1 },
    { q: "Which sea separates Europe and Africa?", options: ["Red Sea", "Mediterranean Sea", "Arabian Sea", "Black Sea"], correct: 1 },
    { q: "How many degrees are in a right angle?", options: ["45", "90", "120", "180"], correct: 1 },
    { q: "Which is a programming language?", options: ["Python", "Eagle", "Saturn", "Granite"], correct: 0 },
  ],
  5: [
    { q: "Which country has the city of Machu Picchu?", options: ["Peru", "Mexico", "Chile", "Brazil"], correct: 0 },
    { q: "What is the study of earthquakes called?", options: ["Astronomy", "Seismology", "Ecology", "Meteorology"], correct: 1 },
    { q: "What does GDP stand for?", options: ["Global Data Program", "Gross Domestic Product", "General Demand Price", "Great Development Plan"], correct: 1 },
    { q: "Which is a palindrome?", options: ["banana", "level", "apple", "orange"], correct: 1 },
    { q: "Which element has atomic number 1?", options: ["Helium", "Hydrogen", "Oxygen", "Carbon"], correct: 1 },
    { q: "Which is the largest organ in the human body?", options: ["Heart", "Skin", "Liver", "Brain"], correct: 1 },
    { q: "What is the capital of South Korea?", options: ["Seoul", "Busan", "Incheon", "Daegu"], correct: 0 },
    { q: "Which is a greenhouse gas?", options: ["Oxygen", "Carbon dioxide", "Neon", "Argon"], correct: 1 },
    { q: "What is the longest bone in the human body?", options: ["Femur", "Humerus", "Tibia", "Radius"], correct: 0 },
    { q: "Which number is a square number?", options: ["18", "20", "25", "27"], correct: 2 },
    { q: "Which planet has the most moons (commonly cited)?", options: ["Earth", "Mars", "Jupiter", "Mercury"], correct: 2 },
    { q: "Which country is famous for fjords?", options: ["Norway", "Italy", "India", "Egypt"], correct: 0 },
    { q: "What is the largest ocean?", options: ["Atlantic", "Pacific", "Indian", "Arctic"], correct: 1 },
    { q: "Which is a vertebrate?", options: ["Jellyfish", "Shark", "Worm", "Octopus"], correct: 1 },
    { q: "What is the main unit of currency in Japan?", options: ["Won", "Yen", "Yuan", "Ringgit"], correct: 1 },
  ],
};



// SCIENCE (5 levels x 15 Qs)

const scienceBank = {
  1: [
    { q: "What is H2O?", options: ["Salt", "Water", "Oxygen", "Hydrogen"], correct: 1 },
    { q: "Which organ pumps blood?", options: ["Brain", "Heart", "Lungs", "Kidney"], correct: 1 },
    { q: "What gas do plants take in?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], correct: 1 },
    { q: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correct: 2 },
    { q: "What do we call animals that eat only plants?", options: ["Carnivores", "Herbivores", "Omnivores", "Predators"], correct: 1 },
    { q: "What is the solid form of water?", options: ["Steam", "Ice", "Mist", "Cloud"], correct: 1 },
    { q: "How many legs does an insect have?", options: ["4", "6", "8", "10"], correct: 1 },
    { q: "Which part of the body helps you see?", options: ["Ear", "Nose", "Eye", "Tongue"], correct: 2 },
    { q: "What do you call the place where a plant grows roots?", options: ["Leaf", "Stem", "Soil", "Flower"], correct: 2 },
    { q: "Which is a source of light?", options: ["Rock", "Sun", "Sand", "Water"], correct: 1 },
    { q: "What do humans breathe in?", options: ["Oxygen", "Carbon dioxide", "Hydrogen", "Chlorine"], correct: 0 },
    { q: "Which is NOT a state of matter?", options: ["Solid", "Liquid", "Gas", "Bright"], correct: 3 },
    { q: "What is the main star in our solar system?", options: ["Moon", "Sun", "Mars", "Venus"], correct: 1 },
    { q: "Which body part helps you hear?", options: ["Eye", "Ear", "Hand", "Foot"], correct: 1 },
    { q: "What do bees produce?", options: ["Honey", "Milk", "Oil", "Steam"], correct: 0 },
  ],
  2: [
    { q: "What is the boiling point of water (°C)?", options: ["90", "95", "100", "110"], correct: 2 },
    { q: "Which gas is most common in Earth’s atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 1 },
    { q: "Which vitamin is made using sunlight?", options: ["A", "B", "C", "D"], correct: 3 },
    { q: "What is the force that pulls objects down?", options: ["Friction", "Gravity", "Magnetism", "Pressure"], correct: 1 },
    { q: "What do we call the change from liquid to gas?", options: ["Freezing", "Melting", "Evaporation", "Condensation"], correct: 2 },
    { q: "Which part of a plant makes food?", options: ["Root", "Leaf", "Stem", "Seed"], correct: 1 },
    { q: "Which is a conductor of electricity?", options: ["Plastic", "Rubber", "Copper", "Wood"], correct: 2 },
    { q: "What is the unit of temperature in science commonly used?", options: ["Celsius", "Meter", "Kilogram", "Volt"], correct: 0 },
    { q: "Which planet is known for rings?", options: ["Mars", "Saturn", "Venus", "Mercury"], correct: 1 },
    { q: "What part of the cell contains DNA?", options: ["Nucleus", "Cell wall", "Cytoplasm", "Membrane"], correct: 0 },
    { q: "Which is NOT a sense?", options: ["Sight", "Taste", "Smell", "Jump"], correct: 3 },
    { q: "What do we call animals that eat meat?", options: ["Herbivores", "Carnivores", "Omnivores", "Producers"], correct: 1 },
    { q: "Which organ helps you breathe?", options: ["Heart", "Lungs", "Stomach", "Liver"], correct: 1 },
    { q: "What do magnets attract most strongly?", options: ["Wood", "Plastic", "Iron", "Glass"], correct: 2 },
    { q: "What is the closest planet to Earth?", options: ["Venus", "Jupiter", "Saturn", "Neptune"], correct: 0 },
  ],
  3: [
    { q: "What is the center of an atom called?", options: ["Electron", "Nucleus", "Molecule", "Ion"], correct: 1 },
    { q: "What is photosynthesis?", options: ["Plant breathing", "Plant food-making process", "Animal digestion", "Rock formation"], correct: 1 },
    { q: "What is the speed of light (approx.)?", options: ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"], correct: 2 },
    { q: "Which blood cells help fight infection?", options: ["Red blood cells", "White blood cells", "Platelets", "Plasma"], correct: 1 },
    { q: "Which is an example of a chemical change?", options: ["Melting ice", "Boiling water", "Rusting iron", "Breaking glass"], correct: 2 },
    { q: "What is an ecosystem?", options: ["Only animals", "Only plants", "Living + non-living together", "Only water"], correct: 2 },
    { q: "Which organ filters blood to make urine?", options: ["Liver", "Kidney", "Heart", "Lungs"], correct: 1 },
    { q: "Which planet is the largest?", options: ["Earth", "Mars", "Jupiter", "Venus"], correct: 2 },
    { q: "What is an electric circuit?", options: ["A closed path for electricity", "A battery only", "A magnet", "A wire only"], correct: 0 },
    { q: "Which is a renewable energy source?", options: ["Coal", "Oil", "Wind", "Gas"], correct: 2 },
    { q: "What is the main gas in exhaled air?", options: ["Oxygen", "Carbon dioxide", "Helium", "Neon"], correct: 1 },
    { q: "What is density?", options: ["Mass/volume", "Speed/time", "Force/area", "Heat/volume"], correct: 0 },
    { q: "Which part of the ear helps with balance?", options: ["Cochlea", "Eardrum", "Inner ear", "Outer ear"], correct: 2 },
    { q: "What is a comet mostly made of?", options: ["Ice and dust", "Pure rock", "Metal only", "Water only"], correct: 0 },
    { q: "What is the main function of red blood cells?", options: ["Fight germs", "Carry oxygen", "Make bones", "Digest food"], correct: 1 },
  ],
  4: [
    { q: "What is DNA?", options: ["A sugar", "Genetic material", "A vitamin", "A hormone"], correct: 1 },
    { q: "What is pH used to measure?", options: ["Speed", "Acidity", "Mass", "Voltage"], correct: 1 },
    { q: "Which law says action and reaction are equal and opposite?", options: ["Newton’s 1st", "Newton’s 2nd", "Newton’s 3rd", "Ohm’s law"], correct: 2 },
    { q: "What is an isotope?", options: ["Different electrons", "Same protons, different neutrons", "Same neutrons, different protons", "Different atoms mixed"], correct: 1 },
    { q: "Which organelle is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"], correct: 1 },
    { q: "What is refraction?", options: ["Bending of light", "Stopping of light", "Creating light", "Absorbing sound"], correct: 0 },
    { q: "Which type of rock forms from lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], correct: 2 },
    { q: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correct: 1 },
    { q: "Which particle has a negative charge?", options: ["Proton", "Neutron", "Electron", "Nucleus"], correct: 2 },
    { q: "What is osmosis?", options: ["Water movement across membrane", "Air movement", "Rock movement", "Heat movement"], correct: 0 },
    { q: "Which gas forms the ozone layer?", options: ["O2", "O3", "CO2", "N2"], correct: 1 },
    { q: "What is an antibiotic used for?", options: ["Viruses", "Bacteria", "Dust", "Sunburn"], correct: 1 },
    { q: "Which system controls hormones?", options: ["Digestive", "Endocrine", "Respiratory", "Skeletal"], correct: 1 },
    { q: "What is plate tectonics?", options: ["Cloud movement", "Earth plate movement", "Ocean tides", "Wind currents"], correct: 1 },
    { q: "What is the main function of chlorophyll?", options: ["Absorb light", "Make roots", "Store oxygen", "Create seeds"], correct: 0 },
  ],
  5: [
    { q: "What is the first law of thermodynamics about?", options: ["Energy conservation", "Gravity", "Magnetism", "Refraction"], correct: 0 },
    { q: "What is radioactive decay?", options: ["Chemical change", "Nuclear change", "Melting", "Freezing"], correct: 1 },
    { q: "What is the SI unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correct: 1 },
    { q: "What is a black hole?", options: ["A star", "Region with strong gravity", "A planet", "A comet"], correct: 1 },
    { q: "What does 'half-life' mean?", options: ["Time to double", "Time for half to decay", "Time to freeze", "Time to melt"], correct: 1 },
    { q: "What is CRISPR mainly used for?", options: ["Weather", "Gene editing", "Fuel", "Cooking"], correct: 1 },
    { q: "What is the SI unit of pressure?", options: ["Newton", "Pascal", "Joule", "Tesla"], correct: 1 },
    { q: "What is the process of turning nitrogen into usable forms called?", options: ["Nitrogen fixation", "Evaporation", "Condensation", "Combustion"], correct: 0 },
    { q: "What is a catalyst?", options: ["Speeds reaction without being used up", "Stops reaction", "Becomes product", "Adds heat only"], correct: 0 },
    { q: "What is the main component of natural gas?", options: ["Methane", "Oxygen", "Nitrogen", "Helium"], correct: 0 },
    { q: "What is the unit of frequency?", options: ["Hertz", "Newton", "Pascal", "Joule"], correct: 0 },
    { q: "Which is a vector quantity?", options: ["Speed", "Mass", "Temperature", "Velocity"], correct: 3 },
    { q: "What is the chemical symbol for sodium?", options: ["So", "Na", "Sd", "Sn"], correct: 1 },
    { q: "What is the main function of ribosomes?", options: ["Make proteins", "Make DNA", "Make light", "Make sugar"], correct: 0 },
    { q: "What is the SI unit of energy?", options: ["Watt", "Joule", "Volt", "Ampere"], correct: 1 },
  ],
};


// COMPUTERS (5 levels x 15 Qs)
const computersBank = {
  1: [
    { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Core Processing Unit", "Central Program Unit"], correct: 0 },
    { q: "What device is used to type?", options: ["Mouse", "Keyboard", "Monitor", "Speaker"], correct: 1 },
    { q: "Which is an output device?", options: ["Keyboard", "Mouse", "Monitor", "Scanner"], correct: 2 },
    { q: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Run All Memory", "Rapid Access Module"], correct: 0 },
    { q: "What does a mouse mainly control?", options: ["Sound", "Pointer/cursor", "Printing", "Storage"], correct: 1 },
    { q: "Which one stores data permanently?", options: ["RAM", "Cache", "Hard drive/SSD", "Register"], correct: 2 },
    { q: "What is the screen also called?", options: ["Monitor", "CPU", "Router", "Modem"], correct: 0 },
    { q: "What does USB stand for?", options: ["Universal Serial Bus", "Ultra Speed Bus", "United System Board", "Universal Signal Base"], correct: 0 },
    { q: "Which key deletes characters to the left?", options: ["Enter", "Shift", "Backspace", "Alt"], correct: 2 },
    { q: "What is software?", options: ["Physical parts", "Programs", "Wires", "Chips"], correct: 1 },
    { q: "What is hardware?", options: ["Programs", "Apps", "Physical parts", "Internet"], correct: 2 },
    { q: "Which is used to print?", options: ["Router", "Printer", "Scanner", "Speaker"], correct: 1 },
    { q: "Which device connects you to Wi-Fi?", options: ["Router", "Keyboard", "Monitor", "Microphone"], correct: 0 },
    { q: "What does a browser do?", options: ["Plays only music", "Opens websites", "Cleans viruses", "Edits photos only"], correct: 1 },
    { q: "Which is a file type?", options: [".mp3", ".chair", ".water", ".book"], correct: 0 },
  ],
  2: [
    { q: "Which is an operating system?", options: ["Windows", "Google", "Intel", "Wi-Fi"], correct: 0 },
    { q: "What does WWW stand for?", options: ["World Wide Web", "Wide World Web", "World Web Wide", "Web World Wide"], correct: 0 },
    { q: "What is a computer virus?", options: ["Hardware part", "Malware", "Monitor", "Keyboard"], correct: 1 },
    { q: "What does GPU stand for?", options: ["Graphical Processing Unit", "General Processing Unit", "Game Program Unit", "Graphic Power Utility"], correct: 0 },
    { q: "Which storage is faster generally?", options: ["HDD", "SSD", "DVD", "Floppy"], correct: 1 },
    { q: "What is a folder used for?", options: ["Cooking", "Organizing files", "Charging", "Printing"], correct: 1 },
    { q: "What does 'download' mean?", options: ["Send to internet", "Get data from internet", "Delete files", "Format disk"], correct: 1 },
    { q: "What does 'upload' mean?", options: ["Send data to internet", "Get data from internet", "Turn off PC", "Scan"], correct: 0 },
    { q: "Which is a search engine?", options: ["Chrome", "Google", "Windows", "Intel"], correct: 1 },
    { q: "What does 'Wi-Fi' provide?", options: ["Electricity", "Wireless internet", "Printing", "Storage"], correct: 1 },
    { q: "What is a password used for?", options: ["Speed", "Security", "Brightness", "Sound"], correct: 1 },
    { q: "What does 'reboot' mean?", options: ["Delete files", "Restart device", "Print page", "Open browser"], correct: 1 },
    { q: "Which is an input device?", options: ["Monitor", "Printer", "Keyboard", "Speaker"], correct: 2 },
    { q: "What is an app?", options: ["A cable", "A program", "A keyboard key", "A virus"], correct: 1 },
    { q: "Which is used to capture sound?", options: ["Mouse", "Microphone", "Monitor", "Router"], correct: 1 },
  ],
  3: [
    { q: "What is an algorithm?", options: ["A bug", "Step-by-step solution", "A monitor", "A cable"], correct: 1 },
    { q: "What is cloud storage?", options: ["USB drive", "Internet-based storage", "Paper storage", "RAM"], correct: 1 },
    { q: "What does IP stand for in IP address?", options: ["Internet Protocol", "Internal Program", "Input Power", "Index Path"], correct: 0 },
    { q: "What is HTML used for?", options: ["Styling", "Structure web pages", "Database", "Email only"], correct: 1 },
    { q: "What is CSS used for?", options: ["Structure", "Styling", "Server hosting", "Encryption"], correct: 1 },
    { q: "What is JavaScript mainly used for on websites?", options: ["Make sites interactive", "Only design", "Only databases", "Only printing"], correct: 0 },
    { q: "Which is NOT a programming language?", options: ["Python", "Java", "Windows", "C++"], correct: 2 },
    { q: "What is a database?", options: ["Game", "Organized data storage", "Monitor", "Mouse"], correct: 1 },
    { q: "What does 'open source' mean?", options: ["Hidden code", "Code available to view", "Paid only", "Virus"], correct: 1 },
    { q: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Text Transfer Program", "Hyper Tool Text Process", "Host Transfer Text Protocol"], correct: 0 },
    { q: "What is a URL?", options: ["A password", "A website address", "A virus", "A file type"], correct: 1 },
    { q: "What is a firewall used for?", options: ["Speed up PC", "Block threats", "Print faster", "Cool CPU"], correct: 1 },
    { q: "What is phishing?", options: ["A sport", "A scam to steal info", "A file type", "A keyboard shortcut"], correct: 1 },
    { q: "What is 1 byte equal to?", options: ["4 bits", "8 bits", "16 bits", "32 bits"], correct: 1 },
    { q: "What is a LAN?", options: ["Local Area Network", "Large Access Node", "Long Area Net", "Local Air Network"], correct: 0 },
  ],
  4: [
    { q: "Which protocol is used for secure web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correct: 2 },
    { q: "What does 'compile' mean?", options: ["Delete code", "Translate code to machine code", "Send email", "Make backup"], correct: 1 },
    { q: "What is a class in OOP?", options: ["A loop", "A blueprint for objects", "A server", "A database"], correct: 1 },
    { q: "What is Git mainly used for?", options: ["Design", "Version control", "Hosting emails", "Antivirus"], correct: 1 },
    { q: "What is an API?", options: ["A virus", "A way programs communicate", "A monitor setting", "A file type"], correct: 1 },
    { q: "Which one is a relational database?", options: ["MySQL", "Photoshop", "Windows", "Chrome"], correct: 0 },
    { q: "What is 'cache'?", options: ["Slow storage", "Temporary stored data", "A virus", "A monitor"], correct: 1 },
    { q: "What does DNS do?", options: ["Stores photos", "Turns names into IPs", "Encrypts files", "Runs apps"], correct: 1 },
    { q: "What is a 'process' in OS terms?", options: ["A running program", "A keyboard key", "A file format", "A cable"], correct: 0 },
    { q: "What is 'bandwidth'?", options: ["Storage size", "Network capacity", "Screen size", "CPU speed"], correct: 1 },
    { q: "Which is a common Linux distribution?", options: ["Ubuntu", "Windows", "Chrome", "Android"], correct: 0 },
    { q: "What is encryption?", options: ["Deleting files", "Securing data", "Printing", "Charging"], correct: 1 },
    { q: "What is 2FA?", options: ["Two-Factor Authentication", "Two File Access", "Two Fast Apps", "Two Format Action"], correct: 0 },
    { q: "What is a 'repository' in Git?", options: ["A folder for project history", "A keyboard key", "A virus", "A GPU mode"], correct: 0 },
    { q: "What is 'latency'?", options: ["Delay", "Storage", "Brightness", "Battery"], correct: 0 },
  ],
  5: [
    { q: "What is a hash function mainly used for?", options: ["Compress video", "Map data to fixed output", "Increase RAM", "Draw graphics"], correct: 1 },
    { q: "What is Big-O notation used for?", options: ["Color design", "Time/space complexity", "Screen size", "Network names"], correct: 1 },
    { q: "What is a deadlock?", options: ["Fast network", "Processes waiting forever", "New update", "File backup"], correct: 1 },
    { q: "What is SQL used for?", options: ["Styling", "Query databases", "Draw graphics", "Send SMS"], correct: 1 },
    { q: "What is a virtual machine?", options: ["A real CPU", "Software computer inside computer", "A keyboard", "A router"], correct: 1 },
    { q: "What is containerization (e.g., Docker)?", options: ["Packaging apps + dependencies", "Cleaning cache", "Virus removal", "Overclocking"], correct: 0 },
    { q: "What is CI/CD?", options: ["Continuous Integration/Deployment", "Central Internet/Cloud Data", "Code Input/Code Debug", "Computer Install/Computer Delete"], correct: 0 },
    { q: "What is a DDoS attack?", options: ["Password manager", "Overwhelming a service with traffic", "Data backup", "Disk repair"], correct: 1 },
    { q: "What is a public key used for?", options: ["Decrypt only", "Encrypt/verify in asymmetric crypto", "Store photos", "Boost FPS"], correct: 1 },
    { q: "What is a pointer (in programming)?", options: ["A link to memory address", "A mouse button", "A file type", "A monitor pixel"], correct: 0 },
    { q: "What is normalization in databases?", options: ["Speed up GPU", "Reduce redundancy", "Add images", "Encrypt tables"], correct: 1 },
    { q: "What is an HTTP status code 404?", options: ["OK", "Not Found", "Forbidden", "Server Error"], correct: 1 },
    { q: "What is a race condition?", options: ["Two events competing causing bugs", "Fast code always", "A virus type", "A database table"], correct: 0 },
    { q: "What is a binary search requirement?", options: ["Unsorted list", "Sorted list", "Graph only", "String only"], correct: 1 },
    { q: "What is recursion?", options: ["Loop only", "Function calling itself", "Deleting memory", "Sorting only"], correct: 1 },
  ],
};


if (!generalBank || !scienceBank || !computersBank) {
      console.warn(
        "generalBank/scienceBank/computersBank placeholders detected. " +
          "Paste your full objects in place of window.__generalBank etc."
      );
    }

    // 5 categories total
    this.questionBanks = {
      programming: programmingBank,
      sports: sportsBank,
      general: generalBank || {},
      science: scienceBank || {},
      computers: computersBank || {},
    };

    // set initial questions source
    this.questions = this.questionBanks[this.currentCategory];

    // restore last selected category (optional)
    const savedCategory = this.storage.getLocal("quizCategory");
    if (savedCategory && this.questionBanks[savedCategory]) {
      this.currentCategory = savedCategory;
      this.questions = this.questionBanks[this.currentCategory];
    }

    this.init();
  }

  init() {
    console.log("Initializing QuizGameManager with Player Management (Per-Category Progress)");

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

    // Setup category toggle
    this.setupCategoryToggle();

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

    // Setup leaderboard toggle + filter
    this.setupLeaderboardToggle();
    this.setupLeaderboardCategoryFilter();

    // Setup player detection + resume
    this.setupPlayerDetection();
    this.setupResumeButton();

    // Load progress for current player if exists
    this.checkForCurrentPlayer();

    // Ensure level cards reflect category for already-typed name
    this.refreshUIAfterCategoryChange();
  }

 // CATEGORY TOGGLE 
     
  setupCategoryToggle() {
    const container = document.getElementById("categoryToggle");
    const buttons = container
      ? container.querySelectorAll(".category-btn")
      : document.querySelectorAll(".category-btn");

    if (!buttons || buttons.length === 0) {
      console.warn("No category buttons found. Add .category-btn with data-category.");
      return;
    }

    const setCategory = (category) => {
      if (!category || !this.questionBanks[category]) return;

      this.currentCategory = category;
      this.questions = this.questionBanks[category];

      // persist
      this.storage.setLocal("quizCategory", category);

      // update active class
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.category === category));

      console.log("Category selected:", category);

      // Refresh per-category UI now
      this.refreshUIAfterCategoryChange();
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const category = btn.dataset.category;
        setCategory(category);
      });
    });

    // init active state (saved or default)
    const savedCategory = this.storage.getLocal("quizCategory");
    if (savedCategory && this.questionBanks[savedCategory]) {
      setCategory(savedCategory);
    } else {
      setCategory(this.currentCategory);
    }
  }

  refreshUIAfterCategoryChange() {
    const typedName = document.getElementById("playerName")?.value?.trim();
    if (typedName && this.playerManager.playerExists(typedName)) {
      this.updateLevelCardsForPlayer(typedName);
      this.handlePlayerNameInput(); 
      this.resetLevelCards();
    }
  }

  cleanupCorruptedData() {
    console.log("Checking for corrupted data...");

    try {
      const currentPlayer = this.storage.getLocal("currentPlayer");
      if (currentPlayer && typeof currentPlayer === "string" && currentPlayer.length < 2) {
        console.log("Removing corrupted currentPlayer data:", currentPlayer);
        this.storage.removeLocal("currentPlayer");
      }

      const quizPlayers = this.storage.getLocal("quizPlayers");
      if (quizPlayers && typeof quizPlayers === "string") {
        if (quizPlayers.length < 10 && !quizPlayers.includes("{") && !quizPlayers.includes("[")) {
          console.log("Removing corrupted quizPlayers data:", quizPlayers);
          this.storage.removeLocal("quizPlayers");
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  setupPlayerDetection() {
    const playerNameInput = document.getElementById("playerName");
    if (!playerNameInput) {
      console.warn("playerName input not found");
      return;
    }

    playerNameInput.addEventListener("input", () => this.handlePlayerNameInput());
    playerNameInput.addEventListener("blur", () => setTimeout(() => this.handlePlayerNameInput(), 100));
  }

  // RESUME BUTTON

  setupResumeButton() {
    const resumeBtn = document.getElementById("resumeLastLevelBtn");
    if (!resumeBtn) {
      console.warn("resumeLastLevelBtn not found");
      return;
    }

    resumeBtn.addEventListener("click", () => {
      const playerName = document.getElementById("playerName")?.value.trim();
      if (!playerName || !this.playerManager.playerExists(playerName)) {
        alert("Please enter a valid player name");
        return;
      }

      // FIX: read unlocked level for current category

      const highestLevel = this.playerManager.getHighestUnlockedLevel(playerName, this.currentCategory);

      const player = this.playerManager.getPlayer(playerName);
      const gameMode = player?.gameMode || "normal";
      const modeRadio = document.querySelector(`input[name="gameMode"][value="${gameMode}"]`);
      if (modeRadio) modeRadio.checked = true;

      this.startGameFromLevel(playerName, highestLevel, gameMode);
    });
  }

  checkForCurrentPlayer() {
    try {
      const lastPlayer = this.storage.getLocal("currentPlayer");
      if (lastPlayer && typeof lastPlayer === "string" && lastPlayer.trim().length >= 2) {
        const playerNameInput = document.getElementById("playerName");
        if (playerNameInput) {
          playerNameInput.value = lastPlayer;
          setTimeout(() => this.handlePlayerNameInput(), 100);
        }
      }
    } catch (error) {
      console.error("Error checking for current player:", error);
    }
  }
  //WELCOME BACK + UI 

  handlePlayerNameInput() {
    const playerNameInput = document.getElementById("playerName");
    if (!playerNameInput) return;

    const playerName = playerNameInput.value.trim();
    const playerStatus = document.getElementById("playerStatus");
    const resumeButtonContainer = document.getElementById("resumeButtonContainer");

    if (playerName.length < 2) {
      if (playerStatus) playerStatus.style.display = "none";
      if (resumeButtonContainer) resumeButtonContainer.style.display = "none";
      this.resetLevelCards();
      return;
    }

    if (this.playerManager.playerExists(playerName)) {
      const player = this.playerManager.getPlayer(playerName);
      const highestLevel = this.playerManager.getHighestUnlockedLevel(playerName, this.currentCategory);
      const catProg = player?.progress?.[this.currentCategory];

      if (playerStatus) {
        playerStatus.innerHTML = `
          <div class="returning-player">
            <strong>Welcome back, ${player.name}!</strong><br>
            Category: <strong>${this.currentCategory}</strong><br>
            You have unlocked up to <strong>Level ${highestLevel}</strong>
            ${
              catProg?.totalStars > 0
                ? `<br>${this.currentCategory} Stars: ${catProg.totalStars} ⭐`
                : ""
            }
          </div>
        `;
        playerStatus.style.display = "block";
      }

      if (resumeButtonContainer) {
        resumeButtonContainer.style.display = "block";
        const resumeBtn = document.getElementById("resumeLastLevelBtn");
        if (resumeBtn) {
          resumeBtn.innerHTML = `
            <span class="resume-icon">↻</span>
            Resume ${this.currentCategory} from Level ${highestLevel}
          `;
        }
      }

      this.updateLevelCardsForPlayer(playerName);
      this.highlightResumeLevel(highestLevel);
    } else {
      if (playerStatus) {
        playerStatus.innerHTML = `
          <div class="new-player">
            <strong>New Player Detected</strong><br>
            You will start from Level 1
          </div>
        `;
        playerStatus.style.display = "block";
      }
      if (resumeButtonContainer) resumeButtonContainer.style.display = "none";
      this.resetLevelCards();
    }
  }

// LEVEL CARDS ( stars/unlocks per category)

  updateLevelCardsForPlayer(playerName) {
    const player = this.playerManager.getPlayer(playerName);
    if (!player) {
      this.resetLevelCards();
      return;
    }

    const highestLevel = this.playerManager.getHighestUnlockedLevel(playerName, this.currentCategory);

    for (let level = 1; level <= 5; level++) {
      const levelCard = document.querySelector(`.level-card[data-level="${level}"]`);
      if (!levelCard) continue;

      const levelStars = document.getElementById(`stars-${level}`);
      const levelStatus = levelCard.querySelector(".level-status");
      const startButton = levelCard.querySelector(".start-level-btn");
      if (!levelStatus || !startButton) continue;

      if (level <= highestLevel) {
        levelCard.classList.remove("locked");
        startButton.disabled = false;
        startButton.textContent = `Play Level ${level}`;

        const levelScore = this.playerManager.getLevelScore(playerName, this.currentCategory, level);
        if (levelScore && levelScore.stars > 0) {
          const stars = levelScore.stars || 0;
          if (levelStars) levelStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);

          levelStatus.textContent = `Completed (${stars}★)`;
          levelStatus.className = "level-status completed";
        } else {
          levelStatus.textContent = "Unlocked";
          levelStatus.className = "level-status unlocked";
          if (levelStars) levelStars.textContent = "☆☆☆";
        }
      } else {
        levelCard.classList.add("locked");
        startButton.disabled = true;
        startButton.textContent = "Locked";
        levelStatus.textContent = `Complete Level ${level - 1}`;
        levelStatus.className = "level-status";
        if (levelStars) levelStars.textContent = "☆☆☆";
      }
    }

    this.highlightResumeLevel(highestLevel);
  }

  highlightResumeLevel(level) {
    document.querySelectorAll(".level-card").forEach((card) => card.classList.remove("resume-level"));

    const resumeCard = document.querySelector(`.level-card[data-level="${level}"]`);
    if (resumeCard) {
      resumeCard.classList.add("resume-level");
      const statusEl = resumeCard.querySelector(".level-status");
      if (statusEl && statusEl.textContent.includes("Unlocked")) {
        statusEl.textContent = "Resume Here";
        statusEl.className = "level-status resume-here";
      }
    }
  }

  resetLevelCards() {
    for (let level = 1; level <= 5; level++) {
      const levelCard = document.querySelector(`.level-card[data-level="${level}"]`);
      if (!levelCard) continue;

      const levelStars = document.getElementById(`stars-${level}`);
      const levelStatus = levelCard.querySelector(".level-status");
      const startButton = levelCard.querySelector(".start-level-btn");
      if (!levelStatus || !startButton) continue;

      if (level === 1) {
        levelCard.classList.remove("locked");
        startButton.disabled = false;
        startButton.textContent = "Play Level 1";
        levelStatus.textContent = "Unlocked";
        levelStatus.className = "level-status unlocked";
      } else {
        levelCard.classList.add("locked");
        startButton.disabled = true;
        startButton.textContent = "Locked";
        levelStatus.textContent = `Complete Level ${level - 1}`;
        levelStatus.className = "level-status";
      }

      if (levelStars) levelStars.textContent = "☆☆☆";
    }
  }

  
   //LEADERBOARD TOGGLE

  setupLeaderboardToggle() {
    const toggleBtns = document.querySelectorAll(".toggle-btn");
    const leaderboardContents = document.querySelectorAll(".leaderboard-content");

    if (!toggleBtns.length || !leaderboardContents.length) {
      console.warn("Leaderboard toggle UI not found. Skipping setupLeaderboardToggle().");
      return;
    }

    toggleBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === "normal"));
    leaderboardContents.forEach((content) =>
      content.classList.toggle("active", content.id === "normalLeaderboardContent")
    );

    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode || "normal";

        toggleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        leaderboardContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === `${mode}LeaderboardContent`) content.classList.add("active");
        });

        const filterSelect = document.getElementById("leaderboardCategoryFilter");
        const currentCategory = filterSelect ? filterSelect.value : "all";
        this.loadLeaderboardData(mode, currentCategory);
      });
    });

    setTimeout(() => this.loadLeaderboardData("normal", this.storage.getLocal("leaderboardCategoryFilter") || "all"), 50);
  }

  setupLeaderboardCategoryFilter() {
    const filterSelect = document.getElementById("leaderboardCategoryFilter");
    if (!filterSelect) {
      console.log("Leaderboard category filter element not found, skipping setup");
      return;
    }

    const savedFilter = this.storage.getLocal("leaderboardCategoryFilter");
    filterSelect.value = savedFilter || "all";

    filterSelect.addEventListener("change", (e) => {
      const selectedCategory = e.target.value;
      this.storage.setLocal("leaderboardCategoryFilter", selectedCategory);

      const activeModeBtn = document.querySelector(".toggle-switch .toggle-btn.active");
      const currentMode = activeModeBtn ? activeModeBtn.dataset.mode : "normal";

      this.loadLeaderboardData(currentMode, selectedCategory);
    });
  }

     //GAME MODE TOGGLE

  setupGameModeToggle() {
    const modeRadios = document.querySelectorAll('input[name="gameMode"]');
    if (!modeRadios || modeRadios.length === 0) {
      console.warn('No gameMode inputs found. Add inputs like <input type="radio" name="gameMode" value="normal">');
      return;
    }

    const applyMode = (mode) => {
      this.gameMode = mode || "normal";
      this.isChallengeMode = this.gameMode === "challenge";

      const playerName = document.getElementById("playerName")?.value.trim();
      if (playerName && this.playerManager?.playerExists?.(playerName)) {
        const player = this.playerManager.getPlayer(playerName);
        if (player) {
          player.gameMode = this.gameMode;
          this.playerManager.savePlayers?.();
        }
      }
    };

    const checked = document.querySelector('input[name="gameMode"]:checked');
    applyMode(checked?.value || "normal");

    modeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => applyMode(e.target.value));
    });
  }

   //GAME START

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

    const selectedMode = document.querySelector('input[name="gameMode"]:checked');
    this.gameMode = selectedMode?.value || "normal";
    this.isChallengeMode = this.gameMode === "challenge";

    if (!this.playerManager.playerExists(this.playerName)) {
      this.playerManager.createPlayer(this.playerName, this.gameMode);
    }

    this.playerManager.currentPlayer = this.playerManager.getPlayer(this.playerName);
    this.storage.setLocal("currentPlayer", this.playerName);

    this.currentLevel = level;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;

    const allQuestions = [...(this.questions?.[level] || [])];
    if (allQuestions.length === 0) {
      alert(`No questions found for ${this.currentCategory} - Level ${level}`);
      return;
    }

    this.currentQuestions = this.shuffleArray(allQuestions).slice(0, 10);
    this.startTimer();

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

  startGameFromLevel(playerName, level, gameMode = "normal") {
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) playerNameInput.value = playerName;
    this.playerName = playerName;

    this.gameMode = gameMode;
    this.isChallengeMode = this.gameMode === "challenge";
    const modeRadio = document.querySelector(`input[name="gameMode"][value="${gameMode}"]`);
    if (modeRadio) modeRadio.checked = true;

    if (!this.playerManager.playerExists(this.playerName)) {
      this.playerManager.createPlayer(this.playerName, this.gameMode);
    }

    this.playerManager.currentPlayer = this.playerManager.getPlayer(this.playerName);
    this.storage.setLocal("currentPlayer", this.playerName);

    this.currentLevel = level;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;

    const allQuestions = [...(this.questions?.[level] || [])];
    if (allQuestions.length === 0) {
      alert(`No questions found for ${this.currentCategory} - Level ${level}`);
      return;
    }

    this.currentQuestions = this.shuffleArray(allQuestions).slice(0, 10);
    this.startTimer();

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

  // TIMERS


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

    if (this.questionTimerInterval) clearInterval(this.questionTimerInterval);

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
    let timerDisplay = document.getElementById("questionTimer");

    if (!timerDisplay && this.isChallengeMode) {
      const questionHeader = document.querySelector(".question-header");
      if (questionHeader) {
        timerDisplay = document.createElement("div");
        timerDisplay.id = "questionTimer";
        timerDisplay.className = "challenge-timer";
        timerDisplay.innerHTML = ` <span id="timerValue">${remainingTime}</span>s`;
        questionHeader.appendChild(timerDisplay);
      }
    }

    if (timerDisplay) {
      const timerValue = document.getElementById("timerValue");
      if (timerValue) {
        timerValue.textContent = remainingTime;

        if (remainingTime <= 10) timerValue.classList.add("time-critical");
        else timerValue.classList.remove("time-critical");
      }
    }
  }

  handleTimeUp() {
    if (!this.isChallengeMode) return;

    document.querySelectorAll(".option-btn").forEach((btn) => {
      if (!btn.disabled) {
        btn.disabled = true;
        const question = this.currentQuestions[this.currentQuestionIndex];
        const index = Number.parseInt(btn.dataset.index);
        if (index === question.correct) btn.classList.add("correct");
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

  /* Section nav */
  showSection(sectionId) {
    document.querySelectorAll(".quiz-nav-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.section === sectionId) btn.classList.add("active");
    });

    document.querySelectorAll(".quiz-section").forEach((section) => section.classList.remove("active"));

    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) sectionElement.classList.add("active");

    if (sectionId === "leaderboard") this.displayLeaderboard();
  }

  /* 
     QUESTION DISPLAY / ANSWERS
      */
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
      console.error("Invalid question state", { index: this.currentQuestionIndex, total: this.currentQuestions.length });
      this.showResults();
      return;
    }

    const currentLevelDisplay = document.getElementById("currentLevelDisplay");
    const currentScore = document.getElementById("currentScore");
    const currentStars = document.getElementById("currentStars");

    if (currentLevelDisplay) currentLevelDisplay.textContent = this.currentLevel;
    if (currentScore) currentScore.textContent = this.score;
    if (currentStars) currentStars.textContent = this.totalStars;

    const currentQuestionNum = document.getElementById("currentQuestionNum");
    const totalQuestions = document.getElementById("totalQuestions");
    const questionText = document.getElementById("questionText");

    if (currentQuestionNum) currentQuestionNum.textContent = this.currentQuestionIndex + 1;
    if (totalQuestions) totalQuestions.textContent = this.currentQuestions.length;
    if (questionText) questionText.textContent = question.q;

    const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
    const progressFill = document.getElementById("progressFill");
    if (progressFill) progressFill.style.width = `${progress}%`;

    const validOptions = question.options.filter((opt) => opt && opt.toString().trim() !== "");
    if (validOptions.length === 0) {
      console.error("No valid options for question", question);
      this.showResults();
      return;
    }

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

      optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.selectAnswer(Number.parseInt(btn.dataset.index)));
      });
    }

    const existingTimer = document.getElementById("questionTimer");
    if (existingTimer) existingTimer.remove();

    const feedbackMessage = document.getElementById("feedbackMessage");
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");

    if (feedbackMessage) {
      feedbackMessage.textContent = "";
      feedbackMessage.className = "feedback-message";
    }
    if (nextQuestionBtn) nextQuestionBtn.style.display = "none";

    if (this.isChallengeMode) this.startQuestionTimer();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  selectAnswer(selectedIndex) {
    this.stopQuestionTimer();

    document.querySelectorAll(".option-btn").forEach((btn) => (btn.disabled = true));

    const question = this.currentQuestions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    document.querySelectorAll(".option-btn").forEach((btn) => {
      const index = Number.parseInt(btn.dataset.index);
      if (index === question.correct) btn.classList.add("correct");
      else if (index === selectedIndex && !isCorrect) btn.classList.add("wrong");
    });

    let points = 10;
    let timeBonus = 0;

    if (this.isChallengeMode) {
      const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
      if (isCorrect && elapsed < 10) {
        timeBonus = Math.floor((10 - elapsed) * 0.5);
        points += timeBonus;
      }
    }

    const feedbackEl = document.getElementById("feedbackMessage");
    if (isCorrect) {
      this.score += points;
      this.correctAnswers++;

      if (feedbackEl) {
        feedbackEl.textContent =
          timeBonus > 0 ? `Correct! +${points} points (10 + ${timeBonus} time bonus)` : `Correct! +${points} points`;
        feedbackEl.className = "feedback-message correct";
      }
    } else {
      if (feedbackEl) {
        feedbackEl.textContent = " Wrong answer. The correct answer is highlighted.";
        feedbackEl.className = "feedback-message wrong";
      }
    }

    const currentScore = document.getElementById("currentScore");
    if (currentScore) currentScore.textContent = this.score;

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

/* 
   RESULTS + LEADERBOARD 
    Per-category saving 
    Works for BOTH normal + challenge mode
    Stats update: Total Players / Games Played / Avg Score
   
    */


/* 
   SHOW RESULTS
*/
showResults() {
  this.stopTimer();
  this.stopQuestionTimer();

  const percentage = (this.correctAnswers / this.currentQuestions.length) * 100;
  let stars = 0;
  if (percentage >= 95) stars = 3;
  else if (percentage >= 70) stars = 2;
  else if (percentage >= 60) stars = 1;

  this.totalStars += stars;

  // Ensure gameMode is correct at results time
  this.gameMode = this.isChallengeMode ? "challenge" : (this.gameMode || "normal");

  // Save progress to player manager (PER CATEGORY)
  if (this.playerManager.currentPlayer) {
    const playerName = this.playerManager.currentPlayer.name;
    console.log(
      `Saving progress for ${playerName}: ${this.currentCategory} Level ${this.currentLevel}, Stars: ${stars}, Mode: ${this.gameMode}`
    );

    try {
      this.playerManager.updatePlayerProgress(
        playerName,
        this.currentCategory,
        this.currentLevel,
        this.score,
        stars,
        this.gameMode
      );

      this.updateLevelCardsForPlayer(playerName);

      const updatedPlayer = this.playerManager.getPlayer(playerName);
      const unlocked = this.playerManager.getHighestUnlockedLevel(
        playerName,
        this.currentCategory
      );

      console.log(
        `Player ${playerName} now unlocked up to ${this.currentCategory} level: ${unlocked}`,
        updatedPlayer
      );
    } catch (error) {
      console.error("Error saving player progress:", error);
    }
  }

  // Save to leaderboard (best score per player+mode+category+level)
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
  if (correctAnswers)
    correctAnswers.textContent = `${this.correctAnswers}/${this.currentQuestions.length}`;
  if (levelScore) levelScore.textContent = this.score;
  if (totalStarsDisplay) totalStarsDisplay.textContent = "⭐".repeat(stars) || "No stars";
  if (finalScore) finalScore.textContent = this.score;

  // Pass message
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

  // Refresh leaderboard table + stats (for current mode + category filter)
  this.displayLeaderboard();
}

/* 
   SAVE SCORE TO LEADERBOARD (PER CATEGORY + MODE)
   key = player + mode + category + level
    */
saveScoreToLeaderboard(stars) {
  const savedScores = this.storage.getLocal("quizScores") || [];
  const category = this.currentCategory || "uncategorized";
  const mode = this.gameMode || "normal";

  const existingScore = savedScores.find(
    (s) =>
      s.playerName === this.playerName &&
      s.mode === mode &&
      s.level === this.currentLevel &&
      (s.category || "uncategorized") === category
  );

  const isBetter =
    !existingScore ||
    this.score > existingScore.score ||
    stars > existingScore.stars ||
    (this.score === existingScore.score && this.elapsedTime < existingScore.timeTaken);

  if (!isBetter) return;

  const filteredScores = savedScores.filter(
    (s) =>
      !(
        s.playerName === this.playerName &&
        s.mode === mode &&
        s.level === this.currentLevel &&
        (s.category || "uncategorized") === category
      )
  );

  filteredScores.push({
    playerName: this.playerName,
    mode,
    category,
    level: this.currentLevel,
    score: this.score,
    stars,
    timeTaken: this.elapsedTime,
    date: new Date().toISOString(),
  });

  this.storage.setLocal("quizScores", filteredScores);
}

 //LOAD LEADERBOARD DATA

loadLeaderboardData(mode = "normal", category = "all") {
  console.log(`Loading leaderboard data for mode: ${mode}, category: ${category}`);

  try {
    const savedScores = this.storage.getLocal("quizScores") || [];

    let filteredScores = savedScores.filter((score) => score.mode === mode);

    if (category !== "all") {
      filteredScores = filteredScores.filter(
        (score) => (score.category || "uncategorized") === category
      );
    }

    filteredScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });

    const containerId = `${mode}LeaderboardContent`;
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Leaderboard container ${containerId} not found`);
      return;
    }

    container.innerHTML = "";

    if (filteredScores.length === 0) {
      container.innerHTML = `
        <div class="empty-leaderboard">
          <p>No scores yet for ${mode} mode${category !== "all" ? ` in ${category}` : ""}!</p>
          <p>Be the first to play and set a record!</p>
        </div>
      `;
      return;
    }

    const topScores = filteredScores.slice(0, 10);

    const table = document.createElement("table");
    table.className = "leaderboard-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Category</th>
          <th>Level</th>
          <th>Score</th>
          <th>Stars</th>
          <th>Time</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${topScores
          .map(
            (score, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="player-name">${this.escapeHtml(score.playerName)}</td>
            <td>${score.category || "Unknown"}</td>
            <td>${score.level}</td>
            <td class="score-value">${score.score}</td>
            <td class="stars">${"⭐".repeat(score.stars)}</td>
            <td>${this.formatTime(score.timeTaken)}</td>
            <td>${new Date(score.date).toLocaleDateString()}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    `;

    container.appendChild(table);

    this.displayLevelLeaderboards(mode, filteredScores, container);
  } catch (error) {
    console.error("Error loading leaderboard data:", error);
    const containerId = `${mode}LeaderboardContent`;
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="leaderboard-error">
          <p>Error loading leaderboard data. Please try again.</p>
        </div>
      `;
    }
  }
}

 //  LEVEL LEADERBOARDS

displayLevelLeaderboards(mode, filteredScores, container) {
  const scoresByLevel = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  filteredScores.forEach((score) => {
    if (score.level >= 1 && score.level <= 5) {
      scoresByLevel[score.level].push(score);
    }
  });

  for (let level = 1; level <= 5; level++) {
    const levelScores = scoresByLevel[level];
    if (levelScores.length > 0) {
      const levelSection = document.createElement("div");
      levelSection.className = "level-leaderboard-section";
      levelSection.innerHTML = `
        <h3>Level ${level} - Top Scores</h3>
        <table class="level-leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Stars</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${levelScores
              .slice(0, 5)
              .map(
                (score, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(score.playerName)}</td>
                <td class="score-value">${score.score}</td>
                <td class="stars">${"⭐".repeat(score.stars)}</td>
                <td>${this.formatTime(score.timeTaken)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      container.appendChild(levelSection);
    }
  }
}

/* 
   DISPLAY LEADERBOARD (table + stats)
   */
displayLeaderboard() {
  //  gameMode 
  const selectedRadio = document.querySelector('input[name="gameMode"]:checked');
  const currentMode = selectedRadio ? selectedRadio.value : (this.gameMode || "normal");

  // category filter
  const filterSelect = document.getElementById("leaderboardCategoryFilter");
  const currentCategory = filterSelect ? filterSelect.value : "all";

  this.loadLeaderboardData(currentMode, currentCategory);
  this.updateLeaderboardStats(currentMode, currentCategory);
}

/* 
   LEADERBOARD STATS
  
   - totalPlayers
   - gamesPlayed
   - avgScore
  */
updateLeaderboardStats(mode = "normal", category = "all") {
  const savedScores = this.storage.getLocal("quizScores") || [];

  let scores = savedScores.filter((s) => s.mode === mode);

  if (category !== "all") {
    scores = scores.filter((s) => (s.category || "uncategorized") === category);
  }

  const totalPlayers = new Set(scores.map((s) => s.playerName)).size;
  const gamesPlayed = scores.length;

  const totalScore = scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  const avgScore = gamesPlayed ? Math.round(totalScore / gamesPlayed) : 0;

  const totalPlayersEl = document.getElementById("totalPlayers");
  const gamesPlayedEl = document.getElementById("gamesPlayed");
  const avgScoreEl = document.getElementById("avgScore");

  if (totalPlayersEl) totalPlayersEl.textContent = totalPlayers;
  if (gamesPlayedEl) gamesPlayedEl.textContent = gamesPlayed;
  if (avgScoreEl) avgScoreEl.textContent = avgScore;

  console.log("Leaderboard stats updated:", { mode, category, totalPlayers, gamesPlayed, avgScore });
}



//Reset progress
resetAllProgress() {
  if (confirm("Are you sure you want to reset ALL quiz progress, players, and leaderboard?")) {
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

    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) playerNameInput.value = "";

    this.resetLevelCards();

    const playerStatus = document.getElementById("playerStatus");
    const resumeButtonContainer = document.getElementById("resumeButtonContainer");
    if (playerStatus) playerStatus.style.display = "none";
    if (resumeButtonContainer) resumeButtonContainer.style.display = "none";

    this.displayLeaderboard();

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


  const cvTextArea =
    document.getElementById("editCvEducation") || document.getElementById("editCvText");

  const CV_TEXT_KEY = "cvTextPlain_v2";

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
  }

  
  function formatPlainTextAsParagraphs(text) {
    const safe = escapeHtml(text);

    // Split by blank lines into paragraphs, keep single newlines as <br>
    const paragraphs = safe.split(/\n\s*\n/);

    return paragraphs
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function defaultCvText() {
    return `Education:
Computer Science - University for Creative Arts

Skills:
HTML, CSS, JavaScript, AI, Python, Git

Experience:
Add your work experience here...`;
  }

  function renderCv(text) {
    if (!cvContent) return;
    cvContent.innerHTML = formatPlainTextAsParagraphs(text);
  }

  function loadCv() {
    const saved = storage.getLocal(CV_TEXT_KEY);
    const text = String(saved ?? "").trim() ? saved : defaultCvText();

    storage.setLocal(CV_TEXT_KEY, text); 

    if (cvTextArea) cvTextArea.value = text;
    renderCv(text);
  }

  // Open edit CV modal 
  if (editCvBtn && editCvModal) {
    editCvBtn.addEventListener("click", () => {
      const saved = storage.getLocal(CV_TEXT_KEY);
      const text = String(saved ?? "").trim() ? saved : defaultCvText();
      if (cvTextArea) cvTextArea.value = text;
      editCvModal.style.display = "block";
    });
  }

  // Save CV 
  if (editCvForm && editCvModal) {
    editCvForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newText = String(cvTextArea?.value || "").trim();
      if (!newText) {
        alert("Please write your CV content.");
        return;
      }

      storage.setLocal(CV_TEXT_KEY, newText);
      renderCv(newText);

      editCvModal.style.display = "none";
      alert("CV content updated successfully!");
    });
  }

  try {
    if (typeof storage.removeLocal === "function") storage.removeLocal("cvContent");
  } catch (_) {}

  // Load on page load
  loadCv();

  // CV File Upload 
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
