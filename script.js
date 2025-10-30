// Lightweight site script
// - Highlights the active nav link based on current filename
// - Keeps behavior minimal; avoids errors if page-specific elements are missing
(function(){
    // Highlight active nav item. Supports both <a href> and <button data-target> patterns.
    function setActiveNav() {
        try {
            var path = window.location.pathname.split('/').pop() || 'index.html';

            // Handle anchor links
            var anchors = document.querySelectorAll('nav a');
            anchors.forEach(function(a){
                var href = a.getAttribute('href');
                if (!href) return;
                if (href === path) a.classList.add('active'); else a.classList.remove('active');
            });

            // Handle button targets (data-target)
            var buttons = document.querySelectorAll('nav .nav-button');
            buttons.forEach(function(btn){
                var target = btn.getAttribute('data-target');
                if (!target) return;
                if (target === path) btn.classList.add('active'); else btn.classList.remove('active');
            });
        } catch (e) {
            // silent
        }
    }

    function wireNavButtons() {
        try {
            var buttons = document.querySelectorAll('nav .nav-button');
            buttons.forEach(function(btn){
                btn.addEventListener('click', function(){
                    var target = btn.getAttribute('data-target');
                    if (!target) return;
                    // Navigate to the target page
                    window.location.href = target;
                });
            });
        } catch (e) {
            // silent
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ wireNavButtons(); setActiveNav(); });
    } else {
        wireNavButtons(); setActiveNav();
    }
})();
