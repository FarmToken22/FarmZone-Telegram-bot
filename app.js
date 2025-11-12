// app.js - Main application file (Updated for Telegram Mini App + Dynamic HTML)
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, set, onValue, update } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Import home module
import { 
    calculateCurrentEarned, 
    startCountdownAndEarned,
    cleanupMining,
    initHomeSection,
    renderHomeSection
} from './home.js';

// Import profile module
import { 
    copyReferralCode,
    shareReferralCode,
    submitReferralCode,
    claimReferralRewards,
    checkReferralMilestones,
    initProfileSection,
    renderProfileSection
} from './profile.js';

// Import wallet module
import { 
    updateWalletDisplay,
    handleWithdraw,
    initWalletSection,
    renderWalletSection
} from './wallet.js';

// Import bonus module
import { 
    isBonusAvailable,
    updateBonusTimer,
    claimBonus,
    cleanupBonus,
    initBonusSection,
    renderBonusSection
} from './bonus.js';

// Import ad system
import { 
    initAdSystem,
    setAppLoaded,
    showAdModal
} from './ad.js';

// Import mining functions
import { 
    startMining as startMiningFunc, 
    stopMining as stopMiningFunc,
    claimMiningReward as claimMiningRewardFunc
} from './mining.js';

// ========================================
// TELEGRAM WEB APP INTEGRATION
// ========================================
let tg = null;
let telegramUser = null;
let isTelegramEnvironment = false;

function initTelegramIntegration() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            isTelegramEnvironment = true;
            
            // Expand to full height
            tg.expand();
            
            // Ready signal
            tg.ready();
            
            // Get user data
            telegramUser = tg.initDataUnsafe?.user || null;
            
            // Apply Telegram theme
            applyTelegramTheme();
            
            // Enable closing confirmation
            tg.enableClosingConfirmation();
            
            // Setup MainButton for sharing
            setupTelegramMainButton();
            
            // Setup BackButton (optional)
            setupTelegramBackButton();
            
            console.log('✅ Telegram WebApp initialized');
            console.log('📱 Telegram User:', telegramUser);
            
            // Save to localStorage for other modules
            if (telegramUser) {
                localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
                localStorage.setItem('telegram_user_id', telegramUser.id);
            }
            
            return true;
        }
    } catch (error) {
        console.log('⚠️ Not running in Telegram environment');
        isTelegramEnvironment = false;
    }
    return false;
}

function applyTelegramTheme() {
    if (!tg || !tg.themeParams) return;
    
    const theme = tg.themeParams;
    const root = document.documentElement;
    
    if (theme.bg_color) root.style.setProperty('--tg-bg-color', theme.bg_color);
    if (theme.text_color) root.style.setProperty('--tg-text-color', theme.text_color);
    if (theme.hint_color) root.style.setProperty('--tg-hint-color', theme.hint_color);
    if (theme.link_color) root.style.setProperty('--tg-link-color', theme.link_color);
    if (theme.button_color) root.style.setProperty('--tg-button-color', theme.button_color);
    if (theme.button_text_color) root.style.setProperty('--tg-button-text-color', theme.button_text_color);
    
    // Apply to body if needed
    if (theme.bg_color) {
        document.body.style.backgroundColor = theme.bg_color;
    }
    
    console.log('🎨 Telegram theme applied');
}

function setupTelegramMainButton() {
    if (!tg) return;
    
    tg.MainButton.setText('Share FarmZone');
    tg.MainButton.color = '#28a745';
    tg.MainButton.textColor = '#ffffff';
    
    tg.MainButton.onClick(() => {
        hapticFeedback('medium');
        shareToTelegram();
    });
    
    // Show MainButton
    tg.MainButton.show();
}

function setupTelegramBackButton() {
    if (!tg) return;
    
    // Show back button when not on home section
    tg.BackButton.onClick(() => {
        hapticFeedback('light');
        switchSection('home');
        tg.BackButton.hide();
    });
}

function shareToTelegram() {
    if (!tg || !userData) {
        console.error('Telegram not available or user data missing');
        return;
    }
    
    const referralCode = userData.referralCode || 'FZ-XXXXX';
    const shareText = `🌾 Join FarmZone and start mining crypto!\n\n` +
                     `💰 Use my referral code: ${referralCode}\n` +
                     `🎁 Get ${appSettings.referral?.referralBonus || 5} FZ bonus!\n\n` +
                     `Start earning now! 🚀`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
    
    tg.openTelegramLink(shareUrl);
    showNotification('Opening Telegram share...', 'success');
}

