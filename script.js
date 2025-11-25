// Journal Manager - Handles journal entries with form validation
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
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      timestamp: new Date().toISOString(),
      dateString: new Date().toLocaleString(),
    }

    // Validate required fields
    if (!entry.title || !entry.content) {
      alert("Please fill in all required fields.")
      return
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
        return
      }

      if (this.journalEmptyState) this.journalEmptyState.style.display = "none"

      journals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      if (this.journalEntries) {
        this.journalEntries.innerHTML = journals
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

// Projects Manager - Handles project entries with form validation
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

    // Use basic validation if browserAPIs validation is not available
    const titleInput = document.getElementById("projectTitle")
    const descInput = document.getElementById("projectDescription")

    if (!titleInput || !descInput) return

    const title = titleInput.value.trim()
    const description = descInput.value.trim()

    if (!title || !description) {
      alert("Please fill in all required fields.")
      return
    }

    const project = {
      title: title,
      description: description,
      timestamp: new Date().toISOString(),
      dateString: new Date().toLocaleString(),
    }

    // Handle file upload
    if (this.projectFileInput && this.projectFileInput.files.length > 0) {
      const file = this.projectFileInput.files[0]
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.")
        return
      }

      project.fileName = file.name
      project.fileType = file.type
      project.fileSize = file.size

      // Convert file to base64 for storage
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

  // Method to read file as data URL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  // Method to reset file input
  resetFileInput() {
    if (this.projectFileInput) {
      this.projectFileInput.value = ""
    }
    if (this.projectFileName) {
      this.projectFileName.textContent = "No file chosen"
    }
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
            (project) => `
            <div class="project-card">
              <div class="project-header">
                <h3>${this.escapeHtml(project.title)}</h3>
                <small>${project.dateString}</small>
              </div>
              <p>${this.escapeHtml(project.description)}</p>
              ${project.fileName ? `<p class="project-file"><strong>File:</strong> ${this.escapeHtml(project.fileName)} (${this.formatFileSize(project.fileSize)})</p>` : ""}
            </div>
          `,
          )
          .join("")
      }
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  // Method to format file size
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



