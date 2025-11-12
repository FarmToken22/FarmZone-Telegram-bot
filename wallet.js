// wallet.js - Wallet Section Module (Enhanced for Telegram Mini App)
import { auth, database } from './config.js';
import { ref, get, update, push } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Import Telegram utilities from app.js
let isTelegramEnvironment = false;
let telegramUser = null;
let hapticFeedback = null;
let showTelegramAlert = null;
let showTelegramConfirm = null;
let sendDataToBot = null;

// Initialize Telegram utilities
export function initTelegramUtils(utils) {
    isTelegramEnvironment = utils.isTelegramEnvironment;
    telegramUser = utils.telegramUser;
    hapticFeedback = utils.hapticFeedback;
    showTelegramAlert = utils.showTelegramAlert;
    showTelegramConfirm = utils.showTelegramConfirm;
    sendDataToBot = utils.sendDataToBot;
}

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderWalletSection() {
    const container = document.getElementById('walletSection');
    if (!container) {
        console.error('Wallet section container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="p-3 sm:p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
            <!-- Wallet Header Card -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-xl sm:text-2xl font-bold">My Wallet</h2>
                        <p class="text-blue-100 text-sm">Manage your FZ tokens</p>
                    </div>
                </div>
            </div>
            
            <!-- Balance Display -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <div class="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 class="text-sm uppercase text-gray-600 font-semibold">Total Balance</h4>
                    </div>
                    <p id="walletBalance" class="text-4xl font-bold text-green-600 mt-2">0.00 FZ</p>
                    <p class="text-xs text-gray-500 mt-2">Available for withdrawal</p>
                </div>
            </div>
            
            <!-- Withdraw Section -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Withdraw FZ Tokens
                </h3>
                
                <div class="space-y-4">
                    <!-- Wallet Address Input -->
                    <div>
                        <label for="walletAddress" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Wallet Address
                        </label>
                        <input 
                            id="walletAddress" 
                            type="text" 
                            placeholder="Enter your FZ wallet address" 
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                        <p class="text-xs text-gray-500 mt-1">Make sure the address is correct. Transactions cannot be reversed.</p>
                    </div>
                    
                    <!-- Amount Input -->
                    <div>
                        <label for="withdrawAmount" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Amount (FZ)
                        </label>
                        <input 
                            id="withdrawAmount" 
                            type="number" 
                            placeholder="0.00 FZ" 
                            step="0.01"
                            min="10"
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                        <p class="text-xs text-gray-500 mt-1">Minimum withdrawal: <strong>10 FZ</strong></p>
                    </div>
                    
                    <!-- Quick Amount Buttons -->
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="25">25 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="50">50 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="100">100 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="max">Max</button>
                        </div>
                    </div>
                    
                    <!-- Withdraw Button -->
                    <button 
                        id="withdrawBtn" 
                        class="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-lg shadow text-base font-semibold hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Withdraw Now
                    </button>
                    <p id="withdrawStatus" class="status text-center"></p>
                </div>
            </div>
            
            <!-- Withdrawal Info -->
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Withdrawal Information
                </h4>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li class="flex items-start gap-2">
                        <span class="text-yellow-500 font-bold">•</span>
                        <span>Minimum withdrawal amount: <strong>10 FZ</strong></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-yellow-500 font-bold">•</span>
                        <span>Processing time: <strong>1-3 business days</strong></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-yellow-500 font-bold">•</span>
                        <span>Withdrawal fee: <strong>Free</strong></span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-yellow-500 font-bold">•</span>
                        <span>Double-check your wallet address before submitting</span>
                    </li>
                </ul>
            </div>
            
            <!-- Transaction History -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Transaction History
                </h3>
                <div id="transactionList" class="space-y-3 max-h-80 overflow-y-auto">
                    <p class="text-gray-500 text-sm text-center py-4">No transactions yet.</p>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
                    <div class="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-xs text-gray-600 font-semibold">Completed</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800" id="completedCount">0</p>
                </div>
                
                <div class="bg-white rounded-lg shadow p-3 border-l-4 border-yellow-500">
                    <div class="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-xs text-gray-600 font-semibold">Pending</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800" id="pendingCount">0</p>
                </div>
            </div>
        </div>
    `;
    
    // Setup quick amount buttons after rendering
    setupQuickAmountButtons();
    
    console.log('✅ Wallet section rendered dynamically');
}

// ========================================
// QUICK AMOUNT BUTTONS (Enhanced with Haptic Feedback)
// ========================================
function setupQuickAmountButtons() {
    const quickButtons = document.querySelectorAll('.quick-amount-btn');
    const amountInput = document.getElementById('withdrawAmount');
    const walletBalance = document.getElementById('walletBalance');
    
    quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Haptic feedback
            if (hapticFeedback) hapticFeedback('light');
            
            const amount = btn.dataset.amount;
            
            if (amount === 'max') {
                // Get current balance from display
                const balanceText = walletBalance?.textContent || '0.00 FZ';
                const balance = parseFloat(balanceText.replace(' FZ', ''));
                if (amountInput) amountInput.value = balance.toFixed(2);
            } else {
                if (amountInput) amountInput.value = amount;
            }
        });
    });
}

// ========================================
// WALLET DISPLAY
// ========================================
export function updateWalletDisplay(userData) {
    const walletBalanceEl = document.getElementById('walletBalance');
    if (walletBalanceEl) {
        walletBalanceEl.textContent = `${(userData.balance || 0).toFixed(2)} FZ`;
    }
    
    updateTransactionHistory(userData);
    updateTransactionStats(userData);
}

// Update transaction history
function updateTransactionHistory(userData) {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) return;
    
    const transactions = userData.transactions || {};
    const txArray = Object.entries(transactions).map(([id, tx]) => ({id, ...tx}));
    txArray.sort((a, b) => b.timestamp - a.timestamp);
    
    if (txArray.length === 0) {
        transactionList.innerHTML = `
            <div class="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-gray-500 text-sm">No transactions yet.</p>
                <p class="text-gray-400 text-xs mt-1">Your withdrawal history will appear here.</p>
            </div>
        `;
        return;
    }
    
    transactionList.innerHTML = txArray.map(tx => {
        const date = new Date(tx.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusConfig = {
            completed: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: '✓', label: 'Completed' },
            pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⏳', label: 'Pending' },
            failed: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '✗', label: 'Failed' }
        };
        
        const status = statusConfig[tx.status] || statusConfig.pending;
        
        return `
            <div class="${status.bg} ${status.border} border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <div class="bg-white rounded-full p-2 border ${status.border}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${status.color}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-800">${tx.type === 'withdraw' ? 'Withdrawal' : 'Deposit'}</span>
                            <p class="text-xs text-gray-500">${formattedDate} at ${formattedTime}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="${status.color} font-bold text-lg">${status.icon}</span>
                        <p class="text-xs ${status.color} font-medium mt-1">${status.label}</p>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Amount:</span>
                        <span class="font-bold text-gray-800">${tx.amount.toFixed(2)} FZ</span>
                    </div>
                    ${tx.address ? `
                        <div class="text-xs text-gray-500 mt-2">
                            <span class="font-medium">Address:</span>
                            <p class="bg-white rounded px-2 py-1 mt-1 truncate border border-gray-200 font-mono">${tx.address}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Update transaction statistics
function updateTransactionStats(userData) {
    const completedEl = document.getElementById('completedCount');
    const pendingEl = document.getElementById('pendingCount');
    
    if (!completedEl || !pendingEl) return;
    
    const transactions = userData.transactions || {};
    const txArray = Object.values(transactions);
    
    const completed = txArray.filter(tx => tx.status === 'completed').length;
    const pending = txArray.filter(tx => tx.status === 'pending').length;
    
    completedEl.textContent = completed;
    pendingEl.textContent = pending;
}

// ========================================
// WITHDRAWAL HANDLER (Enhanced with Telegram Features)
// ========================================
export async function handleWithdraw(currentUser, userData, showStatus) {
    const addressInput = document.getElementById('walletAddress');
    const amountInput = document.getElementById('withdrawAmount');
    const statusEl = document.getElementById('withdrawStatus');
    
    const address = addressInput?.value.trim();
    const amount = parseFloat(amountInput?.value || 0);
    
    // Validation with Telegram alerts
    if (!address) {
        if (showTelegramAlert) {
            showTelegramAlert('⚠️ Please enter a wallet address');
        }
        showStatus(statusEl, 'Please enter a wallet address', true);
        return;
    }
    
    if (!amount || amount <= 0) {
        if (showTelegramAlert) {
            showTelegramAlert('⚠️ Please enter a valid amount');
        }
        showStatus(statusEl, 'Please enter a valid amount', true);
        return;
    }
    
    if (amount > userData.balance) {
        if (showTelegramAlert) {
            showTelegramAlert('❌ Insufficient balance');
        }
        showStatus(statusEl, 'Insufficient balance', true);
        return;
    }
    
    const MIN_WITHDRAW = 10;
    if (amount < MIN_WITHDRAW) {
        if (showTelegramAlert) {
            showTelegramAlert(`⚠️ Minimum withdrawal is ${MIN_WITHDRAW} FZ`);
        }
        showStatus(statusEl, `Minimum withdrawal is ${MIN_WITHDRAW} FZ`, true);
        return;
    }
    
    // Confirmation dialog with Telegram
    const confirmWithdraw = () => {
        return new Promise((resolve) => {
            if (showTelegramConfirm) {
                showTelegramConfirm(
                    `Confirm withdrawal of ${amount.toFixed(2)} FZ to address:\n${address.substring(0, 20)}...?`,
                    resolve
                );
            } else {
                const result = confirm(`Confirm withdrawal of ${amount.toFixed(2)} FZ?`);
                resolve(result);
            }
        });
    };
    
    const confirmed = await confirmWithdraw();
    if (!confirmed) {
        if (hapticFeedback) hapticFeedback('warning');
        return;
    }
    
    try {
        // Haptic feedback for processing
        if (hapticFeedback) hapticFeedback('medium');
        
        const userRef = ref(database, `users/${currentUser.uid}`);
        const newBalance = userData.balance - amount;
        
        // Create transaction record
        const transactionsRef = ref(database, `users/${currentUser.uid}/transactions`);
        const newTxRef = push(transactionsRef);
        
        const transaction = {
            type: 'withdraw',
            amount: amount,
            address: address,
            status: 'pending',
            timestamp: Date.now(),
            // Add Telegram user info if available
            ...(telegramUser && {
                telegramUserId: telegramUser.id,
                telegramUsername: telegramUser.username || null
            })
        };
        
        await update(userRef, {
            balance: newBalance
        });
        
        await update(newTxRef, transaction);
        
        // Success haptic feedback
        if (hapticFeedback) hapticFeedback('success');
        
        // Show success alert
        if (showTelegramAlert) {
            showTelegramAlert('✅ Withdrawal request submitted successfully!\n\nProcessing time: 1-3 business days');
        }
        
        showStatus(statusEl, '✅ Withdrawal request submitted!', false);
        
        // Send analytics to bot
        if (sendDataToBot && isTelegramEnvironment && telegramUser) {
            sendDataToBot({
                action: 'withdrawal_requested',
                userId: telegramUser.id,
                amount: amount,
                address: address.substring(0, 20),
                timestamp: Date.now()
            });
        }
        
        // Clear inputs
        if (addressInput) addressInput.value = '';
        if (amountInput) amountInput.value = '';
        
        // Update display
        updateWalletDisplay({
            ...userData,
            balance: newBalance,
            transactions: {
                ...userData.transactions,
                [newTxRef.key]: transaction
            }
        });
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        
        // Error haptic feedback
        if (hapticFeedback) hapticFeedback('error');
        
        if (showTelegramAlert) {
            showTelegramAlert('❌ Failed to process withdrawal. Please try again.');
        }
        
        showStatus(statusEl, 'Failed to process withdrawal', true);
    }
}

function showStatus(el, message, isError = false) {
    if (!el) return;
    
    // Add haptic feedback
    if (hapticFeedback) {
        hapticFeedback(isError ? 'error' : 'success');
    }
    
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => el.className = 'status', 3000);
}

// ========================================
// INITIALIZE
// ========================================
export function initWalletSection(userData) {
    if (!userData) {
        console.warn('Cannot initialize wallet section: userData is null');
        return;
    }
    
    updateWalletDisplay(userData);
    
    // Log to Telegram bot if available
    if (sendDataToBot && isTelegramEnvironment && telegramUser) {
        sendDataToBot({
            action: 'wallet_viewed',
            userId: telegramUser.id,
            balance: userData.balance,
            timestamp: Date.now()
        });
    }
    
    console.log('✅ Wallet section initialized');
}

// Export display functions
export { updateTransactionHistory, updateTransactionStats };