function hapticFeedback(type = 'medium') {
    if (!tg || !tg.HapticFeedback) return;
    
    try {
        switch(type) {
            case 'light':
                tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'warning':
                tg.HapticFeedback.notificationOccurred('warning');
                break;
            case 'error':
                tg.HapticFeedback.notificationOccurred('error');
                break;
        }
    } catch (error) {
        console.log('Haptic feedback error:', error);
    }
}

function showTelegramAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

function showTelegramConfirm(message, callback) {
    if (tg && tg.showConfirm) {
        tg.showConfirm(message, callback);
    } else {
        const result = confirm(message);
        callback(result);
    }
}

function sendDataToBot(data) {
    if (!tg) return;
    
    try {
        tg.sendData(JSON.stringify(data));
        console.log('✅ Data sent to bot:', data);
    } catch (error) {
        console.error('❌ Failed to send data to bot:', error);
    }
}

// ========================================
// GLOBALS & CONSTANTS
// ========================================
let currentUser = null;
let userData = null;
let serverTimeOffset = 0;
let unsubscribeUser = null;
let unsubscribeSettings = null;
let authUnsubscribe = null;
let isAppFullyLoaded = false;
let sectionsRendered = {
    home: false,
    profile: false,
    wallet: false,
    bonus: false
};

// App Settings
let appSettings = {
    mining: { miningDuration: 8, totalReward: 6 },
    referral: { referralBonus: 5, referralMilestone: 100 }
};

const LEVEL_MILESTONES = [0, 500, 1000, 2000, 5000];
const MAX_LEVEL = LEVEL_MILESTONES.length - 1;

// ========================================
// SETTINGS & SERVER TIME
// ========================================
function listenForSettings() {
    const settingsRef = ref(database, 'settings');
    unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            appSettings.mining = { ...appSettings.mining, ...settings.mining };
            appSettings.referral = { ...appSettings.referral, ...settings.referral };
            console.log("Settings updated:", appSettings);
            updateUI();
        }
    }, (error) => console.error("Settings load failed:", error));
}

onValue(ref(database, '.info/serverTimeOffset'), (snap) => {
    serverTimeOffset = snap.val() || 0;
}, { onlyOnce: true });

function getServerTime() {
    return Date.now() + serverTimeOffset;
}

// ========================================
// CLEANUP
// ========================================
function cleanup() {
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeSettings) unsubscribeSettings();
    if (authUnsubscribe) authUnsubscribe();
    cleanupMining();
    cleanupBonus();
}
window.addEventListener('beforeunload', cleanup);

// ========================================
// HELPER FUNCTIONS (Enhanced with Telegram)
// ========================================
function showNotification(message, type = 'success') {
    // Add haptic feedback for notifications
    if (isTelegramEnvironment) {
        hapticFeedback(type === 'success' ? 'success' : 'error');
    }
    
    const el = document.getElementById('notification');
    if (!el) return;
    el.textContent = message;
    el.style.background = type === 'success' ? '#28a745' : '#dc3545';
    el.className = 'notification show';
    setTimeout(() => el.className = 'notification', 3000);
}

function showStatus(el, message, isError = false) {
    if (!el) return;
    
    // Add haptic feedback
    if (isTelegramEnvironment) {
        hapticFeedback(isError ? 'error' : 'success');
    }
    
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => el.className = 'status', 3000);
}

