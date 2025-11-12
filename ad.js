// ad.js - Advertisement Management System (Updated for Dynamic Architecture)
// =============================================================================
// DIRECT AD INTEGRATION (No Admin Panel)
// =============================================================================

/**
 * Advertisement Configuration
 * Define all ad codes directly here
 */
const AD_CONFIG = {
    // Ad Slot 1 - Top Banner (Desktop: 728x90, Mobile: 320x50)
    slot1: {
        key: '63718988f07bc6d276f3c6a441757cae',
        format: 'iframe',
        height: 90,
        width: 728,
        mobileHeight: 50,
        mobileWidth: 320,
        name: 'Top Banner',
        priority: 1
    },
    
    // Ad Slot 2 - Bottom Banner (Desktop: 728x90, Mobile: 320x50)
    slot2: {
        key: '53c6462d2fd5ad5b91686ca9561f79a2',
        format: 'iframe',
        height: 90,
        width: 728,
        mobileHeight: 50,
        mobileWidth: 320,
        name: 'Bottom Banner',
        priority: 2
    },
    
    // Ad Slot 3 - Modal/Popup (Mobile: 320x50)
    slot3: {
        key: '78ade24182729fceea8e45203dad915b',
        format: 'iframe',
        height: 50,
        width: 320,
        name: 'Modal Ad',
        priority: 3
    }
};

/**
 * Ad rotation settings
 */
const ROTATION_SETTINGS = {
    interval: 15000, // 15 seconds
    ads: ['slot1', 'slot2', 'slot3'],
    currentIndex: 0,
    autoRotate: true,
    pauseOnClaim: false // Don't pause rotation when modal opens
};

/**
 * App loading state tracker
 */
let appLoaded = false;
let rotationTimer = null;
let currentlyDisplayedAd = null;
let adContainer = null;
let adContent = null;
let modalElement = null;
let userInteractionCount = 0; // Track user interactions
let lastAdChangeTime = Date.now();

/**
 * Initialize DOM elements (called after DOM is ready)
 */
function initializeDOMElements() {
    adContainer = document.getElementById('mainAdContainer');
    adContent = document.getElementById('mainAdContent');
    modalElement = document.getElementById('adModal');
    
    if (!adContainer || !adContent) {
        console.warn('⚠️ Ad container elements not found. Ads will be disabled.');
        return false;
    }
    
    console.log('✅ Ad DOM elements initialized');
    return true;
}

/**
 * Mark app as loaded
 * Call this function when your app/game finishes loading
 */
export function setAppLoaded() {
    if (!initializeDOMElements()) {
        console.error('❌ Failed to initialize ad system - DOM elements missing');
        return;
    }
    
    appLoaded = true;
    console.log('✅ App loaded - Starting ad rotation');
    console.log(`⚙️ Rotation: ${ROTATION_SETTINGS.interval / 1000}s interval`);
    console.log(`📢 Ad sequence: ${ROTATION_SETTINGS.ads.map(slot => AD_CONFIG[slot].name).join(' → ')}`);
    
    startAdRotation();
}

/**
 * Check if app is loaded
 */
export function isAppLoaded() {
    return appLoaded;
}

/**
 * Detect if device is mobile
 */
function isMobileDevice() {
    return window.innerWidth <= 640;
}

/**
 * Start ad rotation system
 * Shows one ad at a time, rotates every 15-20 seconds
 */
function startAdRotation() {
    if (!appLoaded) {
        console.log('⏳ App not loaded yet - Ad rotation will start after app loads');
        return;
    }
    
    if (!ROTATION_SETTINGS.autoRotate) {
        console.log('⏸️ Auto-rotation is disabled');
        return;
    }
    
    console.log('🔄 Starting ad rotation system...');
    
    // Show first ad immediately
    showNextAd();
    
    // Setup rotation timer
    if (rotationTimer) {
        clearInterval(rotationTimer);
    }
    
    rotationTimer = setInterval(() => {
        showNextAd();
    }, ROTATION_SETTINGS.interval);
}

