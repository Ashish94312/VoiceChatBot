const { franc } = require('franc');

// Test language detection
const testPhrases = [
    "Hello, how are you?",
    "Hola, ¿cómo estás?",
    "Bonjour, comment allez-vous?",
    "Hallo, wie geht es dir?",
    "Ciao, come stai?",
    "Olá, como você está?",
    "Привет, как дела?",
    "こんにちは、お元気ですか？",
    "안녕하세요, 어떻게 지내세요?",
    "你好，你好吗？",
    "नमस्ते, आप कैसे हैं?",
    "مرحبا، كيف حالك؟"
];

console.log('Testing language detection...\n');

testPhrases.forEach((phrase, index) => {
    const detected = franc(phrase, { minLength: 3 });
    const languageNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'hi': 'Hindi',
        'ar': 'Arabic'
    };
    
    console.log(`${index + 1}. "${phrase}"`);
    console.log(`   Detected: ${detected} (${languageNames[detected] || 'Unknown'})`);
    console.log('');
});

console.log('Language detection test completed!');
