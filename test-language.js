#!/usr/bin/env node

const { GoogleGenAI } = require('@google/genai');
const { franc } = require('franc');
const config = require('./config');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Please run: npm run setup');
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Language-specific prompts
const languagePrompts = {
    'en': "You are Rev, a helpful AI assistant for Revolt Motors, an electric vehicle company. You help customers with information about electric vehicles, charging, maintenance, and general EV-related questions. Be knowledgeable, friendly, and professional. Keep responses concise (under 50 words) for natural conversation flow. Always identify yourself as Rev. Respond conversationally and naturally.",
    'es': "Eres Rev, un asistente de IA útil para Revolt Motors, una empresa de vehículos eléctricos. Ayudas a los clientes con información sobre vehículos eléctricos, carga, mantenimiento y preguntas generales relacionadas con vehículos eléctricos. Sé conocedor, amigable y profesional. Mantén las respuestas concisas (menos de 50 palabras) para un flujo de conversación natural. Siempre identifícate como Rev. Responde de manera conversacional y natural.",
    'fr': "Vous êtes Rev, un assistant IA utile pour Revolt Motors, une entreprise de véhicules électriques. Vous aidez les clients avec des informations sur les véhicules électriques, la recharge, la maintenance et les questions générales liées aux véhicules électriques. Soyez compétent, amical et professionnel. Gardez les réponses concises (moins de 50 mots) pour un flux de conversation naturel. Identifiez-vous toujours comme Rev. Répondez de manière conversationnelle et naturelle.",
    'de': "Sie sind Rev, ein hilfreicher KI-Assistent für Revolt Motors, ein Elektrofahrzeugunternehmen. Sie helfen Kunden mit Informationen über Elektrofahrzeuge, Ladung, Wartung und allgemeine EV-bezogene Fragen. Seien Sie sachkundig, freundlich und professionell. Halten Sie Antworten prägnant (unter 50 Wörtern) für einen natürlichen Gesprächsfluss. Identifizieren Sie sich immer als Rev. Antworten Sie gesprächsweise und natürlich.",
    'hi': "आप रेव हैं, रेवोल्ट मोटर्स के लिए एक सहायक AI सहायक, एक इलेक्ट्रिक वाहन कंपनी। आप ग्राहकों को इलेक्ट्रिक वाहनों, चार्जिंग, रखरखाव और सामान्य EV-संबंधित प्रश्नों के बारे में जानकारी प्रदान करते हैं। जानकार, मित्रवत और पेशेवर बनें। प्राकृतिक बातचीत के लिए प्रतिक्रियाओं को संक्षिप्त रखें (50 शब्दों से कम)। हमेशा खुद को रेव के रूप में पहचानें। बातचीत और स्वाभाविक रूप से जवाब दें।",
    'zh': "您是Rev，Revolt Motors（一家电动汽车公司）的有用AI助手。您帮助客户了解电动汽车、充电、维护和一般电动汽车相关问题。要知识渊博、友好和专业。保持回答简洁（少于50个单词）以实现自然对话流程。始终将自己识别为Rev。以对话和自然的方式回应。",
    'ja': "あなたはRevです。電気自動車会社のRevolt Motorsの役立つAIアシスタントです。電気自動車、充電、メンテナンス、一般的なEV関連の質問について顧客をサポートします。知識豊富で、親しみやすく、プロフェッショナルでいてください。自然な会話の流れのために回答を簡潔に保ってください（50語未満）。常に自分をRevとして識別してください。会話的で自然に応答してください。",
    'ko': "당신은 전기 자동차 회사인 Revolt Motors의 유용한 AI 어시스턴트인 Rev입니다. 전기 자동차, 충전, 유지보수 및 일반적인 EV 관련 질문에 대한 정보로 고객을 돕습니다. 지식이 풍부하고 친근하며 전문적이 되세요. 자연스러운 대화 흐름을 위해 답변을 간결하게 유지하세요 (50단어 미만). 항상 자신을 Rev로 식별하세요. 대화적이고 자연스럽게 응답하세요."
};

// Test messages in different languages
const testMessages = {
    'en': "Hello, I'm interested in electric vehicles. Can you tell me about charging options?",
    'es': "Hola, estoy interesado en vehículos eléctricos. ¿Puedes contarme sobre las opciones de carga?",
    'fr': "Bonjour, je m'intéresse aux véhicules électriques. Pouvez-vous me parler des options de recharge?",
    'de': "Hallo, ich interessiere mich für Elektrofahrzeuge. Können Sie mir etwas über Ladeoptionen erzählen?",
    'hi': "नमस्ते, मुझे इलेक्ट्रिक वाहनों में रुचि है। क्या आप मुझे चार्जिंग विकल्पों के बारे में बता सकते हैं?",
    'zh': "你好，我对电动汽车感兴趣。你能告诉我充电选项吗？",
    'ja': "こんにちは、電気自動車に興味があります。充電オプションについて教えていただけますか？",
    'ko': "안녕하세요, 전기 자동차에 관심이 있습니다. 충전 옵션에 대해 알려주실 수 있나요?"
};

async function testLanguage(languageCode, message) {
    try {
        console.log(`\n🧪 Testing ${languageCode.toUpperCase()}: "${message}"`);
        
        const systemPrompt = languagePrompts[languageCode];
        const fullPrompt = `${systemPrompt}\n\nUser message (${languageCode}): ${message}\n\nRespond in the same language as the user's message.`;
        
        const response = await genAI.models.generateContent({
            model: config.primaryModel,
            contents: fullPrompt,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
            }
        });
        
        const text = response.text;
        
        // Detect language of response
        const detectedLanguage = franc(text, { minLength: 3 });
        
        // Map franc language codes to our language codes
        const languageMap = {
            'eng': 'en',
            'spa': 'es', 
            'fra': 'fr',
            'deu': 'de',
            'hin': 'hi',
            'cmn': 'zh',
            'jpn': 'ja',
            'kor': 'ko'
        };
        
        const mappedLanguage = languageMap[detectedLanguage] || detectedLanguage;
        
        console.log(`✅ Response (${detectedLanguage} -> ${mappedLanguage}): ${text}`);
        return mappedLanguage === languageCode;
    } catch (error) {
        console.log(`❌ Error testing ${languageCode}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🌍 Testing Multi-Language Support');
    console.log('==================================\n');
    
    const languages = Object.keys(testMessages);
    let successCount = 0;
    
    for (const languageCode of languages) {
        const message = testMessages[languageCode];
        const success = await testLanguage(languageCode, message);
        if (success) successCount++;
    }
    
    console.log('\n==================================');
    console.log(`Results: ${successCount}/${languages.length} languages working correctly`);
    
    if (successCount === languages.length) {
        console.log('✅ All languages are working perfectly!');
    } else if (successCount > 0) {
        console.log('⚠️ Some languages may have issues, but basic functionality should work.');
    } else {
        console.log('❌ Language support is not working properly.');
    }
    
    console.log('\n🌍 Supported Languages:');
    languages.forEach(lang => {
        const langNames = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'hi': 'हिंदी',
            'zh': '中文',
            'ja': '日本語',
            'ko': '한국어'
        };
        console.log(`   • ${langNames[lang]} (${lang})`);
    });
}

main().catch(console.error);
