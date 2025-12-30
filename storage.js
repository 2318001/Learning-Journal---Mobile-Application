// Storage Manager - Handles LocalStorage, SessionStorage, and IndexedDB
class StorageManager {
  constructor() {
    this.dbName = "LearningJournalDB"
    this.dbVersion = 1
    this.db = null
    
    // Clean up any corrupted data first
    this.cleanCorruptedData();
    this.initIndexedDB()
  }

  // Clean up corrupted LocalStorage data
  cleanCorruptedData() {
    const corruptedKeys = [];
    
    // Check specific keys that might be corrupted
    const keysToCheck = ['quizPlayers', 'currentPlayer', 'quizScores', 'journals', 'projects'];
    
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          // Try to parse it
          JSON.parse(item);
        }
      } catch (error) {
        // If parsing fails, mark for removal
        console.warn(`Found corrupted data for key "${key}", removing it`);
        corruptedKeys.push(key);
      }
    });
    
    // Remove corrupted keys
    corruptedKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (corruptedKeys.length > 0) {
      console.log(`Cleaned up ${corruptedKeys.length} corrupted LocalStorage entries`);
    }
  }

  // Initialize IndexedDB for complex data storage
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("journals")) {
          const journalStore = db.createObjectStore("journals", { keyPath: "id", autoIncrement: true })
          journalStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", { keyPath: "id", autoIncrement: true })
          projectStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  // LocalStorage methods for simple data
  setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error("LocalStorage error:", e)
      return false
    }
  }

  getLocal(key) {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      try {
        return JSON.parse(item)
      } catch (parseError) {
        console.warn(`Failed to parse JSON for key "${key}":`, parseError)
        
        // Try to clean the data
        const cleaned = this.cleanJsonString(item)
        try {
          return JSON.parse(cleaned)
        } catch {
          console.error(`Could not recover data for key "${key}", removing it`)
          localStorage.removeItem(key)
          return null
        }
      }
    } catch (e) {
      console.error("LocalStorage error:", e)
      return null
    }
  }

  // Helper to clean JSON strings
  cleanJsonString(str) {
    let cleaned = str.trim()
    
    // Find first {
    const firstBrace = cleaned.indexOf('{')
    const firstBracket = cleaned.indexOf('[')
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      cleaned = cleaned.substring(firstBrace)
    } else if (firstBracket !== -1) {
      cleaned = cleaned.substring(firstBracket)
    }
    
    // Find last } or ]
    let lastIndex = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (lastIndex !== -1) {
      cleaned = cleaned.substring(0, lastIndex + 1)
    }
    
    return cleaned
  }

  removeLocal(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error("LocalStorage error:", e)
      return false
    }
  }

  // SessionStorage methods for temporary data
  setSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error("SessionStorage error:", e)
      return false
    }
  }

  getSession(key) {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error("SessionStorage error:", e)
      return null
    }
  }

  removeSession(key) {
    try {
      sessionStorage.removeItem(key)
      return true
    } catch (e) {
      console.error("SessionStorage error:", e)
      return false
    }
  }

  // IndexedDB methods for complex data
  async addToIndexedDB(storeName, data) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllFromIndexedDB(storeName) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getFromIndexedDB(storeName, id) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateInIndexedDB(storeName, data) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFromIndexedDB(storeName, id) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearIndexedDB(storeName) {
    if (!this.db) await this.initIndexedDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Export for use in other modules
if (typeof window !== "undefined") {
  window.StorageManager = StorageManager
}