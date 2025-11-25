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

    // ADDED: File upload elements
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
    // ADDED: File upload event listeners
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
    // ADDED: Handle file upload
    if (this.projectFileInput && this.projectFileInput.files.length > 0) {
      const file = this.projectFileInput.files[0]
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

  // ADDED: Method to read file as data URL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  // ADDED: Method to reset file input
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

  // ADDED: Method to format file size
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


// Quiz Game Functionality
class QuizGame {
    constructor(storage) {
        this.storage = storage;
        this.questions = {
            easy: [],
            medium: [],
            hard: []
        };
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.selectedDifficulty = 'easy';
        this.leaderboard = this.loadLeaderboard();
        this.startTime = null;
        this.totalTime = 0;
        
        this.initializeQuizData();
        this.bindQuizEvents();
    }
    
    initializeQuizData() {
        // Easy questions
        this.questions.easy = [
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
                options: [
                    "HTML",
                    "JavaScript",
                    "CSS",
                    "Python"
                ],
                correct: 2
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
            },
            {
                question: "Which tag is used to create a hyperlink in HTML?",
                options: [
                    "<link>",
                    "<a>",
                    "<href>",
                    "<hyperlink>"
                ],
                correct: 1
            },
            {
                question: "Which property is used to change the background color in CSS?",
                options: [
                    "color",
                    "bgcolor",
                    "background-color",
                    "background"
                ],
                correct: 2
            },
            {
                question: "What is the correct way to comment in JavaScript?",
                options: [
                    "// This is a comment",
                    "<!-- This is a comment -->",
                    "/* This is a comment */",
                    "Both 1 and 3"
                ],
                correct: 3
            },
            {
                question: "Which symbol is used for single-line comments in JavaScript?",
                options: [
                    "//",
                    "#",
                    "/*",
                    "--"
                ],
                correct: 0
            },
            {
                question: "What does DOM stand for?",
                options: [
                    "Document Object Model",
                    "Digital Object Management",
                    "Desktop Object Model",
                    "Data Object Model"
                ],
                correct: 0
            },
            {
                question: "Which method is used to output data in JavaScript?",
                options: [
                    "print()",
                    "console.log()",
                    "output()",
                    "display()"
                ],
                correct: 1
            },
            {
                question: "Which HTML tag is used for the largest heading?",
                options: [
                    "<h6>",
                    "<heading>",
                    "<h1>",
                    "<head>"
                ],
                correct: 2
            }
        ];
        
        // Medium questions
        this.questions.medium = [
            {
                question: "What is the purpose of the 'this' keyword in JavaScript?",
                options: [
                    "Refers to the current object",
                    "Refers to the parent object",
                    "Refers to the global object",
                    "Refers to the previous object"
                ],
                correct: 0
            },
            {
                question: "What does API stand for?",
                options: [
                    "Application Programming Interface",
                    "Advanced Programming Interface",
                    "Application Protocol Interface",
                    "Automated Programming Interface"
                ],
                correct: 0
            },
            {
                question: "Which CSS property is used to control the space between elements?",
                options: [
                    "spacing",
                    "margin",
                    "padding",
                    "Both 2 and 3"
                ],
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
                question: "Which method is used to add an element to the end of an array?",
                options: [
                    "push()",
                    "append()",
                    "addToEnd()",
                    "insert()"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of media queries in CSS?",
                options: [
                    "To apply styles based on device characteristics",
                    "To query media files",
                    "To create animations",
                    "To optimize images"
                ],
                correct: 0
            },
            {
                question: "What does JSON stand for?",
                options: [
                    "JavaScript Object Notation",
                    "Java Standard Object Notation",
                    "JavaScript Oriented Notation",
                    "Java Simple Object Notation"
                ],
                correct: 0
            },
            {
                question: "Which HTML5 element is used for drawing graphics?",
                options: [
                    "<draw>",
                    "<canvas>",
                    "<graphic>",
                    "<svg>"
                ],
                correct: 1
            },
            {
                question: "What is event bubbling in JavaScript?",
                options: [
                    "When an event starts from the target element and bubbles up to the root",
                    "When multiple events occur simultaneously",
                    "When an event creates visual effects",
                    "When events are cancelled"
                ],
                correct: 0
            },
            {
                question: "Which CSS property is used to create rounded corners?",
                options: [
                    "border-radius",
                    "corner-radius",
                    "rounded-corners",
                    "border-round"
                ],
                correct: 0
            }
        ];
        
        // Hard questions
        this.questions.hard = [
            {
                question: "What is the time complexity of accessing an element in an array by index?",
                options: [
                    "O(1)",
                    "O(n)",
                    "O(log n)",
                    "O(n^2)"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of the 'use strict' directive in JavaScript?",
                options: [
                    "Enforces stricter parsing and error handling",
                    "Improves performance",
                    "Enables new features",
                    "Makes code more readable"
                ],
                correct: 0
            },
            {
                question: "What does the 'box-sizing: border-box' CSS property do?",
                options: [
                    "Includes padding and border in element's total width/height",
                    "Excludes margin from element's total width/height",
                    "Creates a box shadow",
                    "Changes the box model completely"
                ],
                correct: 0
            },
            {
                question: "What is a promise in JavaScript?",
                options: [
                    "An object representing the eventual completion of an asynchronous operation",
                    "A guarantee that code will execute",
                    "A type of variable",
                    "A method to make code faster"
                ],
                correct: 0
            },
            {
                question: "What is the difference between 'let' and 'var' in JavaScript?",
                options: [
                    "'let' has block scope, 'var' has function scope",
                    "'let' is older than 'var'",
                    "'var' is more secure than 'let'",
                    "There is no difference"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of the 'fetch' API in JavaScript?",
                options: [
                    "To make HTTP requests",
                    "To retrieve data from local storage",
                    "To fetch CSS files",
                    "To get user input"
                ],
                correct: 0
            },
            {
                question: "What is the CSS Grid layout system used for?",
                options: [
                    "Creating two-dimensional layouts",
                    "Creating one-dimensional layouts",
                    "Creating table-like structures",
                    "Creating responsive images"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of the 'async' and 'await' keywords in JavaScript?",
                options: [
                    "To write asynchronous code in a synchronous manner",
                    "To make code execute faster",
                    "To create animations",
                    "To handle errors"
                ],
                correct: 0
            },
            {
                question: "What is the difference between '==' and '===' in JavaScript?",
                options: [
                    "'==' checks value, '===' checks value and type",
                    "'===' is faster than '=='",
                    "'==' is newer than '==='",
                    "There is no difference"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of the 'virtual DOM' in React?",
                options: [
                    "To improve performance by minimizing direct DOM manipulation",
                    "To create virtual reality experiences",
                    "To simulate DOM elements",
                    "To test DOM operations"
                ],
                correct: 0
            }
        ];
    }
    
    bindQuizEvents() {
        // Quiz modal open
        const quizBtn = document.getElementById('quizBtn');
        if (quizBtn) {
            quizBtn.addEventListener('click', () => {
                this.showSection('quizMenu');
            });
        }
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedDifficulty = e.target.dataset.level;
            });
        });
        
        // Start quiz
        const startQuizBtn = document.getElementById('startQuizBtn');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => {
                this.startQuiz();
            });
        }
        
        // Show rules
        const quizSettingsBtn = document.getElementById('quizSettingsBtn');
        if (quizSettingsBtn) {
            quizSettingsBtn.addEventListener('click', () => {
                this.showSection('quizRules');
            });
        }
        
        // Back to menu from rules
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.showSection('quizMenu');
            });
        }
        
        // Show leaderboard
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }
        
        // Back to menu from leaderboard
        const backToMenuFromLeaderboardBtn = document.getElementById('backToMenuFromLeaderboardBtn');
        if (backToMenuFromLeaderboardBtn) {
            backToMenuFromLeaderboardBtn.addEventListener('click', () => {
                this.showSection('quizMenu');
            });
        }
        
        // Answer selection
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectAnswer(parseInt(e.target.dataset.index));
            });
        });
        
        // Next question
        const nextQuestionBtn = document.getElementById('nextQuestionBtn');
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }
        
        // End quiz
        const endQuizBtn = document.getElementById('endQuizBtn');
        if (endQuizBtn) {
            endQuizBtn.addEventListener('click', () => {
                this.endQuiz();
            });
        }
        
        // Play again
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.showSection('quizMenu');
            });
        }
        
        // Back to menu from results
        const backToMenuFromResultsBtn = document.getElementById('backToMenuFromResultsBtn');
        if (backToMenuFromResultsBtn) {
            backToMenuFromResultsBtn.addEventListener('click', () => {
                this.showSection('quizMenu');
            });
        }
        
        // Leaderboard tabs
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.leaderboard-list').forEach(list => {
                    list.style.display = 'none';
                });
                
                const difficultyList = document.getElementById(`${e.target.dataset.difficulty}Leaderboard`);
                if (difficultyList) {
                    difficultyList.style.display = 'block';
                }
            });
        });
        
        // Reset quiz data
        const resetQuizBtn = document.getElementById('resetQuizBtn');
        if (resetQuizBtn) {
            resetQuizBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all quiz data and leaderboard?')) {
                    this.resetQuizData();
                }
            });
        }
    }
    
    showSection(sectionId) {
        // Hide all sections
        const sections = ['quizMenu', 'quizRules', 'quizGame', 'quizResults', 'quizLeaderboard'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
    }
    
    startQuiz() {
        this.currentQuestions = [...this.questions[this.selectedDifficulty]];
        this.shuffleArray(this.currentQuestions);
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timeLeft = 15;
        this.startTime = new Date();
        
        // Update UI
        const quizDifficulty = document.getElementById('quizDifficulty');
        const quizScore = document.getElementById('quizScore');
        
        if (quizDifficulty) {
            quizDifficulty.textContent = `Difficulty: ${this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1)}`;
        }
        if (quizScore) {
            quizScore.textContent = `Score: ${this.score}`;
        }
        
        this.showSection('quizGame');
        this.displayQuestion();
        this.startTimer();
    }
    
    displayQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.endQuiz();
            return;
        }
        
        const question = this.currentQuestions[this.currentQuestionIndex];
        
        // Update progress
        const quizProgress = document.getElementById('quizProgress');
        const progressFill = document.getElementById('progressFill');
        
        if (quizProgress) {
            quizProgress.textContent = `Question ${this.currentQuestionIndex + 1}/${this.currentQuestions.length}`;
        }
        if (progressFill) {
            progressFill.style.width = `${((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100}%`;
        }
        
        // Display question
        const questionText = document.getElementById('questionText');
        if (questionText) {
            questionText.textContent = question.question;
        }
        
        // Display options
        const optionButtons = document.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, index) => {
            if (index < question.options.length) {
                btn.textContent = question.options[index];
                btn.classList.remove('correct', 'incorrect');
                btn.disabled = false;
            }
        });
        
        // Reset feedback and controls
        const quizFeedback = document.getElementById('quizFeedback');
        const nextQuestionBtn = document.getElementById('nextQuestionBtn');
        const endQuizBtn = document.getElementById('endQuizBtn');
        
        if (quizFeedback) {
            quizFeedback.textContent = '';
            quizFeedback.className = 'quiz-feedback';
        }
        if (nextQuestionBtn) {
            nextQuestionBtn.style.display = 'none';
        }
        if (endQuizBtn) {
            endQuizBtn.style.display = 'inline-block';
        }
        
        // Reset timer
        this.timeLeft = 15;
        const quizTimer = document.getElementById('quizTimer');
        if (quizTimer) {
            quizTimer.textContent = this.timeLeft;
        }
    }
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            const quizTimer = document.getElementById('quizTimer');
            if (quizTimer) {
                quizTimer.textContent = this.timeLeft;
            }
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.selectAnswer(-1); // Time's up
            }
        }, 1000);
    }
    
    selectAnswer(selectedIndex) {
        clearInterval(this.timer);
        
        const question = this.currentQuestions[this.currentQuestionIndex];
        const optionButtons = document.querySelectorAll('.option-btn');
        const feedback = document.getElementById('quizFeedback');
        const nextQuestionBtn = document.getElementById('nextQuestionBtn');
        const endQuizBtn = document.getElementById('endQuizBtn');
        const quizScore = document.getElementById('quizScore');
        
        // Disable all buttons
        optionButtons.forEach(btn => {
            btn.disabled = true;
        });
        
        // Show correct answer
        if (question.correct < optionButtons.length) {
            optionButtons[question.correct].classList.add('correct');
        }
        
        // Check if answer is correct
        if (selectedIndex === question.correct) {
            // Calculate points based on difficulty
            let points = 1;
            if (this.selectedDifficulty === 'medium') points = 2;
            if (this.selectedDifficulty === 'hard') points = 3;
            
            this.score += points;
            if (quizScore) {
                quizScore.textContent = `Score: ${this.score}`;
            }
            
            if (feedback) {
                feedback.textContent = `Correct! +${points} points`;
                feedback.className = 'quiz-feedback correct';
            }
        } else {
            if (selectedIndex === -1) {
                if (feedback) {
                    feedback.textContent = "Time's up!";
                }
            } else {
                if (selectedIndex < optionButtons.length) {
                    optionButtons[selectedIndex].classList.add('incorrect');
                }
                if (feedback) {
                    feedback.textContent = "Incorrect!";
                }
            }
            if (feedback) {
                feedback.className = 'quiz-feedback incorrect';
            }
        }
        
        // Show next question button
        if (nextQuestionBtn) {
            nextQuestionBtn.style.display = 'inline-block';
        }
        if (endQuizBtn) {
            endQuizBtn.style.display = 'none';
        }
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        this.displayQuestion();
        this.startTimer();
    }
    
    endQuiz() {
        clearInterval(this.timer);
        
        // Calculate total time
        if (this.startTime) {
            this.totalTime = Math.floor((new Date() - this.startTime) / 1000);
        }
        
        // Calculate max possible score
        let maxScore = this.currentQuestions.length;
        if (this.selectedDifficulty === 'medium') maxScore *= 2;
        if (this.selectedDifficulty === 'hard') maxScore *= 3;
        
        // Calculate percentage
        const percentage = Math.round((this.score / maxScore) * 100);
        
        // Update results
        const resultDifficulty = document.getElementById('resultDifficulty');
        const resultScore = document.getElementById('resultScore');
        const resultMaxScore = document.getElementById('resultMaxScore');
        const resultPercentage = document.getElementById('resultPercentage');
        const resultTime = document.getElementById('resultTime');
        
        if (resultDifficulty) {
            resultDifficulty.textContent = this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1);
        }
        if (resultScore) {
            resultScore.textContent = this.score;
        }
        if (resultMaxScore) {
            resultMaxScore.textContent = maxScore;
        }
        if (resultPercentage) {
            resultPercentage.textContent = `${percentage}%`;
        }
        if (resultTime) {
            resultTime.textContent = this.totalTime;
        }
        
        // Save to leaderboard if score > 0
        if (this.score > 0) {
            this.saveToLeaderboard(this.score, percentage);
        }
        
        this.showSection('quizResults');
    }
    
    saveToLeaderboard(score, percentage) {
        const entry = {
            score: score,
            percentage: percentage,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toISOString()
        };
        
        if (!this.leaderboard[this.selectedDifficulty]) {
            this.leaderboard[this.selectedDifficulty] = [];
        }
        
        this.leaderboard[this.selectedDifficulty].push(entry);
        
        // Sort by score (descending)
        this.leaderboard[this.selectedDifficulty].sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (this.leaderboard[this.selectedDifficulty].length > 10) {
            this.leaderboard[this.selectedDifficulty] = this.leaderboard[this.selectedDifficulty].slice(0, 10);
        }
        
        this.saveLeaderboard();
    }
    
    showLeaderboard() {
        // Update each leaderboard list
        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const listElement = document.getElementById(`${difficulty}Leaderboard`);
            
            if (!listElement) return;
            
            if (!this.leaderboard[difficulty] || this.leaderboard[difficulty].length === 0) {
                listElement.innerHTML = '<p>No scores yet. Be the first!</p>';
                return;
            }
            
            let html = '';
            this.leaderboard[difficulty].forEach((entry, index) => {
                html += `
                    <div class="leaderboard-item">
                        <span class="leaderboard-rank">${index + 1}.</span>
                        <span class="leaderboard-score">${entry.score} points (${entry.percentage}%)</span>
                        <span class="leaderboard-date">${entry.date} ${entry.time}</span>
                    </div>
                `;
            });
            
            listElement.innerHTML = html;
        });
        
        this.showSection('quizLeaderboard');
    }
    
    loadLeaderboard() {
        if (this.storage) {
            const saved = this.storage.getLocal('quizLeaderboard');
            return saved ? saved : {
                easy: [],
                medium: [],
                hard: []
            };
        }
        return {
            easy: [],
            medium: [],
            hard: []
        };
    }
    
    saveLeaderboard() {
        if (this.storage) {
            this.storage.setLocal('quizLeaderboard', this.leaderboard);
        }
    }
    
    resetQuizData() {
        this.leaderboard = {
            easy: [],
            medium: [],
            hard: []
        };
        this.saveLeaderboard();
        this.showLeaderboard();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Update the modal system to include quiz
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
                managers.quizGame &&
                typeof managers.quizGame.showSection === "function"
            ) {
                modal.style.display = "block"
                managers.quizGame.showSection('quizMenu')
                updateDateTime("quizDatetime")
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
                managers.quizGame &&
                typeof managers.quizGame.showSection === "function"
            ) {
                modal.style.display = "block"
                managers.quizGame.showSection('quizMenu')
                updateDateTime("quizDatetime")
            } else {
                modal.style.display = "block"
                updateDateTime(modalId.replace("Modal", "Datetime"))
            }
        })
    })
}

