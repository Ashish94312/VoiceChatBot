const voiceButton = document.getElementById('voiceButton');
const outputDiv = document.getElementById('output');
const statusSpan = document.getElementById('status');
const networkStatus = document.getElementById('networkStatus');
const testVoiceButton = document.getElementById('testVoiceButton');

let sessionId = null;
let isConnected = false;
let recognition;
let synthesis;
let isRecording = false;
let retryCount = 0;
const maxRetries = 3;
let recognitionTimeout;
let isStartingRecognition = false;
let networkRetryDelay = 1000;
let continuousMode = false;
let lastSpeechTime = 0;
let currentUtterance = null;
let isAISpeaking = false;
let interruptionThreshold = 0.3; // 300ms to detect interruption
let lastInterruptionTime = 0;
let preferHighQualityVoice = true; // Toggle for voice quality preference
let voiceCache = new Map(); // Cache for selected voices to prevent switching issues

const API_BASE_URL = 'http://localhost:3000/api';

const logMessage = (message, type = 'info') => {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = type;
    outputDiv.appendChild(p);
    outputDiv.scrollTop = outputDiv.scrollHeight;
};

// Export logMessage globally for error handler access
window.logMessage = logMessage;

// Language detection function (client-side)
function detectLanguageFromText(text) {
    // Simple language detection based on character sets
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text)) return 'fr'; // French
    if (/[äöüß]/.test(text)) return 'de'; // German
    if (/[ñáéíóúü]/.test(text)) return 'es'; // Spanish
    return 'en'; // Default to English
}

// Get appropriate voice for language
function getVoiceForLanguage(languageCode) {
    const voices = speechSynthesis.getVoices();
    
    // Simple and reliable voice selection
    if (languageCode === 'en') {
        // For English, use the default voice or first available English voice
        const defaultVoice = voices.find(v => v.default && v.lang.startsWith('en'));
        if (defaultVoice) return defaultVoice;
        
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) return englishVoice;
    }
    
    // For other languages, find any voice that matches the language
    const voice = voices.find(v => v.lang.startsWith(languageCode));
    if (voice) return voice;
    
    // Fallback to English
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;
    
    // Final fallback
    return voices[0];
}



// Update recognition language based on conversation
function updateRecognitionLanguage(languageCode) {
    if (!recognition) return;
    
    const languageMap = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'hi': 'hi-IN',
        'zh': 'zh-CN',
        'ja': 'ja-JP',
        'ko': 'ko-KR'
    };
    
    const newLang = languageMap[languageCode] || 'en-US';
    if (recognition.lang !== newLang) {
        recognition.lang = newLang;
        logMessage(`🌍 Switched to ${languageCode.toUpperCase()} recognition`, 'info');
    }
}



// Debug function to list all available voices
window.debugAllVoices = function() {
    const voices = speechSynthesis.getVoices();
    console.log('🔊 All Available Voices:');
    voices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'} - ${voice.default ? 'Default' : 'Not Default'}`);
    });
    
    console.log('\n🎵 Voice Cache:');
    voiceCache.forEach((voice, lang) => {
        console.log(`${lang}: ${voice.name} (${voice.lang})`);
    });
};

// Check network connectivity
function checkNetworkConnectivity() {
    return navigator.onLine;
}

// Stop AI speech immediately
function stopAISpeech() {
    if (synthesis && isAISpeaking) {
        synthesis.cancel();
        isAISpeaking = false;
        currentUtterance = null;
        logMessage('🔇 AI interrupted', 'info');
    }
}

// API functions for server-to-server communication
async function startChatSession() {
    try {
        if (!checkNetworkConnectivity()) {
            throw new Error('No internet connection. Please check your network.');
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}/chat/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            sessionId = data.sessionId;
            return {
                success: true,
                sessionId: data.sessionId,
                model: data.model,
                isFallback: data.isFallback
            };
        } else {
            throw new Error(data.error || 'Failed to start session');
        }
    } catch (error) {
        console.error('Error starting chat session:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    }
}

async function sendMessage(message, messageType = 'voice') {
    if (!sessionId) {
        throw new Error('No active session');
    }

    if (!checkNetworkConnectivity()) {
        throw new Error('No internet connection. Please check your network.');
    }

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                message: message,
                messageType: messageType
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            return {
                success: true,
                response: data.response,
                model: data.model,
                isFallback: data.isFallback
            };
        } else {
            throw new Error(data.error || 'Failed to get response');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    }
}

async function endChatSession() {
    if (!sessionId) {
        return;
    }

    try {
        await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
            method: 'DELETE',
            timeout: 5000
        });
        sessionId = null;
    } catch (error) {
        console.error('Error ending session:', error);
    }
}