// Quiz Game Manager - Handles quiz game functionality (UPDATED)
class QuizGameManager {
    constructor(storage) {
        this.storage = storage;
        this.quizBtn = document.getElementById("quizBtn");
        this.quizModal = document.getElementById("quizModal");
        this.quizCloseBtn = document.getElementById("quizCloseBtn");
        this.quizMenuBtn = document.getElementById("quizMenuBtn");
        this.quizNavMenu = document.getElementById("quizNavMenu");
        
        // Navigation items
        this.navItems = document.querySelectorAll(".nav-item");
        
        // Game elements
        this.rulesSection = document.getElementById("rulesSection");
        this.playerSetup = document.getElementById("playerSetup");
        this.levelSelection = document.getElementById("levelSelection");
        this.gameArea = document.getElementById("gameArea");
        this.resultsArea = document.getElementById("resultsArea");
        this.leaderboard = document.getElementById("leaderboard");
        
        // Inputs and buttons
        this.playerNameInput = document.getElementById("playerName");
        this.startGameBtn = document.getElementById("startGameBtn");
        this.levelButtons = document.querySelectorAll(".level-btn");
        this.nextQuestionBtn = document.getElementById("nextQuestionBtn");
        this.endGameBtn = document.getElementById("endGameBtn");
        this.playAgainBtn = document.getElementById("playAgainBtn");
        this.resetScoresBtn = document.getElementById("resetScoresBtn");
        this.viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
        this.backToMenuBtn = document.getElementById("backToMenuBtn");
        
        // Display elements
        this.currentPlayerName = document.getElementById("currentPlayerName");
        this.currentLevel = document.getElementById("currentLevel");
        this.currentScore = document.getElementById("currentScore");
        this.timerDisplay = document.getElementById("timer");
        this.progressFill = document.getElementById("progressFill");
        this.questionText = document.getElementById("questionText");
        this.optionsContainer = document.getElementById("optionsContainer");
        this.currentQuestionNum = document.getElementById("currentQuestionNum");
        this.totalQuestions = document.getElementById("totalQuestions");
        this.resultPlayerName = document.getElementById("resultPlayerName");
        this.resultLevel = document.getElementById("resultLevel");
        this.finalScore = document.getElementById("finalScore");
        this.highScoreMessage = document.getElementById("highScoreMessage");
        this.leaderboardContent = document.getElementById("leaderboardContent");
        this.nameError = document.getElementById("nameError");
        
        // Game state
        this.currentPlayer = "";
        this.currentDifficulty = "";
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.timer = null;
        this.timeLeft = 60;
        this.totalTime = 60;
        
        // Quiz questions by difficulty (keep your existing questions array)
        this.questions = {
            easy: [
                {
                    question: "What does HTML stand for?",
                    options: [
                        "Hyper Text Markup Language",
                        "High Tech Modern Language",
                        "Hyper Transfer Markup Language",
                        "Home Tool Markup Language"
                    ],
                    correct: 0
                },
                {
                    question: "Which language is used for styling web pages?",
                    options: ["HTML", "JavaScript", "CSS", "Python"],
                    correct: 2
                },
                {
                    question: "What is the latest version of HTML?",
                    options: ["HTML4", "XHTML", "HTML5", "HTML2023"],
                    correct: 2
                },
                {
                    question: "Which tag is used to create a hyperlink?",
                    options: ["<link>", "<a>", "<href>", "<hyperlink>"],
                    correct: 1
                },
                {
                    question: "What does CSS stand for?",
                    options: [
                        "Computer Style Sheets",
                        "Creative Style System",
                        "Cascading Style Sheets",
                        "Colorful Style Sheets"
                    ],
                    correct: 2
                }
            ],
            medium: [
                {
                    question: "Which symbol is used for comments in JavaScript?",
                    options: ["//", "<!-- -->", "**", "%%"],
                    correct: 0
                },
                {
                    question: "Which method adds an element to the end of an array?",
                    options: ["push()", "pop()", "shift()", "unshift()"],
                    correct: 0
                },
                {
                    question: "What is the result of 2 + '2' in JavaScript?",
                    options: ["4", "22", "NaN", "Error"],
                    correct: 1
                },
                {
                    question: "Which HTML5 element is used for drawing graphics?",
                    options: ["<graphic>", "<canvas>", "<draw>", "<svg>"],
                    correct: 1
                },
                {
                    question: "What does API stand for?",
                    options: [
                        "Application Programming Interface",
                        "Advanced Programming Instruction",
                        "Automated Program Integration",
                        "Application Process Integration"
                    ],
                    correct: 0
                }
            ],
            hard: [
                {
                    question: "What is the time complexity of binary search?",
                    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                    correct: 1
                },
                {
                    question: "Which is NOT a JavaScript framework?",
                    options: ["React", "Vue", "Angular", "Flask"],
                    correct: 3
                },
                {
                    question: "What is a closure in JavaScript?",
                    options: [
                        "A function that has access to its outer function's scope",
                        "A way to close a browser window",
                        "A method to end a program",
                        "A type of loop"
                    ],
                    correct: 0
                },
                {
                    question: "Which HTTP status code means 'Not Found'?",
                    options: ["200", "301", "404", "500"],
                    correct: 2
                },
                {
                    question: "What is the purpose of the 'virtual DOM' in React?",
                    options: [
                        "To improve rendering performance",
                        "To create 3D effects",
                        "To handle virtual reality",
                        "To manage server-side rendering"
                    ],
                    correct: 0
                }
            ]
        };

        this.init();
    }