/**
 * Show next ad in rotation
 */
function showNextAd() {
    if (!adContainer || !adContent) {
        console.warn('⚠️ Ad elements not available');
        return;
    }
    
    // Hide current ad if any
    if (currentlyDisplayedAd) {
        hideAd(currentlyDisplayedAd);
    }
    
    // Get next ad from rotation
    const adSlot = ROTATION_SETTINGS.ads[ROTATION_SETTINGS.currentIndex];
    const adConfig = AD_CONFIG[adSlot];
    
    // Display the ad
    displayRotatingAd(adSlot, adConfig);
    
    // Update index for next rotation
    ROTATION_SETTINGS.currentIndex = (ROTATION_SETTINGS.currentIndex + 1) % ROTATION_SETTINGS.ads.length;
    
    // Track timing
    lastAdChangeTime = Date.now();
    
    console.log(`🎯 Now showing: ${adConfig.name} (Next in ${ROTATION_SETTINGS.interval / 1000}s)`);
}

/**
 * Display rotating ad in main ad container
 * @param {string} adSlot - Ad slot identifier
 * @param {Object} adConfig - Ad configuration object
 */
function displayRotatingAd(adSlot, adConfig) {
    if (!adContainer || !adContent) {
        console.error(`❌ Ad container not available`);
        return;
    }
    
    try {
        // Mark current ad
        currentlyDisplayedAd = adSlot;
        
        // Show the container
        adContainer.classList.remove('hidden');
        
        // Clear previous content
        adContent.innerHTML = '';
        
        // Create ad code (mobile-responsive)
        const adCode = createAdCode(adConfig);
        
        // Insert ad code
        adContent.innerHTML = adCode;
        
        // Execute scripts
        executeAdScripts(adContent);
        
        // Add loaded animation class
        setTimeout(() => {
            adContainer.classList.add('loaded');
        }, 150);
        
        console.log(`✅ ${adConfig.name} displayed successfully`);
    } catch (error) {
        console.error(`❌ Error displaying ${adConfig.name}:`, error);
        handleAdLoadError(adSlot);
    }
}

/**
 * Handle ad load errors
 * @param {string} adSlot - Failed ad slot
 */
function handleAdLoadError(adSlot) {
    console.warn(`⚠️ Skipping failed ad: ${adSlot}`);
    
    // Try next ad after 2 seconds
    setTimeout(() => {
        showNextAd();
    }, 2000);
}

/**
 * Hide specific ad
 * @param {string} adSlot - Ad slot to hide
 */
function hideAd(adSlot) {
    if (!adContainer || !adContent) return;
    
    adContainer.classList.remove('loaded');
    adContainer.classList.add('hidden');
    
    // Clear content after animation
    setTimeout(() => {
        if (adContent) {
            adContent.innerHTML = '';
        }
    }, 300);
}

/**
 * Stop ad rotation
 */
export function stopAdRotation() {
    if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
        console.log('⏹️ Ad rotation stopped');
    }
    
    if (currentlyDisplayedAd) {
        hideAd(currentlyDisplayedAd);
        currentlyDisplayedAd = null;
    }
}

/**
 * Pause ad rotation temporarily
 * @param {number} duration - Pause duration in milliseconds (optional)
 */
export function pauseAdRotation(duration = 0) {
    if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
        console.log(`⏸️ Ad rotation paused${duration ? ` for ${duration / 1000}s` : ''}`);
        
        if (duration > 0) {
            setTimeout(() => {
                console.log('▶️ Resuming ad rotation');
                startAdRotation();
            }, duration);
        }
    }
}

/**
 * Resume ad rotation
 */
export function resumeAdRotation() {
    if (!rotationTimer && appLoaded) {
        console.log('▶️ Resuming ad rotation');
        startAdRotation();
    }
}

/**
 * Create ad code HTML from configuration (mobile-responsive)
 * @param {Object} config - Ad configuration
 * @returns {string} HTML ad code
 */
