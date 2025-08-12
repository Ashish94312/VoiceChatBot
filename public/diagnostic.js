// Diagnostic tool for troubleshooting network and voice issues
window.diagnoseIssues = function() {
    const results = [];
    
    // Check network connectivity
    results.push(`🌐 Network: ${navigator.onLine ? 'Online' : 'Offline'}`);
    
    // Check Web Speech API support
    const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    results.push(`🎤 Speech Recognition: ${speechRecognition ? 'Supported' : 'Not Supported'}`);
    
    // Check Speech Synthesis support
    results.push(`🔊 Speech Synthesis: ${'speechSynthesis' in window ? 'Supported' : 'Not Supported'}`);
    
    // Check microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                results.push(`🎙️ Microphone: Accessible`);
                console.log('Diagnostic Results:', results);
            })
            .catch((error) => {
                results.push(`🎙️ Microphone: ${error.name} - ${error.message}`);
                console.log('Diagnostic Results:', results);
            });
    } else {
        results.push(`🎙️ Microphone: getUserMedia not supported`);
        console.log('Diagnostic Results:', results);
    }
    
    // Check browser
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    results.push(`🌍 Browser: ${browser}`);
    
    // Check language support
    results.push(`🌐 Language Support: English, Español, Français, Deutsch, हिंदी, 中文, 日本語, 한국어`);
    
    // Check available voices
    if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        const voiceLanguages = [...new Set(voices.map(v => v.lang.split('-')[0]))];
        results.push(`🔊 Available Voice Languages: ${voiceLanguages.join(', ')}`);
        results.push(`🔊 Total Voices: ${voices.length}`);
    }
    
    // Check if server is reachable
    fetch('http://localhost:3000/health', { 
        method: 'GET', 
        signal: AbortSignal.timeout(5000) 
    })
        .then(response => {
            if (response.ok) {
                results.push(`🖥️ Server: Reachable (${response.status})`);
            } else {
                results.push(`🖥️ Server: Error (${response.status})`);
            }
            console.log('Diagnostic Results:', results);
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                results.push(`🖥️ Server: Timeout - Server not responding`);
            } else {
                results.push(`🖥️ Server: Unreachable - ${error.message}`);
            }
            console.log('Diagnostic Results:', results);
        });
    
    return results;
};

// Add diagnostic button functionality
document.addEventListener('DOMContentLoaded', () => {
    const diagnosticButton = document.getElementById('diagnosticButton');
    
    if (diagnosticButton) {
        diagnosticButton.addEventListener('click', () => {
            const results = window.diagnoseIssues();
            console.log('🔍 Diagnostic Results:', results);
            
            // Show results in chat
            if (window.logMessage) {
                window.logMessage('🔍 <strong>Diagnostic Results:</strong>', 'info');
                results.forEach(result => {
                    window.logMessage(`• ${result}`, 'info');
                });
            }
        });
    }
    
    // Add voice debugging function
    window.debugVoices = function() {
        if ('speechSynthesis' in window) {
            const voices = speechSynthesis.getVoices();
            console.log('🔊 Available Voices:');
            voices.forEach(voice => {
                console.log(`  - ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
            });
            
            // Test Hindi voice specifically
            const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('in'));
            if (hindiVoice) {
                console.log(`✅ Hindi voice found: ${hindiVoice.name} (${hindiVoice.lang})`);
                const utterance = new SpeechSynthesisUtterance("नमस्ते, यह हिंदी में एक टेस्ट है।");
                utterance.voice = hindiVoice;
                utterance.lang = hindiVoice.lang;
                speechSynthesis.speak(utterance);
            } else {
                console.log('❌ No Hindi voice found');
            }
        }
    };
});