// Update the main initialization to include quiz
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
    const youtubeManager = typeof window.YouTubeManager !== "undefined" ? new window.YouTubeManager(storage) : null
    const journalManager = new JournalManager(storage, browserAPIs)
    const projectsManager = new ProjectsManager(storage, browserAPIs)
    const quizGame = new QuizGame(storage)

    // Provide validation manager to journal
    if (browserAPIs && typeof journalManager.setValidationManager === "function") {
        journalManager.setValidationManager(browserAPIs)
    }

    // Start everything
    startPageDateTime()
    setupModalSystem({ journalManager, projectsManager, quizGame })
    initializeOtherModals(storage)

    console.log("Learning Journal worked successfully")
})






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
      console.log(" CV deleted")
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

  const storage = new StorageManager()
  const browserAPIs = new window.BrowserAPIsManager(storage)
  const youtubeManager = typeof window.YouTubeManager !== "undefined" ? new window.YouTubeManager(storage) : null
  const journalManager = new JournalManager(storage, browserAPIs)
  const projectsManager = new ProjectsManager(storage, browserAPIs)

  // Provide validation manager to journal
  if (browserAPIs && typeof journalManager.setValidationManager === "function") {
    journalManager.setValidationManager(browserAPIs)
  }

  // Start everything
  startPageDateTime()
  setupModalSystem({ journalManager, projectsManager })
  initializeOtherModals(storage)

  console.log("Learning Journal worked successfully")
})