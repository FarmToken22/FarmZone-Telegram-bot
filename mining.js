// mining.js - Mining related functions
import { database } from './config.js';
import { ref, get, update, serverTimestamp, runTransaction, push, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

export let countdownInterval = null;

// ========================================
// MINING CALCULATIONS
// ========================================
export function calculateCurrentEarned(userData, appSettings, getServerTime) {
    if (!userData?.miningStartTime) return 0;
    const durationSec = appSettings.mining.miningDuration * 3600;
    const rewardPerSec = appSettings.mining.totalReward / durationSec;
    const now = getServerTime();
    if (now >= userData.miningEndTime) return appSettings.mining.totalReward;
    const elapsed = Math.floor((now - userData.miningStartTime) / 1000);
    return Math.min(elapsed * rewardPerSec, appSettings.mining.totalReward);
}

// ========================================
// COUNTDOWN + EARNED DISPLAY (একসাথে)
// ========================================
export function startCountdownAndEarned(
    endTime, 
    getServerTime, 
    appSettings, 
    userData, 
    stopMining, 
    showNotification
) {
    clearInterval(countdownInterval);
    
    const timerEl = document.querySelector('#miningBtn .timer-display');
    const earnedEl = document.getElementById('currentEarned');
    const displayEl = document.getElementById('earnedDisplay');

    countdownInterval = setInterval(() => {
        const now = getServerTime();
        const leftSec = Math.max(0, Math.floor((endTime - now) / 1000));
        const earned = calculateCurrentEarned(userData, appSettings, getServerTime);
        const roundedEarned = Number(earned.toFixed(6));

        // Update Timer
        if (timerEl) {
            timerEl.textContent = leftSec > 0 ? formatTime(leftSec) : 'Claim';
        }

        // Update Earned (দুটো জায়গায়)
        const earnedText = `${roundedEarned.toFixed(6)} FZ`;
        if (earnedEl) earnedEl.textContent = earnedText;
        if (displayEl) displayEl.textContent = earnedText;

        // Mining শেষ?
        if (leftSec <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            stopMining();
            showNotification(`Mining complete! Claim ${appSettings.mining.totalReward} FZ.`);
        }
    }, 1000); // প্রতি সেকেন্ডে আপডেট
}

function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// ========================================
// START MINING
// ========================================
export async function startMining(currentUser, userData, appSettings, getServerTime, showNotification, startCountdownAndEarned) {
    if (!currentUser) return showNotification('Login required.', 'error');
    if (userData.miningStartTime && getServerTime() < userData.miningEndTime) {
        return showNotification('Mining already active.', 'error');
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    try {
        const startTime = serverTimestamp();
        const durationMs = appSettings.mining.miningDuration * 3600 * 1000;

        // Step 1: Set start time
        await update(userRef, { miningStartTime: startTime });

        // Step 2: Get actual server start time
        const snap = await get(userRef);
        const actualStart = snap.val().miningStartTime;
        const endTime = actualStart + durationMs;

        // Step 3: Set end time
        await update(userRef, { miningEndTime: endTime });

        // Step 4: Start countdown + earned display
        startCountdownAndEarned(
            endTime,
            getServerTime,
            appSettings,
            { ...userData, miningStartTime: actualStart, miningEndTime: endTime },
            stopMining,
            showNotification
        );

        showNotification(`Mining started for ${appSettings.mining.miningDuration} hours!`);
    } catch (err) {
        console.error("Start mining error:", err);
        showNotification('Failed to start mining.', 'error');
    }
}

// ========================================
// STOP MINING (UI Ready to Claim) — ফিক্সড: Invalid left-hand side
// ========================================
export function stopMining() {
    const btn = document.getElementById('miningBtn');
    const status = document.getElementById('miningStatus');
    const timerEl = btn?.querySelector('.timer-display');

    if (btn) {
        btn.classList.add('claim');
        btn.disabled = false;
    }
    if (timerEl) {
        timerEl.textContent = 'Claim'; // ফিক্সড: setAttribute → textContent
    }
    if (status) {
        status.textContent = 'Ready to Claim';
        status.className = 'mining-status';
    }
}

// ========================================
// CLAIM MINING REWARD (ফিক্সড: Unexpected token '|' এরর)
// ========================================
export async function claimMiningReward(
    currentUser, 
    userData, 
    appSettings, 
    getServerTime, 
    showNotification, 
    showAdModal, 
    checkReferralMilestones
) {
    const userRef = ref(database, `users/${currentUser.uid}`);
    const now = getServerTime();
    const reward = appSettings.mining.totalReward;

    try {
        const result = await runTransaction(userRef, (data) => {
            // ফিক্সড: সঠিক বন্ধনী, কোনো ভুল || নেই
            if (
                !data || 
                !data.miningStartTime || 
                now < data.miningEndTime || 
                data.miningEndTime === null
            ) {
                return; // Abort transaction
            }
            return {
                ...data,
                balance: (data.balance || 0) + reward,
                totalMined: (data.totalMined || 0) + reward,
                miningStartTime: null,
                miningEndTime: null
            };
        });

        if (result.committed) {
            await recordMiningTransaction(currentUser.uid, reward);
            showNotification(`Claimed ${reward.toFixed(2)} FZ!`);
            showAdModal();
            if (userData.referredBy) await checkReferralMilestones(currentUser.uid);
        } else {
            showNotification('Not ready to claim yet.', 'error');
        }
    } catch (err) {
        console.error("Claim error:", err);
        showNotification('Claim failed.', 'error');
    }
}

async function recordMiningTransaction(uid, amount) {
    const txRef = push(ref(database, `users/${uid}/transactions`));
    await set(txRef, { 
        type: 'mining', 
        amount, 
        description: 'Mining Reward', 
        timestamp: serverTimestamp(), 
        status: 'completed' 
    });
}

// ========================================
// CLEANUP
// ========================================
export function cleanupMining() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}