function generateReferralCode() {
    // Use Telegram user ID if available for better tracking
    if (telegramUser && telegramUser.id) {
        return `FZ-TG${telegramUser.id.toString().slice(-4)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    return `FZ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
function ensureSectionRendered(section) {
    if (sectionsRendered[section]) return;
    
    console.log(`🔧 Rendering ${section} section dynamically...`);
    
    switch(section) {
        case 'home':
            renderHomeSection();
            sectionsRendered.home = true;
            break;
        case 'profile':
            renderProfileSection();
            sectionsRendered.profile = true;
            break;
        case 'wallet':
            renderWalletSection();
            sectionsRendered.wallet = true;
            break;
        case 'bonus':
            renderBonusSection();
            sectionsRendered.bonus = true;
            break;
    }
}

// ========================================
// SECTION SWITCHING (Enhanced with Telegram)
// ========================================
function switchSection(section) {
    // Haptic feedback on section switch
    if (isTelegramEnvironment) {
        hapticFeedback('light');
    }
    
    // Ensure section is rendered before switching
    ensureSectionRendered(section);
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('text-green-600', 'active'));
    
    const sectionMap = {
        'home': 'homeSection',
        'profile': 'profileSection',
        'wallet': 'walletSection',
        'bonus': 'bonusSection'
    };
    
    const btnMap = {
        'home': 'homeBtn',
        'profile': 'profileBtn',
        'wallet': 'walletBtn',
        'bonus': 'bonusBtn'
    };
    
    const sectionEl = document.getElementById(sectionMap[section]);
    const btnEl = document.getElementById(btnMap[section]);
    
    if (sectionEl) sectionEl.classList.add('active');
    if (btnEl) btnEl.classList.add('text-green-600', 'active');
    
    // Show/hide Telegram BackButton
    if (tg && tg.BackButton) {
        if (section === 'home') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
    
    // Initialize section-specific functionality after rendering
    if (section === 'wallet') {
        initWalletSection(userData);
        updateWalletDisplay(userData);
    } else if (section === 'bonus') {
        initBonusSection(userData, getServerTime);
    } else if (section === 'home') {
        initHomeSection();
    } else if (section === 'profile') {
        initProfileSection();
    }
    
    // Send analytics to bot
    if (isTelegramEnvironment && telegramUser) {
        sendDataToBot({
            action: 'section_view',
            section: section,
            userId: telegramUser.id,
            timestamp: Date.now()
        });
    }
    
    updateUI();
}

// ========================================
// LEVEL SYSTEM
// ========================================
function getUserLevel(totalMined) {
    for (let i = LEVEL_MILESTONES.length - 1; i > 0; i--) {
        if (totalMined >= LEVEL_MILESTONES[i]) return i + 1;
    }
    return 1;
}

function getCurrentLevelProgress(totalMined) {
    const level = getUserLevel(totalMined);
    const start = level === 1 ? 0 : LEVEL_MILESTONES[level - 2];
    const end = level > MAX_LEVEL ? LEVEL_MILESTONES[MAX_LEVEL] : LEVEL_MILESTONES[level - 1];
    const progress = end > start ? ((totalMined - start) / (end - start)) * 100 : 100;
    return { 
        level, 
        progress: Math.min(progress, 100), 
        current: totalMined - start, 
        required: end - start 
    };
}

// ========================================
// UI UPDATE (Updated for dynamic elements)
// ========================================
function updateUI() {
    if (!userData) return;

    const totalMined = userData.totalMined || 0;
    const levelInfo = getCurrentLevelProgress(totalMined);
    const referralCount = Object.keys(userData.referrals || {}).length;
    const currentEarned = calculateCurrentEarned(userData, appSettings, getServerTime);

    const miningRate = (appSettings.mining.totalReward / appSettings.mining.miningDuration).toFixed(4);
    const balance = (userData.balance || 0).toFixed(2);
    const referralRewards = (userData.referralRewards || 0).toFixed(2);

    // Safe element updates - only update if element exists
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Update elements
    updateElement('totalBalance', `${balance} FZ`);
    updateElement('profileBalance', `${balance} FZ`);
    updateElement('walletBalance', `${balance} FZ`);
    updateElement('miningRate', `${miningRate}/hr`);
    updateElement('referralCount', referralCount);
    updateElement('totalMined', `${totalMined.toFixed(2)} FZ`);
    updateElement('currentEarned', `${currentEarned.toFixed(6)} FZ`);
    updateElement('earnedDisplay', `${currentEarned.toFixed(6)} FZ`);
    updateElement('referralRewards', `${referralRewards} FZ`);
    updateElement('refCode', userData.referralCode || '---');
    updateElement('joinDate', userData.joinDate || '---');

    // Level
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${levelInfo.progress}%`;
    
    const levelText = document.getElementById('levelText');
    if (levelText) {
        levelText.textContent = `Level ${levelInfo.level} / ${MAX_LEVEL} (${levelInfo.current}/${levelInfo.required} FZ)`;
    }

    // Referral Claim
    const claimReferralBtn = document.getElementById('claimReferralBtn');
    if (claimReferralBtn) {
        claimReferralBtn.style.display = userData.referralRewards > 0 ? 'block' : 'none';
    }

    // Referral Input
    const referralSubmitBox = document.getElementById('referralSubmitBox');
    const referralSubmittedBox = document.getElementById('referralSubmittedBox');
    if (referralSubmitBox && referralSubmittedBox) {
        const isReferred = !!userData.referredBy;
        referralSubmitBox.style.display = isReferred ? 'none' : 'block';
        referralSubmittedBox.style.display = isReferred ? 'block' : 'none';
    }

    // Mining Button State
    const miningBtn = document.getElementById('miningBtn');
    const miningStatus = document.getElementById('miningStatus');
    const timerDisplay = document.querySelector('#miningBtn .timer-display');
    
    if (miningBtn && miningStatus && timerDisplay) {
        const now = getServerTime();
        if (userData.miningStartTime && now < userData.miningEndTime) {
            miningBtn.disabled = true;
            miningBtn.classList.remove('claim');
            miningStatus.textContent = 'Active';
            miningStatus.className = 'mining-status text-green-600';
            startCountdownAndEarned(
                userData.miningEndTime,
                getServerTime,
                appSettings,
                userData,
                stopMining,
                showNotification
            );
        } else if (userData.miningStartTime && now >= userData.miningEndTime) {
            miningBtn.classList.add('claim');
            miningBtn.disabled = false;
            timerDisplay.textContent = 'Claim';
            miningStatus.textContent = 'Ready to Claim';
            miningStatus.className = 'mining-status text-yellow-600';
        } else {
            miningBtn.classList.remove('claim');
            miningBtn.disabled = false;
            timerDisplay.textContent = 'Start Mining';
            miningStatus.textContent = 'Inactive';
            miningStatus.className = 'mining-status text-gray-600';
        }
    }

    // Update bonus timer if on bonus section
    const bonusSection = document.getElementById('bonusSection');
    if (bonusSection && bonusSection.classList.contains('active')) {
        updateBonusTimer(userData, getServerTime);
    }

    checkAndStartAds();
}

// ========================================
// AD SYSTEM INTEGRATION
// ========================================
function checkAndStartAds() {
    if (!isAppFullyLoaded && userData && currentUser) {
        isAppFullyLoaded = true;
        console.log('✅ App fully loaded - Starting ad rotation');
        setAppLoaded();
    }
}

// ========================================
// MINING WRAPPERS (Enhanced with haptic feedback)
// ========================================
async function startMining() {
    try {
        if (isTelegramEnvironment) {
            hapticFeedback('medium');
        }
        
        await startMiningFunc(
            currentUser, 
            userData, 
            appSettings, 
            getServerTime, 
            showNotification,
            startCountdownAndEarned
        );
        
        // Send to bot
        if (isTelegramEnvironment && telegramUser) {
            sendDataToBot({
                action: 'mining_started',
                userId: telegramUser.id,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error("Mining start error:", error);
        showNotification("Failed to start mining", "error");
    }
}

function stopMining() {
    try {
        stopMiningFunc();
    } catch (error) {
        console.error("Mining stop error:", error);
    }
}

function claimMiningReward() {
    try {
        if (isTelegramEnvironment) {
            hapticFeedback('success');
        }
        
        claimMiningRewardFunc(
            currentUser, 
            userData, 
            appSettings, 
            getServerTime, 
            showNotification, 
            showAdModal, 
            checkReferralMilestones
        );
        
        // Send to bot
        if (isTelegramEnvironment && telegramUser) {
            sendDataToBot({
                action: 'mining_claimed',
                userId: telegramUser.id,
                amount: appSettings.mining.totalReward,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error("Claim error:", error);
        showNotification("Failed to claim reward", "error");
    }
}

// ========================================
// USER INIT (Enhanced with Telegram user linking)
// ========================================
async function initializeUserData(user) {
    if (unsubscribeUser) unsubscribeUser();
    const userRef = ref(database, `users/${user.uid}`);
    unsubscribeUser = onValue(userRef, async (snap) => {
        if (!snap.exists()) {
            await createNewUser(user);
        } else {
            userData = snap.val();
            
            // Link Telegram user if not already linked
            if (telegramUser && !userData.telegramId) {
                await linkTelegramUser(user.uid);
            }
            
            // Render home section immediately when user data is loaded
            if (!sectionsRendered.home) {
                ensureSectionRendered('home');
            }
            
            updateUI();
        }
    }, (error) => {
        console.error("User data load failed:", error);
        showNotification("Failed to load user data", "error");
    });
}

async function createNewUser(user) {
    try {
        const userRef = ref(database, `users/${user.uid}`);
        const newUserData = {
            balance: 0, 
            totalMined: 0, 
            usdtBalance: 0,
            referralCode: generateReferralCode(),
            joinDate: new Date().toISOString().split('T')[0],
            referrals: {}, 
            referralRewards: 0, 
            referralMilestones: {}, 
            transactions: {}, 
            createdAt: Date.now()
        };
        
        // Add Telegram user info if available
        if (telegramUser) {
            newUserData.telegramId = telegramUser.id;
            newUserData.telegramUsername = telegramUser.username || null;
            newUserData.telegramFirstName = telegramUser.first_name || null;
            newUserData.telegramLastName = telegramUser.last_name || null;
        }
        
        await set(userRef, newUserData);
        console.log("✅ New user created successfully");
        
        // Send to bot
        if (isTelegramEnvironment && telegramUser) {
            sendDataToBot({
                action: 'user_registered',
                userId: telegramUser.id,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error("User creation failed:", error);
        showNotification("Failed to create user account", "error");
    }
}

async function linkTelegramUser(uid) {
    try {
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
            telegramId: telegramUser.id,
            telegramUsername: telegramUser.username || null,
            telegramFirstName: telegramUser.first_name || null,
            telegramLastName: telegramUser.last_name || null,
            telegramLinkedAt: Date.now()
        });
        console.log('✅ Telegram user linked successfully');
    } catch (error) {
        console.error('❌ Failed to link Telegram user:', error);
    }
}

// ========================================
// UTILITIES
// ========================================
function logout() {
    if (isTelegramEnvironment) {
        showTelegramConfirm('Are you sure you want to logout?', (confirmed) => {
            if (confirmed) {
                performLogout();
            }
        });
    } else {
        if (confirm('Are you sure you want to logout?')) {
            performLogout();
        }
    }
}

function performLogout() {
    cleanup();
    signOut(auth).then(() => {
        if (isTelegramEnvironment) {
            tg.close();
        } else {
            location.href = 'login.html';
        }
    }).catch(error => {
        console.error("Logout error:", error);
        showNotification("Logout failed", "error");
    });
}

// ========================================
// EVENT DELEGATION FOR DYNAMIC ELEMENTS
// ========================================
function setupEventDelegation() {
    // Use event delegation on body for dynamically created elements
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        // Add haptic feedback for all clicks
        if (isTelegramEnvironment) {
            hapticFeedback('light');
        }
        
        // Mining button
        if (target.id === 'miningBtn' || target.closest('#miningBtn')) {
            const btn = document.getElementById('miningBtn');
            if (btn.classList.contains('claim')) {
                claimMiningReward();
            } else {
                startMining();
            }
        }
        
        // Referral buttons
        if (target.id === 'claimReferralBtn') {
            claimReferralRewards(currentUser, userData, showNotification, showAdModal);
        }
        if (target.id === 'submitReferralBtn') {
            submitReferralCode(currentUser, userData, appSettings, showStatus);
        }
        if (target.id === 'copyCode') {
            copyReferralCode(userData, showNotification);
        }
        if (target.id === 'shareWA') {
            shareReferralCode(userData, 'whatsapp', appSettings, showNotification);
        }
        if (target.id === 'shareTG') {
            // Use Telegram native share if available
            if (isTelegramEnvironment) {
                shareToTelegram();
            } else {
                shareReferralCode(userData, 'telegram', appSettings, showNotification);
            }
        }
        
        // Bonus button
        if (target.id === 'claimBonusBtn') {
            claimBonus(currentUser, userData, getServerTime, showNotification, showAdModal);
        }
        
        // Wallet button
        if (target.id === 'withdrawBtn') {
            handleWithdraw(currentUser, userData, showStatus);
        }
        
        // Auth button
        if (target.id === 'authBtn') {
            logout();
        }
    });
}

// ========================================
// DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    
    // Initialize Telegram Integration first
    initTelegramIntegration();
    
    console.log("✅ App initialized - Telegram Mini App ready");

    // Initialize systems
    initAdSystem();
    
    // Setup event delegation for dynamic elements
    setupEventDelegation();

    // Navigation buttons (these are static, so regular event listeners work)
    const homeBtn = document.getElementById('homeBtn');
    const profileBtn = document.getElementById('profileBtn');
    const walletBtn = document.getElementById('walletBtn');
    const bonusBtn = document.getElementById('bonusBtn');

    homeBtn?.addEventListener('click', () => switchSection('home'));
    profileBtn?.addEventListener('click', () => switchSection('profile'));
    walletBtn?.addEventListener('click', () => switchSection('wallet'));
    bonusBtn?.addEventListener('click', () => switchSection('bonus'));
});

// ========================================
// AUTH STATE
// ========================================
authUnsubscribe = onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.uid);
        listenForSettings();
        initializeUserData(user);
    } else {
        console.log("No user logged in");
        cleanup();
        
        // In Telegram, close the app instead of redirecting
        if (isTelegramEnvironment && tg) {
            tg.close();
        } else {
            location.href = 'login.html';
        }
    }
});

// Export for other modules to use
export { 
    currentUser, 
    userData, 
    appSettings, 
    getServerTime, 
    showNotification, 
    showStatus,
    updateUI,
    switchSection,
    // Telegram exports
    isTelegramEnvironment,
    telegramUser,
    hapticFeedback,
    showTelegramAlert,
    showTelegramConfirm,
    sendDataToBot,
    shareToTelegram
};