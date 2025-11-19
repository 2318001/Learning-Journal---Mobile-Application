// =========================================
// JSON Manager - Handles Python JSON file operations
// This demonstrates file-based storage beyond browser storage
// =========================================

class JSONManager {
    constructor(storage) {
        this.storage = storage; // Reference to existing storage manager
        this.jsonEntries = []; // Array to store loaded JSON entries
        this.filteredEntries = []; // Array for filtered results
        this.init();
    }

    /**
     * Initialize event listeners and load initial data
     */
    init() {
        console.log("🔄 Initializing JSON Manager...");
        
        this.setupEventListeners();
        
        // Auto-load JSON reflections after a short delay
        setTimeout(() => {
            this.loadJSONReflections();
        }, 1500);
    }

    /**
     * Set up all event listeners for JSON features
     */
    setupEventListeners() {
        // Load JSON button
        const loadJsonBtn = document.getElementById('loadJsonBtn');
        if (loadJsonBtn) {
            loadJsonBtn.addEventListener('click', () => this.loadJSONReflections());
        }

        // Export JSON button
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportJSONFile());
        }

        // Import JSON button and file input
        const importJsonBtn = document.getElementById('importJsonBtn');
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (importJsonBtn && jsonFileInput) {
            importJsonBtn.addEventListener('click', () => jsonFileInput.click());
            jsonFileInput.addEventListener('change', (e) => this.importJSONFile(e));
        }

        // Search functionality
        const searchInput = document.getElementById('searchReflections');
        const sortSelect = document.getElementById('sortReflections');
        const clearSearchBtn = document.getElementById('clearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    /**
     * Load reflections from the backend JSON file
     * Uses fetch API to get data from reflections.json
     */
    async loadJSONReflections() {
        const loadBtn = document.getElementById('loadJsonBtn');
        
        try {
            // Show loading state
            if (loadBtn) {
                loadBtn.innerHTML = '⏳ Loading...';
                loadBtn.disabled = true;
            }

            console.log("📥 Fetching JSON reflections from backend/reflections.json...");
            
            // Fetch JSON data from backend file
            const response = await fetch('backend/reflections.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse JSON response
            this.jsonEntries = await response.json();
            this.filteredEntries = [...this.jsonEntries];
            
            console.log(`✅ Successfully loaded ${this.jsonEntries.length} reflections from JSON file`);
            
            // Update UI with loaded data
            this.displayJSONEntries();
            this.updateStatistics();
            this.updateLastUpdated();
            
            // Show success message
            this.showMessage(`Loaded ${this.jsonEntries.length} reflections successfully!`, 'success');
            
        } catch (error) {
            console.error('❌ Error loading JSON reflections:', error);
            this.showError('Failed to load JSON reflections. Make sure the backend/reflections.json file exists and contains valid JSON data.');
        } finally {
            // Reset button state
            if (loadBtn) {
                loadBtn.innerHTML = '📥 Load JSON Reflections';
                loadBtn.disabled = false;
            }
        }
    }

    /**
     * Display JSON entries in the DOM
     * Uses DOM manipulation to dynamically create entry cards
     */
    displayJSONEntries() {
        const jsonEntriesContainer = document.getElementById('jsonEntries');
        const jsonEmptyState = document.getElementById('jsonEmptyState');

        if (!this.filteredEntries || this.filteredEntries.length === 0) {
            // Show empty state
            if (jsonEntriesContainer) jsonEntriesContainer.innerHTML = '';
            if (jsonEmptyState) jsonEmptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        if (jsonEmptyState) jsonEmptyState.style.display = 'none';

        // Create HTML for each entry
        const entriesHTML = this.filteredEntries.map(entry => `
            <div class="json-entry-card" style="
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                border-left: 5px solid #10b981;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 15px rgba(0,0,0,0.15)';" 
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';">
                
                <!-- Entry Header -->
                <div class="entry-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 1.25rem;">
                            ${this.escapeHtml(entry.title)}
                        </h3>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <small style="color: #6b7280;">
                                📅 ${entry.dateString}
                            </small>
                            <small style="color: #10b981;">
                                📝 ${entry.wordCount || 'N/A'} words
                            </small>
                            ${entry.source ? `<small style="color: #3b82f6;">🔧 ${entry.source}</small>` : ''}
                        </div>
                    </div>
                    <span class="entry-id" style="
                        background: #e5e7eb; 
                        padding: 0.25rem 0.75rem; 
                        border-radius: 20px; 
                        font-size: 0.8rem; 
                        color: #4b5563;
                        font-family: monospace;
                    ">
                        ID: ${entry.id}
                    </span>
                </div>

                <!-- Entry Content -->
                <div class="entry-content" style="margin-bottom: 1rem;">
                    <p style="margin: 0; line-height: 1.6; color: #374151; font-size: 1rem;">
                        ${this.escapeHtml(entry.content)}
                    </p>
                </div>

                <!-- Entry Footer -->
                <div class="entry-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
                    <small style="color: #9ca3af;">
                        Added via: ${entry.source === 'python' ? '🐍 Python Script' : '🌐 Web Interface'}
                    </small>
                    <button onclick="window.jsonManager.deleteEntry(${entry.id})" class="delete-btn" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 0.25rem 0.75rem;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.8rem;
                    ">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Insert into DOM
        if (jsonEntriesContainer) {
            jsonEntriesContainer.innerHTML = entriesHTML;
        }
    }

    /**
     * Apply search and sort filters to entries
     * Demonstrates DOM event handling for user interactions
     */
    applyFilters() {
        const searchTerm = document.getElementById('searchReflections')?.value.toLowerCase() || '';
        const sortBy = document.getElementById('sortReflections')?.value || 'newest';

        // Start with all entries
        this.filteredEntries = [...this.jsonEntries];

        // Apply search filter
        if (searchTerm) {
            this.filteredEntries = this.filteredEntries.filter(entry => 
                entry.title.toLowerCase().includes(searchTerm) || 
                entry.content.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                this.filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                this.filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'title':
                this.filteredEntries.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        // Update display
        this.displayJSONEntries();
        this.updateStatistics(this.filteredEntries);
    }

    /**
     * Clear all filters and show all entries
     */
    clearFilters() {
        const searchInput = document.getElementById('searchReflections');
        const sortSelect = document.getElementById('sortReflections');
        
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'newest';
        
        this.filteredEntries = [...this.jsonEntries];
        this.displayJSONEntries();
        this.updateStatistics();
    }

    /**
     * Update statistics display
     * Shows total entries, word count, and average length
     */
    updateStatistics(entries = this.jsonEntries) {
        const totalEntries = document.getElementById('totalEntries');
        const totalWords = document.getElementById('totalWords');
        const avgLength = document.getElementById('avgLength');

        if (totalEntries) {
            totalEntries.textContent = entries.length;
        }

        if (totalWords && avgLength) {
            const wordCount = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
            const average = entries.length > 0 ? (wordCount / entries.length).toFixed(1) : 0;

            totalWords.textContent = wordCount.toLocaleString();
            avgLength.textContent = average;
        }
    }

    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString();
        }
    }

    /**
     * Export JSON data as downloadable file
     * Demonstrates file download functionality
     */
    exportJSONFile() {
        if (this.jsonEntries.length === 0) {
            this.showMessage('No reflections to export.', 'warning');
            return;
        }

        try {
            // Create JSON string with pretty formatting
            const dataStr = JSON.stringify(this.jsonEntries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `reflections-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage(`Exported ${this.jsonEntries.length} reflections successfully!`, 'success');
            
        } catch (error) {
            console.error('Error exporting JSON:', error);
            this.showError('Failed to export JSON file.');
        }
    }

    /**
     * Import JSON data from file
     * Demonstrates file upload and parsing
     */
    importJSONFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid JSON format: expected an array of entries');
                }

                // Filter valid entries
                const validEntries = importedData.filter(entry => 
                    entry && 
                    typeof entry.title === 'string' && 
                    typeof entry.content === 'string' &&
                    entry.title.trim() && 
                    entry.content.trim()
                );

                if (validEntries.length === 0) {
                    throw new Error('No valid reflection entries found in the file');
                }

                // Merge with existing entries (avoid duplicates by ID)
                const existingIds = new Set(this.jsonEntries.map(entry => entry.id));
                const newEntries = validEntries.filter(entry => !existingIds.has(entry.id));
                
                // Add source information to imported entries
                newEntries.forEach(entry => {
                    entry.source = entry.source || 'imported';
                });
                
                this.jsonEntries = [...this.jsonEntries, ...newEntries];
                this.filteredEntries = [...this.jsonEntries];
                this.displayJSONEntries();
                this.updateStatistics();
                this.updateLastUpdated();
                
                this.showMessage(`Imported ${newEntries.length} new reflections successfully!`, 'success');
                
            } catch (error) {
                console.error('Error importing JSON file:', error);
                this.showError('Error importing JSON file: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            this.showError('Failed to read the selected file.');
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    /**
     * Delete an entry (for demo purposes - doesn't modify the actual JSON file)
     */
    deleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
            return;
        }

        this.jsonEntries = this.jsonEntries.filter(entry => entry.id !== entryId);
        this.filteredEntries = this.filteredEntries.filter(entry => entry.id !== entryId);
        
        this.displayJSONEntries();
        this.updateStatistics();
        this.updateLastUpdated();
        
        this.showMessage('Reflection deleted successfully!', 'success');
    }

    /**
     * Show success/warning messages
     */
    showMessage(message, type = 'info') {
        // Simple alert for demo - you could replace with a toast notification
        alert(`${type === 'success' ? '✅' : '⚠️'} ${message}`);
    }

    /**
     * Show error messages
     */
    showError(message) {
        const jsonEntriesContainer = document.getElementById('jsonEntries');
        if (jsonEntriesContainer) {
            jsonEntriesContainer.innerHTML = `
                <div class="error-message" style="
                    background: #fee2e2; 
                    color: #dc2626; 
                    padding: 2rem; 
                    border-radius: 8px; 
                    text-align: center;
                    border: 1px solid #fecaca;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h4 style="margin: 0 0 1rem 0;">Error Loading JSON Data</h4>
                    <p style="margin: 0;">${message}</p>
                    <p style="margin: 1rem 0 0 0; font-size: 0.9rem;">
                        Make sure you have run the Python script to create reflections.json first!
                    </p>
                </div>
            `;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.JSONManager = JSONManager;
}