    init() {
        // Event listeners for navigation with null checks
        if (this.quizMenuBtn) {
            this.quizMenuBtn.addEventListener("click", () => this.toggleNavMenu());
        }
        if (this.quizCloseBtn) {
            this.quizCloseBtn.addEventListener("click", () => this.closeModal());
        }
        
        // Fix: Use proper event delegation for nav items
        this.navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-target') || item.dataset.section;
                if (section) {
                    this.showSection(section);
                }
                // Close nav menu on mobile after selection
                if (window.innerWidth <= 768 && this.quizNavMenu) {
                    this.quizNavMenu.classList.remove("active");
                }
            });
        });

        // Game event listeners with null checks
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener("click", () => this.startGameSetup());
        }
        
        this.levelButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const level = btn.getAttribute('data-level') || btn.dataset.level;
                if (level) {
                    this.selectLevel(level);
                }
            });
        });
        
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.addEventListener("click", () => this.nextQuestion());
        }
        if (this.endGameBtn) {
            this.endGameBtn.addEventListener("click", () => this.endGame());
        }
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener("click", () => this.resetGame());
        }
        if (this.viewLeaderboardBtn) {
            this.viewLeaderboardBtn.addEventListener("click", () => this.showSection('leaderboard'));
        }
        if (this.backToMenuBtn) {
            this.backToMenuBtn.addEventListener("click", () => this.showSection('rulesSection'));
        }
        if (this.resetScoresBtn) {
            this.resetScoresBtn.addEventListener("click", () => this.resetLeaderboard());
        }

        // Input validation
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener("input", () => this.validateName());
        }
        
        this.loadLeaderboard();
    }

    // FIXED: Modal methods to work with new CSS
    openModal() {
        if (this.quizModal) {
            // Use class-based activation instead of style manipulation
            this.quizModal.classList.add("active");
            document.body.classList.add("modal-open");
            this.showSection('playerSetup'); // Start with player setup
            this.resetGame();
        }
    }

    closeModal() {
        if (this.quizModal) {
            this.quizModal.classList.remove("active");
            document.body.classList.remove("modal-open");
            this.resetGame();
        }
    }

    toggleNavMenu() {
        if (this.quizNavMenu) {
            this.quizNavMenu.classList.toggle("active");
        }
    }

    // FIXED: Section display logic
    showSection(sectionName) {
        console.log(`Showing section: ${sectionName}`); // Debug log
        
        // Hide all quiz sections
        const sections = document.querySelectorAll('.quiz-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error(`Section not found: ${sectionName}`);
        }
        
        // Update active nav item
        this.navItems.forEach(item => {
            const itemSection = item.getAttribute('data-target') || item.dataset.section;
            if (itemSection === sectionName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    validateName() {
        if (!this.playerNameInput) return false;
        
        const name = this.playerNameInput.value.trim();
        if (name.length < 2) {
            if (this.nameError) {
                this.nameError.textContent = "Name must be at least 2 characters long";
                this.nameError.style.display = "block";
            }
            return false;
        } else {
            if (this.nameError) {
                this.nameError.style.display = "none";
            }
            return true;
        }
    }

    startGameSetup() {
        if (!this.playerNameInput) return;
        
        const playerName = this.playerNameInput.value.trim();
        
        if (!this.validateName()) {
            alert("Please enter a valid name (at least 2 characters)!");
            return;
        }
        
        this.currentPlayer = playerName;
        this.showSection('levelSelection');
    }

    selectLevel(level) {
        this.currentDifficulty = level;
        this.showSection('gameArea');
        
        if (this.currentPlayerName) {
            this.currentPlayerName.textContent = this.currentPlayer;
        }
        if (this.currentLevel) {
            this.currentLevel.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }
        if (this.currentScore) {
            this.currentScore.textContent = "0";
        }
        
        // Set total questions
        if (this.totalQuestions) {
            this.totalQuestions.textContent = this.questions[level].length;
        }
        
        this.startGame();
    }

    startGame() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.timeLeft = this.totalTime;
        
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.timeLeft;
        }
        if (this.progressFill) {
            this.progressFill.style.width = '100%';
        }
        
        this.startTimer();
        this.showQuestion();
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            
            if (this.timerDisplay) {
                this.timerDisplay.textContent = this.timeLeft;
            }
            
            // Update progress bar
            const progressPercent = (this.timeLeft / this.totalTime) * 100;
            if (this.progressFill) {
                this.progressFill.style.width = `${progressPercent}%`;
                
                // Change color when time is running out
                if (this.timeLeft <= 10) {
                    this.progressFill.style.background = '#ef4444';
                } else if (this.timeLeft <= 30) {
                    this.progressFill.style.background = '#f59e0b';
                } else {
                    this.progressFill.style.background = '#10b981';
                }
            }
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.endGame();
            }
        }, 1000);
    }

    showQuestion() {
        const questions = this.questions[this.currentDifficulty];
        if (this.currentQuestionIndex >= questions.length) {
            this.endGame();
            return;
        }
        
        const question = questions[this.currentQuestionIndex];
        
        if (this.currentQuestionNum) {
            this.currentQuestionNum.textContent = this.currentQuestionIndex + 1;
        }
        if (this.questionText) {
            this.questionText.textContent = question.question;
        }
        
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = "";
            question.options.forEach((option, index) => {
                const button = document.createElement("button");
                button.className = "option-btn";
                button.innerHTML = `
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option}</span>
                `;
                button.addEventListener("click", () => this.checkAnswer(index));
                this.optionsContainer.appendChild(button);
            });
        }
        
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.style.display = "none";
        }
    }

    checkAnswer(selectedIndex) {
        const questions = this.questions[this.currentDifficulty];
        const question = questions[this.currentQuestionIndex];
        const optionButtons = this.optionsContainer.querySelectorAll(".option-btn");
        
        // Disable all buttons
        optionButtons.forEach(btn => btn.disabled = true);
        
        // Highlight correct and wrong answers
        optionButtons.forEach((btn, index) => {
            if (index === question.correct) {
                btn.classList.add("correct");
            } else if (index === selectedIndex && index !== question.correct) {
                btn.classList.add("wrong");
            }
        });
        
        // Update score
        if (selectedIndex === question.correct) {
            this.score += this.currentDifficulty === "easy" ? 10 : 
                         this.currentDifficulty === "medium" ? 20 : 30;
            if (this.currentScore) {
                this.currentScore.textContent = this.score;
            }
        }
        
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.style.display = "block";
        }
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.showQuestion();
    }

    endGame() {
        clearInterval(this.timer);
        this.showSection('resultsArea');
        
        if (this.resultPlayerName) {
            this.resultPlayerName.textContent = this.currentPlayer;
        }
        if (this.resultLevel) {
            this.resultLevel.textContent = this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
        }
        if (this.finalScore) {
            this.finalScore.textContent = this.score;
        }
        
        this.updateLeaderboard();
    }

    resetGame() {
        this.showSection('playerSetup');
        if (this.playerNameInput) {
            this.playerNameInput.value = "";
        }
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.timeLeft = this.totalTime;
        
        clearInterval(this.timer);
        if (this.nameError) {
            this.nameError.textContent = "";
            this.nameError.style.display = "none";
        }
    }

    updateLeaderboard() {
        const leaderboard = this.storage.getLocal("quizLeaderboard") || [];
        const newScore = {
            player: this.currentPlayer,
            score: this.score,
            level: this.currentDifficulty,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().getTime()
        };
        
        leaderboard.push(newScore);
        
        // Sort by score descending and keep top 10
        leaderboard.sort((a, b) => b.score - a.score);
        const topLeaderboard = leaderboard.slice(0, 10);
        
        this.storage.setLocal("quizLeaderboard", topLeaderboard);
        this.loadLeaderboard();
        
        // Check if this is a high score
        const topScore = topLeaderboard[0];
        if (this.highScoreMessage) {
            if (topScore && topScore.player === this.currentPlayer && topScore.score === this.score) {
                this.highScoreMessage.innerHTML = "🎉 <strong>New High Score!</strong> 🎉";
                this.highScoreMessage.className = "high-score-message success";
            } else {
                this.highScoreMessage.innerHTML = "Great effort! Try again to beat the high score!";
                this.highScoreMessage.className = "high-score-message";
            }
        }
    }

    loadLeaderboard() {
        const leaderboard = this.storage.getLocal("quizLeaderboard") || [];
        
        if (!this.leaderboardContent) return;
        
        if (leaderboard.length === 0) {
            this.leaderboardContent.innerHTML = `
                <div class="empty-leaderboard">
                    <p>🏆 No scores yet!</p>
                    <p>Be the first to play and claim the top spot!</p>
                </div>
            `;
            return;
        }
        
        this.leaderboardContent.innerHTML = leaderboard
            .map((entry, index) => `
                <div class="leaderboard-entry ${index === 0 ? 'top-score' : ''} ${index < 3 ? 'podium' : ''}">
                    <span class="rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <span class="player">${this.escapeHtml(entry.player)}</span>
                    <span class="score">${entry.score} pts</span>
                    <span class="level ${entry.level}">${entry.level}</span>
                    <span class="date">${entry.date}</span>
                </div>
            `)
            .join("");
    }

    resetLeaderboard() {
        if (confirm("Are you sure you want to reset all scores? This cannot be undone.")) {
            this.storage.removeLocal("quizLeaderboard");
            this.loadLeaderboard();
            alert("All scores have been reset!");
        }
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

// FIXED: Modal system setup - Update quiz modal handling
function setupModalSystem(managers = {}) {
  const modals = document.querySelectorAll(".modal")

  // Close buttons inside modals
  document.querySelectorAll(".close-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal")
      if (modal) {
        // Handle quiz modal differently
        if (modal.id === "quizModal" && managers.quizManager) {
          managers.quizManager.closeModal();
        } else {
          modal.style.display = "none"
        }
      }
    })
  })

  // Click outside to close
  window.addEventListener("click", (event) => {
    modals.forEach((modal) => {
      if (event.target === modal) {
        // Handle quiz modal differently
        if (modal.id === "quizModal" && managers.quizManager) {
          managers.quizManager.closeModal();
        } else {
          modal.style.display = "none"
        }
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
    console.log("Profile pic button found, attaching click handler")

    editProfilePicBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Profile pic button clicked, triggering file input")
      profilePicInput.click()
    })

    profilePicInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          profileImage.src = event.target.result
          storage.setLocal("profilePicture", event.target.result)
          console.log("Profile picture updated")
        }
        reader.onerror = (error) => {
          console.error("Error reading profile picture:", error)
          alert("Error reading the image file. Please try again.")
        }
        reader.readAsDataURL(file)
      } else {
        alert("Please select a valid image file")
      }
    })

    const savedProfilePic = storage.getLocal("profilePicture")
    if (savedProfilePic) {
      profileImage.src = savedProfilePic
      console.log("Profile picture loaded from storage")
    }
  } else {
    console.error("Profile picture elements not found!")
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
        reader.onerror = (error) => {
          console.error("Error reading about file:", error)
          alert("Error reading the file. Please try again.")
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
        reader.onerror = (error) => {
          console.error("Error reading CV file:", error)
          alert("Error reading the CV file. Please try again.")
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
      console.log("CV deleted")
    }
  })

  const savedCv = storage.getLocal("cvContent")
  if (savedCv && cvContent) cvContent.innerHTML = savedCv

  const savedCvFile = storage.getLocal("cvFileName")
  if (savedCvFile) {
    if (cvFileName) cvFileName.textContent = savedCvFile
    if (cvFileDisplay) cvFileDisplay.style.display = "block"
  }

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

  try {
    const storage = new StorageManager()
    const browserAPIs = new window.BrowserAPIsManager(storage)
    
    // Remove YouTubeManager reference if it doesn't exist
    const journalManager = new JournalManager(storage, browserAPIs)
    const projectsManager = new ProjectsManager(storage, browserAPIs)
    const quizManager = new QuizGameManager(storage)

    // Provide validation manager to journal
    if (browserAPIs && typeof journalManager.setValidationManager === "function") {
      journalManager.setValidationManager(browserAPIs)
    }

    // Start everything
    startPageDateTime()
    setupModalSystem({ journalManager, projectsManager, quizManager })
    initializeOtherModals(storage)

    console.log("Learning Journal initialized successfully")
  } catch (error) {
    console.error("Error initializing Learning Journal:", error)
  }
})