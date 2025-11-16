// Main Application Logic - Updated for Multiple Data Files Support
// index.js - Version 3.0 - Support for data.js, data1.js, data2.js, etc.

(function() {
    'use strict';

    // DOM Elements
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatArea = document.getElementById('chatArea');
    
    // State
    let isLoading = false;
    let allAnswers = {};

    // Merge all data files
    function loadAllData() {
        // Merge data from all available files
        if (window.FARMZONE_ANSWERS) {
            allAnswers = { ...allAnswers, ...window.FARMZONE_ANSWERS };
        }
        if (window.FARMZONE_ANSWERS_1) {
            allAnswers = { ...allAnswers, ...window.FARMZONE_ANSWERS_1 };
        }
        if (window.FARMZONE_ANSWERS_2) {
            allAnswers = { ...allAnswers, ...window.FARMZONE_ANSWERS_2 };
        }
        
        console.log('Total categories loaded:', Object.keys(allAnswers).length);
    }

    // Utility Functions
    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        if (role === 'assistant') {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '📋 Copy';
            copyBtn.onclick = () => copyToClipboard(content, copyBtn);
            contentDiv.appendChild(copyBtn);
        }
        
        messageDiv.appendChild(contentDiv);
        messagesDiv.appendChild(messageDiv);
        scrollToBottom();
    }

    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = 'loading';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="loading">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        `;
        messagesDiv.appendChild(loadingDiv);
        scrollToBottom();
    }

    function hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
    }

    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            button.innerHTML = '✓ Copied';
            setTimeout(() => {
                button.innerHTML = '📋 Copy';
            }, 2000);
        });
    }

    // Smart Search Function - searches through all data files
    function searchKnowledge(query) {
        // Check if data is loaded
        if (Object.keys(allAnswers).length === 0) {
            return 'Sorry, data is loading. Please refresh the page.';
        }

        const q = query.toLowerCase();

        // Check all categories
        for (const category in allAnswers) {
            if (category === 'default') continue; // Check default last
            
            const data = allAnswers[category];
            const keywords = data.keywords;
            
            // Check if any keyword matches
            for (const keyword of keywords) {
                if (q.includes(keyword.toLowerCase())) {
                    return data.answer;
                }
            }
        }

        // If no keyword matches, check general category
        if (allAnswers.general) {
            for (const keyword of allAnswers.general.keywords) {
                if (q.includes(keyword.toLowerCase())) {
                    return allAnswers.general.answer;
                }
            }
        }

        // Finally return default answer
        return allAnswers.default ? allAnswers.default.answer : "Sorry, I can't answer this question.";
    }

    // Main Message Handler
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isLoading) return;

        isLoading = true;
        sendBtn.disabled = true;
        
        addMessage('user', message);
        messageInput.value = '';
        showLoading();

        // Simulate AI thinking time
        setTimeout(() => {
            hideLoading();
            const answer = searchKnowledge(message);
            addMessage('assistant', answer);
            isLoading = false;
            sendBtn.disabled = false;
            messageInput.focus();
        }, 800);
    }

    // Event Listeners
    function initializeEventListeners() {
        sendBtn.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        messageInput.focus();
    }

    // Initialize App
    function init() {
        loadAllData();
        console.log('FZ AI Chatbot initialized - Multi-file Support Mode');
        console.log('Data files loaded:', {
            'data.js': !!window.FARMZONE_ANSWERS,
            'data1.js': !!window.FARMZONE_ANSWERS_1,
            'data2.js': !!window.FARMZONE_ANSWERS_2
        });
        initializeEventListeners();
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();