function createAdCode(config) {
    const isMobile = isMobileDevice();
    const height = isMobile && config.mobileHeight ? config.mobileHeight : config.height;
    const width = isMobile && config.mobileWidth ? config.mobileWidth : config.width;
    
    return `
        <script type="text/javascript">
            atOptions = {
                'key': '${config.key}',
                'format': '${config.format}',
                'height': ${height},
                'width': ${width},
                'params': {}
            };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/${config.key}/invoke.js"></script>
    `;
}

/**
 * Execute scripts in ad content
 * @param {HTMLElement} content - Content element containing scripts
 */
function executeAdScripts(content) {
    if (!content) return;
    
    const scripts = content.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
        const newScript = document.createElement('script');
        
        // Copy all attributes from original script
        Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        if (script.src) {
            // External script
            newScript.src = script.src;
            newScript.async = true;
        } else {
            // Inline script
            newScript.textContent = script.textContent;
        }
        
        // Append to body to execute
        document.body.appendChild(newScript);
        
        // Clean up old script after execution
        setTimeout(() => {
            if (newScript.parentNode) {
                newScript.parentNode.removeChild(newScript);
            }
        }, 100);
    });
}

/**
 * Load modal/popup ad when user claims rewards
 * Uses slot3 configuration
 */
export function loadModalAd() {
    const claimAdDiv = document.getElementById('claimAd');
    
    if (!claimAdDiv) {
        console.error('❌ Modal ad container not found');
        return false;
    }
    
    try {
        // Track user interaction
        userInteractionCount++;
        
        // Clear previous content
        claimAdDiv.innerHTML = '';
        
        // Create ad code using slot3
        const adCode = createAdCode(AD_CONFIG.slot3);
        
        // Insert ad code
        claimAdDiv.innerHTML = adCode;
        
        // Execute scripts
        executeAdScripts(claimAdDiv);
        
        console.log(`✅ Modal ad loaded (Interaction #${userInteractionCount})`);
        return true;
    } catch (error) {
        console.error('❌ Error loading modal ad:', error);
        claimAdDiv.innerHTML = '<p class="text-gray-600 text-sm text-center">Thank you for using FarmZone! 🎉</p>';
        return false;
    }
}

/**
 * Show ad modal
 */
export function showAdModal() {
    const modal = document.getElementById('adModal');
    if (!modal) {
        console.warn("❌ Ad modal not found");
        return;
    }

    console.log('📢 Loading modal ad');
    loadModalAd();

    // Show modal
    modal.style.display = 'flex';
    
    // Setup close handlers
    setupModalCloseHandlers(modal);
    
    // Optionally pause rotation while modal is open
    if (ROTATION_SETTINGS.pauseOnClaim) {
        pauseAdRotation(5000); // Pause for 5 seconds
    }
}

/**
 * Setup modal close handlers
 * @param {HTMLElement} modal - Modal element
 */
function setupModalCloseHandlers(modal) {
    const close = () => {
        modal.style.display = 'none';
        
        // Resume rotation if it was paused
        if (ROTATION_SETTINGS.pauseOnClaim) {
            resumeAdRotation();
        }
    };
    
    // Close button handler
    const closeBtn = document.getElementById('adCloseBtn');
    if (closeBtn) {
        // Remove old listeners to prevent duplicates
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        const newCloseBtn = document.getElementById('adCloseBtn');
        newCloseBtn.addEventListener('click', close);
    }
    
    // Auto-close after 5 seconds
    setTimeout(close, 5000);
}

/**
 * Initialize advertisement system
 * Call this when DOM is ready
 */