// Initialize Web Speech API with better error handling
function initializeSpeechAPI() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Configure for better performance like real voice assistants
        recognition.continuous = true; // Keep listening continuously
        recognition.interimResults = true; // Get interim results for interruption detection
        recognition.lang = 'en-US'; // Default language, will be updated dynamically
        recognition.maxAlternatives = 1;
        
        // Add timeout to prevent hanging
        recognition.timeout = 30000; // 30 seconds timeout
        
        recognition.onresult = async (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            let hasInterimResults = false;
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                    hasInterimResults = true;
                }
            }
            
            // Check for interruption (user speaking while AI is speaking)
            if (hasInterimResults && isAISpeaking && interimTranscript.trim().length > 2) {
                const timeSinceLastInterruption = Date.now() - lastInterruptionTime;
                if (timeSinceLastInterruption > 1000) { // Prevent multiple interruptions
                    lastInterruptionTime = Date.now();
                    stopAISpeech();
                    logMessage('🎤 Interruption detected - listening to you...', 'info');
                }
            }
            
            // If we have a final result, process it
            if (finalTranscript.trim()) {
                lastSpeechTime = Date.now();
                logMessage(`🎤 You: ${finalTranscript.trim()}`, 'user');
                
                // Detect language from user input and update recognition
                const userLanguage = detectLanguageFromText(finalTranscript);
                updateRecognitionLanguage(userLanguage);
                
                // Stop listening while processing
                try {
                    recognition.stop();
                } catch (e) {
                    console.log('Recognition already stopping');
                }
                
                // Send to AI and get response
                try {
                    const result = await sendMessage(finalTranscript.trim(), 'voice');
                    if (result.success) {
                        logMessage(`⚡ Rev: ${result.response}`, 'ai');
                        
                        // Speak the response with interruption capability
                        if (synthesis) {
                            const utterance = new SpeechSynthesisUtterance(result.response);
                            
                            // Detect language and set appropriate voice
                            const detectedLanguage = detectLanguageFromText(result.response);
                            const voice = getVoiceForLanguage(detectedLanguage);
                            
                            if (voice) {
                                utterance.voice = voice;
                                utterance.lang = voice.lang;
                                logMessage(`🔊 Using voice: ${voice.name} (${voice.lang})`, 'info');
                            }
                            
                            // Standard voice settings for good quality
                            utterance.rate = 0.9;   // Standard rate
                            utterance.pitch = 1.0;  // Natural pitch
                            utterance.volume = 0.8; // Standard volume
                            
                            // Mark AI as speaking
                            isAISpeaking = true;
                            currentUtterance = utterance;
                            
                            // Handle speech events
                            utterance.onstart = () => {
                                logMessage('🔊 AI speaking...', 'info');
                            };
                            
                            utterance.onend = () => {
                                isAISpeaking = false;
                                currentUtterance = null;
                                logMessage('✅ AI finished speaking', 'info');
                                
                                // Restart listening after AI finishes
                                if (continuousMode && isRecording) {
                                    setTimeout(() => {
                                        startRecognitionSafely();
                                    }, 300); // Short delay for natural conversation
                                }
                            };
                            
                            utterance.onerror = (event) => {
                                isAISpeaking = false;
                                currentUtterance = null;
                                console.error('Speech synthesis error:', event);
                                
                                // Restart listening after error
                                if (continuousMode && isRecording) {
                                    setTimeout(() => {
                                        startRecognitionSafely();
                                    }, 300);
                                }
                            };
                            
                            synthesis.speak(utterance);
                        } else {
                            // If no speech synthesis, restart listening after a delay
                            if (continuousMode && isRecording) {
                                setTimeout(() => {
                                    startRecognitionSafely();
                                }, 1000);
                            }
                        }
                    }
                } catch (error) {
                    if (error.message.includes('Rate limit') || error.message.includes('quota')) {
                        logMessage(`⚠️ API limit reached: ${error.message}`, 'error');
                        logMessage('💡 Please wait a moment and try again, or upgrade your API plan.', 'info');
                    } else {
                        logMessage(`❌ Error: ${error.message}`, 'error');
                    }
                    // Restart listening after error
                    if (continuousMode && isRecording) {
                        setTimeout(() => {
                            startRecognitionSafely();
                        }, 1000);
                    }
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'aborted') {
                // Normal stop, don't show error
                return;
            }
            
            if (event.error === 'network') {
                retryCount++;
                if (retryCount <= maxRetries) {
                    logMessage(`🔄 Network error, retrying... (${retryCount}/${maxRetries})`, 'info');
                    setTimeout(() => {
                        if (continuousMode && isRecording) {
                            startRecognitionSafely();
                        }
                    }, networkRetryDelay);
                    networkRetryDelay = Math.min(networkRetryDelay * 2, 8000);
                } else {
                    logMessage('❌ Speech recognition failed after multiple retries.', 'error');
                    handleRecognitionFailure();
                }
            } else if (event.error === 'no-speech') {
                // No speech detected, restart listening
                if (continuousMode && isRecording) {
                    setTimeout(() => {
                        startRecognitionSafely();
                    }, 100);
                }
            } else if (event.error === 'audio-capture') {
                logMessage('❌ Microphone not detected. Please check your microphone and permissions.', 'error');
                handleRecognitionFailure();
            } else if (event.error === 'not-allowed') {
                logMessage('❌ Microphone access denied. Please allow microphone permissions in your browser.', 'error');
                handleRecognitionFailure();
            } else if (event.error === 'service-not-allowed') {
                logMessage('❌ Speech recognition service not allowed. Please check your browser settings.', 'error');
                handleRecognitionFailure();
            } else {
                logMessage(`❌ Speech recognition error: ${event.error}`, 'error');
                if (continuousMode && isRecording) {
                    setTimeout(() => {
                        startRecognitionSafely();
                    }, 1000);
                }
            }
        };
        
        recognition.onend = () => {
            // Only restart if we're in continuous mode and still recording
            if (continuousMode && isRecording) {
                // Check if we've been silent for too long
                const timeSinceLastSpeech = Date.now() - lastSpeechTime;
                if (timeSinceLastSpeech > 30000) { // 30 seconds
                    logMessage('💤 Going to sleep due to inactivity. Tap to wake up.', 'info');
                    stopVoiceRecording();
                    return;
                }
                
                // Restart listening
                setTimeout(() => {
                    if (continuousMode && isRecording) {
                        startRecognitionSafely();
                    }
                }, 100);
            }
        };
        
        recognition.onstart = () => {
            isStartingRecognition = false;
            logMessage('🎤 Listening...', 'info');
        };
        
    } else {
        logMessage('❌ Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.', 'error');
    }
    
    // Speech Synthesis
    if ('speechSynthesis' in window) {
        synthesis = window.speechSynthesis;
    } else {
        logMessage('❌ Speech synthesis not supported in this browser', 'error');
    }
}

