// PYTHON JSON INTEGRATION - SEPARATE FILE
class PythonJSONIntegration {
    constructor() {
        this.storage = null;
        this.jsonEntries = [];
        this.init();
    }

    async init() {
        // Wait for original PWA to load
        setTimeout(() => {
            this.storage = window.storageManager;
            this.loadIntegration();
        }, 1000);
    }

    async loadIntegration() {
        if (!this.storage) {
            console.warn('Storage manager not found, retrying...');
            setTimeout(() => this.loadIntegration(), 500);
            return;
        }

        await this.loadJSONReflections();
        this.addJSONFeatures();
        console.log("✅ Python JSON Integration Loaded");
    }

    // Load reflections from JSON file
    async loadJSONReflections() {
        try {
            const response = await fetch('python-json-system/reflections.json');
            if (!response.ok) throw new Error('JSON file not found');
            
            this.jsonEntries = await response.json();
            console.log(`📁 Loaded ${this.jsonEntries.length} entries from JSON`);
            
            this.updateJournalDisplay();
            this.updateCounter();
            
        } catch (error) {
            console.warn('Could not load JSON reflections:', error);
            this.jsonEntries = [];
        }
    }

    // Update journal display with JSON entries
    updateJournalDisplay() {
        const journalEntries = document.getElementById('journalEntries');
        if (!journalEntries || this.jsonEntries.length === 0) return;

        const jsonEntriesHTML = this.jsonEntries.map(entry => `
            <div class="journal-entry json-entry">
                <div class="entry-header">
                    <h3>${this.escapeHtml(entry.title)}</h3>
                    <small>${entry.dateString} • 📁 JSON</small>
                </div>
                <p>${this.escapeHtml(entry.content)}</p>
                <div class="entry-source">Added via Python CLI</div>
            </div>
        `).join('');

        // Add to existing content
        journalEntries.innerHTML = jsonEntriesHTML + journalEntries.innerHTML;
    }

    // Add extra features
    addJSONFeatures() {
        this.addExportFeature();
        this.addCounterFeature();
        this.addImportFeature();
    }

    // FEATURE 1: Export Button
    addExportFeature() {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'cta-btn export-btn';
        exportBtn.innerHTML = '📥 Export JSON';
        exportBtn.onclick = () => this.exportAllEntries();

        const headerActions = document.querySelector('#journalModal .modal-header-actions .button-group');
        if (headerActions) {
            headerActions.appendChild(exportBtn);
        }
    }

    // FEATURE 2: Entry Counter
    addCounterFeature() {
        this.counterElement = document.createElement('div');
        this.counterElement.className = 'entries-counter';
        
        const journalEntries = document.getElementById('journalEntries');
        if (journalEntries && journalEntries.parentNode) {
            journalEntries.parentNode.insertBefore(this.counterElement, journalEntries);
            this.updateCounter();
        }
    }

    // FEATURE 3: Import Button
    addImportFeature() {
        const importBtn = document.createElement('button');
        importBtn.className = 'cta-btn import-btn';
        importBtn.innerHTML = '📤 Import JSON';
        importBtn.onclick = () => this.triggerImport();

        const headerActions = document.querySelector('#journalModal .modal-header-actions .button-group');
        if (headerActions) {
            headerActions.appendChild(importBtn);
        }

        this.importFileInput = document.createElement('input');
        this.importFileInput.type = 'file';
        this.importFileInput.accept = '.json';
        this.importFileInput.style.display = 'none';
        this.importFileInput.onchange = (e) => this.handleImport(e);
        document.body.appendChild(this.importFileInput);
    }

    async exportAllEntries() {
        try {
            const allEntries = [
                ...this.jsonEntries,
                ...(this.storage.getLocal("journals") || [])
            ];

            if (allEntries.length === 0) {
                alert('No entries to export!');
                return;
            }

            const dataStr = JSON.stringify(allEntries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `learning-journal-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);
            alert(`✅ Exported ${allEntries.length} entries!`);

        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Export failed!');
        }
    }

    updateCounter() {
        const totalEntries = this.jsonEntries.length + (this.storage.getLocal("journals") || []).length;
        if (this.counterElement) {
            this.counterElement.innerHTML = `📊 Total Reflections: ${totalEntries} (${this.jsonEntries.length} from JSON)`;
        }
    }

    triggerImport() {
        this.importFileInput.click();
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedEntries = JSON.parse(text);

            if (!Array.isArray(importedEntries)) {
                throw new Error('Invalid JSON format');
            }

            this.storage.setLocal("journals", importedEntries);
            alert(`✅ Imported ${importedEntries.length} entries!`);
            location.reload();

        } catch (error) {
            console.error('Import failed:', error);
            alert('❌ Import failed - invalid file format');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pythonJSONIntegration = new PythonJSONIntegration();
});