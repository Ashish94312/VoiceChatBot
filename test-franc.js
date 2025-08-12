const { franc } = require('franc');

console.log('Testing franc library...\n');

const testTexts = [
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

testTexts.forEach((text, index) => {
    try {
        const detected = franc(text);
        console.log(`${index + 1}. "${text}"`);
        console.log(`   Detected: ${detected}`);
        console.log('');
    } catch (error) {
        console.error(`Error detecting language for "${text}":`, error);
    }
});

console.log('Franc test completed!');