export function initAdSystem() {
    console.log('🎬 Advertisement System v2.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Rotation Interval: ${ROTATION_SETTINGS.interval / 1000}s`);
    console.log(`🔄 Auto-Rotate: ${ROTATION_SETTINGS.autoRotate ? 'Enabled' : 'Disabled'}`);
    console.log(`📱 Mobile Detection: ${isMobileDevice() ? 'Mobile' : 'Desktop'}`);
    console.log(`📢 Ad Slots: ${Object.keys(AD_CONFIG).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏳ Waiting for app to load...');
    console.log('💡 Use window.adDebug for debugging');
    
    // Initialize DOM elements check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeDOMElements();
        });
    } else {
        initializeDOMElements();
    }
}

/**
 * Change rotation interval (in seconds)
 * @param {number} seconds - Rotation interval in seconds
 */
export function setRotationInterval(seconds) {
    if (seconds < 5) {
        console.warn('⚠️ Minimum rotation interval is 5 seconds');
        seconds = 5;
    }
    
    ROTATION_SETTINGS.interval = seconds * 1000;
    console.log(`⚙️ Rotation interval updated to ${seconds} seconds`);
    
    // Restart rotation if already running
    if (appLoaded && rotationTimer) {
        stopAdRotation();
        startAdRotation();
    }
}

/**
 * Toggle auto-rotation
 * @param {boolean} enable - Enable or disable auto-rotation
 */
export function toggleAutoRotation(enable) {
    ROTATION_SETTINGS.autoRotate = enable;
    console.log(`🔄 Auto-rotation ${enable ? 'enabled' : 'disabled'}`);
    
    if (enable && appLoaded) {
        startAdRotation();
    } else {
        stopAdRotation();
    }
}

/**
 * Get current ad configuration (for debugging)
 */
export function getAdConfig() {
    return {
        adSlots: AD_CONFIG,
        rotation: {
            ...ROTATION_SETTINGS,
            intervalSeconds: ROTATION_SETTINGS.interval / 1000,
            currentAd: currentlyDisplayedAd,
            timeSinceLastChange: Math.floor((Date.now() - lastAdChangeTime) / 1000)
        },
        appLoaded: appLoaded,
        isRotating: rotationTimer !== null,
        userInteractions: userInteractionCount,
        deviceType: isMobileDevice() ? 'Mobile' : 'Desktop'
    };
}

/**
 * Get ad statistics
 */
export function getAdStats() {
    return {
        totalInteractions: userInteractionCount,
        currentAd: currentlyDisplayedAd ? AD_CONFIG[currentlyDisplayedAd].name : 'None',
        rotationActive: rotationTimer !== null,
        appLoadTime: appLoaded ? 'Loaded' : 'Not Loaded',
        uptime: appLoaded ? Math.floor((Date.now() - lastAdChangeTime) / 1000) + 's' : 'N/A'
    };
}

// =========================================
// DEBUG & UTILITY EXPORTS
// =========================================

// Export for debugging in console
if (typeof window !== 'undefined') {
    window.adDebug = {
        // Configuration
        getAdConfig,
        getAdStats,
        
        // Control
        setAppLoaded,
        isAppLoaded,
        startAdRotation,
        stopAdRotation,
        pauseAdRotation,
        resumeAdRotation,
        showNextAd,
        
        // Settings
        setRotationInterval,
        toggleAutoRotation,
        
        // Modals
        loadModalAd,
        showAdModal,
        
        // Info
        version: '2.0',
        updated: '2025-01-11'
    };
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Debug Commands Available:');
    console.log('   window.adDebug.getAdConfig()');
    console.log('   window.adDebug.getAdStats()');
    console.log('   window.adDebug.setRotationInterval(seconds)');
    console.log('   window.adDebug.toggleAutoRotation(true/false)');
    console.log('   window.adDebug.stopAdRotation()');
    console.log('   window.adDebug.startAdRotation()');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Cleanup function (call on app unmount)
 */
export function cleanupAdSystem() {
    stopAdRotation();
    userInteractionCount = 0;
    appLoaded = false;
    console.log('🧹 Ad system cleaned up');
}

// Export all functions for external use
export default {
    initAdSystem,
    setAppLoaded,
    isAppLoaded,
    showAdModal,
    loadModalAd,
    startAdRotation,
    stopAdRotation,
    pauseAdRotation,
    resumeAdRotation,
    setRotationInterval,
    toggleAutoRotation,
    getAdConfig,
    getAdStats,
    cleanupAdSystem
};