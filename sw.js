// sw.js
const STATIC_CACHE = 'static-v1.5';
const DYNAMIC_CACHE = 'dynamic-v1.5';

// Navigation routes 
const NAVIGATION_ROUTES = [
    '/'  
];

const STATIC_ASSETS = [
    '/',
    // Core styles/scripts
    '/static/style.css',
    '/static/storage.js',
    '/static/browser.js', 
    '/static/thirdparty.js',
    '/static/script.js',
    '/static/pwa.js',
    
    // Images + manifest
    '/static/mario-111.png',
    '/static/bookimage.jpeg',
    '/static/book.png',
    '/static/book_1.png',
    '/static/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing........!');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static assets........!');
                
                // Cache assets - handle failures gracefully
                return Promise.all(
                    STATIC_ASSETS.map(asset => {
                        return cache.add(asset).catch(err => {
                            console.warn(`Failed to cache ${asset}:`, err);
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => {
                console.log('All assets cached successfully....!');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.........!');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Keep only current caches
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker ready for offline navigation...!');
            return self.clients.claim();
        })
    );
});

// Fetch event - SIMPLIFIED VERSION
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;
    
    // Skip API requests for now (unless you have APIs)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle HTML pages (navigation)
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(handleHtmlRequest(event));
        return;
    }
    
    // Handle static assets
    event.respondWith(handleStaticRequest(event));
});

// Handle HTML requests
async function handleHtmlRequest(event) {
    const cache = await caches.open(STATIC_CACHE);
    const request = event.request;
    
    try {
        // Network-first strategy for HTML
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone and cache the response
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            console.log('Served HTML from network:', request.url);
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        console.log('Network failed, trying cache for:', request.url);
        
        // Try to get from cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('Served HTML from cache:', request.url);
            return cachedResponse;
        }
        
        // Try alternative URLs
        const url = new URL(request.url);
        const altUrls = [
            request.url,
            url.pathname,
            url.pathname + '/',
            url.pathname.replace(/\/$/, ''),
            '/'
        ];
        
        for (const altUrl of altUrls) {
            const altCached = await cache.match(altUrl);
            if (altCached) {
                console.log('Served HTML from alternative URL:', altUrl);
                return altCached;
            }
        }
        
        // Fallback to offline page
        return serveOfflinePage();
    }
}

// Handle static assets (CSS, JS, images)
async function handleStaticRequest(event) {
    const cache = await caches.open(STATIC_CACHE);
    const request = event.request;
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        console.log('Served asset from cache:', request.url);
        return cachedResponse;
    }
    
    try {
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache for future use
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            console.log('Served asset from network:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Asset not available offline:', request.url);
        
        // Return fallback for images
        if (request.destination === 'image') {
            return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="12" dominant-baseline="middle" text-anchor="middle" fill="#6b7280">Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        
        // Generic fallback for other assets
        return new Response('Offline', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Handle API requests
async function handleApiRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        // Network first for APIs
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache API responses
            cache.put(request, networkResponse.clone());
            console.log('API served from network:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache if network fails
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('API served from cache:', request.url);
            return cachedResponse;
        }
        
        // Return empty data for offline
        return new Response(
            JSON.stringify({ data: [], offline: true }),
            { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Offline': 'true'
                } 
            }
        );
    }
}

// Offline page
async function serveOfflinePage() {
    const cache = await caches.open(STATIC_CACHE);
    
    // Try to get a cached page
    const cachedHome = await cache.match('/');
    if (cachedHome) {
        console.log('Serving cached home page as offline fallback');
        return cachedHome;
    }
    
    // Create simple offline page
    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Learning Journal-pwa</title>
            <style>
                body {
                    font-family: system-ui, sans-serif;
                    background: #f3f4f6;
                    color: #111827;
                    margin: 0;
                    padding: 2rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    text-align: center;
                }
                .container {
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    max-width: 500px;
                }
                h1 {
                    color: #dc2626;
                    margin-bottom: 1rem;
                }
                p {
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }
                button {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                button:hover {
                    background: #1d4ed8;
                }
                .offline-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="offline-icon"></div>
                <h1>You're Offline</h1>
                <p>Don't worry! You can still some features access your Learning Journal content.</p>
                <p>Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
            </div>
        </body>
        </html>`,
        { 
            status: 200, 
            headers: { 'Content-Type': 'text/html' } 
        }
    );
}

// Handle messages (for skip waiting)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});