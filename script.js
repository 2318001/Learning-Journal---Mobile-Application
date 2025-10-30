// Modal functionality
function initializeModals() {
    // Get modal elements
    const journalModal = document.getElementById('journalModal');
    const projectsModal = document.getElementById('projectsModal');
    const journalBtn = document.getElementById('journalBtn');
    const projectsBtn = document.getElementById('projectsBtn');
    const closeButtons = document.getElementsByClassName('close-button');

    // Open modals
    journalBtn.onclick = function() {
        journalModal.style.display = "block";
        updateDateTime();
    }

    projectsBtn.onclick = function() {
        projectsModal.style.display = "block";
        updateDateTime();
    }

    // Close modals when clicking (x)
    Array.from(closeButtons).forEach(button => {
        button.onclick = function() {
            journalModal.style.display = "none";
            projectsModal.style.display = "none";
        }
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target == journalModal) {
            journalModal.style.display = "none";
        }
        if (event.target == projectsModal) {
            projectsModal.style.display = "none";
        }
    }
}

// Function to update date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const dateTimeString = now.toLocaleString('en-US', options);
    const dateTimeElements = document.querySelectorAll('.datetime');
    dateTimeElements.forEach(element => {
        element.textContent = dateTimeString;
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    // Update date and time every second
    setInterval(updateDateTime, 1000);
    updateDateTime(); // Initial call
});

// Journal functionality
document.addEventListener('DOMContentLoaded', function() {
    const journalForm = document.getElementById('journalForm');
    const journalEntries = document.getElementById('journalEntries');

    if (journalForm) {
        journalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('journalTitle').value;
            const content = document.getElementById('journalContent').value;
            
            if (!title || !content) {
                alert('Please fill in all fields');
                return;
            }

            // Create new journal entry
            const entry = document.createElement('div');
            entry.className = 'journal-entry';
            entry.innerHTML = `
                <h3>${title}</h3>
                <p>${content}</p>
                <small>${new Date().toLocaleString()}</small>
            `;

            // Add entry to the list
            journalEntries.insertBefore(entry, journalEntries.firstChild);

            // Clear form
            journalForm.reset();
        });

        // New button functionality
        document.getElementById('newButton').addEventListener('click', function() {
            journalForm.reset();
            document.getElementById('journalTitle').focus();
        });
    }
});

// Projects functionality
document.addEventListener('DOMContentLoaded', function() {
    const projectForm = document.getElementById('projectForm');
    const projectsList = document.getElementById('projectsList');

    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('projectTitle').value;
            const description = document.getElementById('projectDescription').value;
            const files = document.getElementById('projectFiles').files;
            
            if (!title || !description) {
                alert('Please fill in all required fields');
                return;
            }

            // Create new project entry
            const project = document.createElement('div');
            project.className = 'project-entry';
            
            let filesList = '';
            if (files.length > 0) {
                filesList = '<ul class="files-list">';
                for (let i = 0; i < files.length; i++) {
                    filesList += `<li>${files[i].name}</li>`;
                }
                filesList += '</ul>';
            }

            project.innerHTML = `
                <h3>${title}</h3>
                <p>${description}</p>
                ${filesList}
                <small>Added on: ${new Date().toLocaleString()}</small>
            `;

            // Add project to the list
            projectsList.insertBefore(project, projectsList.firstChild);

            // Clear form
            projectForm.reset();
        });

        // New button functionality
        document.getElementById('newProjectButton').addEventListener('click', function() {
            projectForm.reset();
            document.getElementById('projectTitle').focus();
        });
    }
});