function startRecognitionSafely() {
    if (isStartingRecognition || !recognition || !isRecording) {
        return;
    }
    
    isStartingRecognition = true;
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        isStartingRecognition = false;
        if (error.name === 'InvalidStateError') {
            // Recognition is already running, wait a bit and try again
            setTimeout(() => {
                isStartingRecognition = false;
                if (continuousMode && isRecording) {
                    startRecognitionSafely();
                }
            }, 100);
        } else {
            handleRecognitionFailure();
        }
    }
}

function handleRecognitionFailure() {
    stopVoiceRecording();
    logMessage('💡 Tap the microphone button to try again.', 'info');
}

function stopVoiceRecording() {
    if (isRecording) {
        isRecording = false;
        continuousMode = false;
        retryCount = 0;
        networkRetryDelay = 1000;
        
        if (recognitionTimeout) {
            clearTimeout(recognitionTimeout);
            recognitionTimeout = null;
        }
        
        if (recognition && isStartingRecognition) {
            isStartingRecognition = false;
        }
        
        try {
            if (recognition) {
                recognition.stop();
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        
        // Stop any ongoing speech synthesis
        stopAISpeech();
        
        voiceButton.disabled = false;
        voiceButton.classList.remove('recording', 'connecting');
        voiceButton.textContent = '🎤';
        statusSpan.textContent = 'Tap to talk';
        logMessage('🔇 Voice input stopped.', 'info');
    }
}

// Network status monitoring
window.addEventListener('online', () => {
    logMessage('✅ Internet connection restored.', 'info');
    statusSpan.textContent = 'Tap to talk';
    networkStatus.textContent = '● Online';
    networkStatus.className = 'network-status online';
});

window.addEventListener('offline', () => {
    logMessage('❌ Internet connection lost. Some features may not work.', 'error');
    statusSpan.textContent = 'Offline - Limited functionality';
    networkStatus.textContent = '● Offline';
    networkStatus.className = 'network-status offline';
});

// Main voice button click handler - works like Siri/Alexa
voiceButton.addEventListener('click', async () => {
    if (isRecording) {
        // If already recording, stop it
        stopVoiceRecording();
        return;
    }
    
    if (!recognition) {
        logMessage('❌ Speech recognition not available.', 'error');
        return;
    }
    
    if (!checkNetworkConnectivity()) {
        logMessage('❌ No internet connection. Voice recognition requires an internet connection.', 'error');
        return;
    }
    
    // Check if server is reachable first
    try {
        const healthCheck = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (!healthCheck.ok) {
            throw new Error('Server not responding');
        }
    } catch (error) {
        logMessage('❌ Cannot connect to server. Please make sure the server is running.', 'error');
        logMessage('💡 Run "npm start" in the revolt-voice directory to start the server.', 'info');
        return;
    }
    
    // If not connected, start session first
    if (!isConnected) {
        voiceButton.disabled = true;
        voiceButton.classList.add('connecting');
        voiceButton.textContent = '🔄';
        statusSpan.textContent = 'Connecting...';
        logMessage('Connecting to Rev...', 'info');
        
        try {
            const result = await startChatSession();
            
                            if (result.success) {
                    if (result.isFallback) {
                        logMessage(`✅ Connected! (Using ${result.model} model - fallback)`, 'info');
                    } else {
                        logMessage(`✅ Connected! (Using ${result.model} model)`, 'info');
                    }
                    logMessage('🌍 Multi-language support enabled - speak in any supported language!', 'info');
                isConnected = true;
                statusSpan.textContent = 'Listening...';
                
                // Now start voice interaction
                startVoiceInteraction();
            }
        } catch (error) {
            logMessage(`❌ Failed to connect: ${error.message}`, 'error');
            if (error.message.includes('network') || error.message.includes('connection')) {
                logMessage('💡 Please check your internet connection and try again.', 'info');
            } else if (error.message.includes('500') || error.message.includes('Internal')) {
                logMessage('💡 Server error. Please check if GEMINI_API_KEY is set in .env file.', 'info');
                logMessage('💡 Create a .env file with: GEMINI_API_KEY=your_api_key_here', 'info');
            }
            statusSpan.textContent = 'Connection failed';
            voiceButton.disabled = false;
            voiceButton.classList.remove('connecting');
            voiceButton.textContent = '🎤';
        }
    } else {
        // Already connected, just start voice interaction
        startVoiceInteraction();
    }
});

function startVoiceInteraction() {
    // Check if microphone is available
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            isRecording = true;
            continuousMode = true;
            retryCount = 0;
            networkRetryDelay = 1000;
            lastSpeechTime = Date.now();
            
            voiceButton.disabled = false;
            voiceButton.classList.remove('connecting');
            voiceButton.classList.add('recording');
            voiceButton.textContent = '🔴';
            statusSpan.textContent = 'Listening...';
            logMessage('🎤 Start speaking... (You can interrupt the AI anytime)', 'info');
            
            // Start recognition safely
            startRecognitionSafely();
        })
        .catch((error) => {
            console.error('Microphone access error:', error);
            voiceButton.disabled = false;
            voiceButton.classList.remove('connecting');
            voiceButton.textContent = '🎤';
            statusSpan.textContent = 'Tap to talk';
            
            if (error.name === 'NotAllowedError') {
                logMessage('❌ Microphone access denied. Please allow microphone permissions and try again.', 'error');
            } else if (error.name === 'NotFoundError') {
                logMessage('❌ No microphone found. Please connect a microphone and try again.', 'error');
            } else {
                logMessage('❌ Microphone error: ' + error.message, 'error');
            }
        });
}

testVoiceButton.addEventListener('click', () => {
    if (synthesis) {
        const testText = "Hello! This is a test of the voice system. If you can hear this clearly, your audio is working correctly.";
        const utterance = new SpeechSynthesisUtterance(testText);
        
        // Use default voice for testing
        const voices = speechSynthesis.getVoices();
        const defaultVoice = voices.find(v => v.default) || voices[0];
        if (defaultVoice) {
            utterance.voice = defaultVoice;
            utterance.lang = defaultVoice.lang;
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        synthesis.speak(utterance);
        logMessage('🔊 Playing voice test... If you can hear the message clearly, your audio is working!', 'info');
    } else {
        logMessage('❌ Voice synthesis not available in this browser.', 'error');
    }
});

// Voice quality toggle (simplified)
const voiceQualityButton = document.getElementById('voiceQualityButton');
voiceQualityButton.addEventListener('click', () => {
    preferHighQualityVoice = !preferHighQualityVoice;
    voiceQualityButton.textContent = preferHighQualityVoice ? '🎵 High Quality' : '🎵 Standard';
    voiceQualityButton.style.background = preferHighQualityVoice ? 
        'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    
    logMessage(`🔊 Voice quality: ${preferHighQualityVoice ? 'High Quality' : 'Standard'}`, 'info');
});

// Initialize speech API when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechAPI();
    
    // Initialize network status
    if (navigator.onLine) {
        networkStatus.textContent = '● Online';
        networkStatus.className = 'network-status online';
    } else {
        networkStatus.textContent = '● Offline';
        networkStatus.className = 'network-status offline';
    }
    
    // Check server status on load
    checkServerStatus();
});

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            logMessage('✅ Server is running and ready', 'info');
        } else {
            logMessage('⚠️ Server responded with an error', 'info');
        }
    } catch (error) {
        logMessage('⚠️ Server is not running. Please start the server with "npm start"', 'info');
    }
}