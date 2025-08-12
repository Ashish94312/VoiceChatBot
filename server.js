const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
const { franc } = require('franc');
const config = require('./config');
require('dotenv').config();

// Load your API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY; 
if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not set in environment variables.');
    console.error('💡 Please create a .env file with your API key:');
    console.error('   GEMINI_API_KEY=your_google_gemini_api_key_here');
    console.error('🔗 Get your API key from: https://makersuite.google.com/app/apikey');
    console.error('💡 Or run: npm run setup');
    process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// Track active connections and sessions
const activeConnections = new Set();
const chatSessions = new Map();

// Language detection and mapping
function detectLanguage(text) {
    try {
        const detected = franc(text, { minLength: 3 });
        
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
        
        const mappedLanguage = languageMap[detected] || detected;
        return mappedLanguage !== 'und' ? mappedLanguage : 'en';
    } catch (error) {
        console.error('Language detection error:', error);
        return 'en';
    }
}

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        activeConnections: activeConnections.size,
        activeSessions: chatSessions.size,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running',
        model: config.primaryModel,
        fallback: config.fallbackModel,
        environment: config.environment,
        languageSupport: ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja', 'ko'],
        activeConnections: activeConnections.size,
        activeSessions: chatSessions.size
    });
});

// REST API endpoints for server-to-server communication
app.post('/api/chat/start', async (req, res) => {
    try {
        const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initialize Gemini chat session with optimized settings
        let chatSession;
        let modelUsed = 'gemini-1.5-flash';
        let isFallback = false;
        
        try {
            // Default to English for initial session
            const initialLanguage = 'en';
            const systemPrompt = languagePrompts[initialLanguage];
            const welcomeMessage = {
                'en': "Hello! I'm Rev, your Revolt Motors AI assistant. I'm here to help with all things electric vehicles. How can I assist you today?",
                'es': "¡Hola! Soy Rev, tu asistente de IA de Revolt Motors. Estoy aquí para ayudar con todo lo relacionado con vehículos eléctricos. ¿Cómo puedo ayudarte hoy?",
                'fr': "Bonjour ! Je suis Rev, votre assistant IA Revolt Motors. Je suis ici pour vous aider avec tout ce qui concerne les véhicules électriques. Comment puis-je vous aider aujourd'hui ?",
                'de': "Hallo! Ich bin Rev, Ihr Revolt Motors KI-Assistent. Ich bin hier, um bei allem zu helfen, was mit Elektrofahrzeugen zu tun hat. Wie kann ich Ihnen heute helfen?",
                'hi': "नमस्ते! मैं रेव हूं, आपका रेवोल्ट मोटर्स AI सहायक। मैं इलेक्ट्रिक वाहनों से संबंधित सभी चीजों में मदद करने के लिए यहां हूं। मैं आज आपकी कैसे मदद कर सकता हूं?",
                'zh': "你好！我是Rev，您的Revolt Motors AI助手。我在这里帮助您处理所有与电动汽车相关的事情。我今天如何帮助您？",
                'ja': "こんにちは！私はRevです。Revolt MotorsのAIアシスタントです。電気自動車に関するすべてのことをお手伝いします。今日はどのようにお手伝いできますか？",
                'ko': "안녕하세요! 저는 Rev입니다. Revolt Motors AI 어시스턴트입니다. 전기 자동차와 관련된 모든 것을 도와드리기 위해 여기 있습니다. 오늘 어떻게 도와드릴까요?"
            };

            // Create chat session with new SDK
            chatSession = {
                model: config.primaryModel,
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: "model",
                        parts: [{ text: welcomeMessage[initialLanguage] }]
                    }
                ]
            };
            
        } catch (error) {
            console.error('Primary model failed, trying fallback:', error);
            
            // Try fallback model (for development/testing)
            try {
                chatSession = {
                    model: config.fallbackModel,
                    history: [
                        {
                            role: "user",
                            parts: [{ text: "You are Rev, a helpful AI assistant for Revolt Motors, an electric vehicle company. You help customers with information about electric vehicles, charging, maintenance, and general EV-related questions. Be knowledgeable, friendly, and professional. Keep responses concise (under 50 words) for natural conversation flow. Always identify yourself as Rev. Respond conversationally and naturally and support multiple languages." }]
                        },
                        {
                            role: "model",
                            parts: [{ text: "Hello! I'm Rev, your Revolt Motors AI assistant. I'm here to help with all things electric vehicles. How can I assist you today?" }]
                        }
                    ]
                };
                
                modelUsed = config.fallbackModel;
                isFallback = true;
                
            } catch (fallbackError) {
                console.error('All models failed:', fallbackError);
                return res.status(500).json({ 
                    error: 'Failed to start chat session',
                    details: 'All AI models are currently unavailable'
                });
            }
        }
        
        // Store session
        chatSessions.set(sessionId, {
            chatSession,
            modelUsed,
            isFallback,
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0
        });
        
        res.json({ 
            success: true,
            sessionId,
            model: modelUsed,
            isFallback,
            message: 'Chat session started successfully'
        });
        
    } catch (error) {
        console.error('Error starting chat session:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.post('/api/chat/message', async (req, res) => {
    try {
        const { sessionId, message, messageType = 'voice' } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'sessionId and message are required' 
            });
        }
        
        const session = chatSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ 
                error: 'Session not found',
                details: 'Chat session has expired or does not exist' 
            });
        }
        
        // Update last activity and message count
        session.lastActivity = new Date();
        session.messageCount++;
        
        // Detect language from user message
        const detectedLanguage = detectLanguage(message);
        const languageCode = detectedLanguage in languagePrompts ? detectedLanguage : 'en';
        
        // Get language-specific prompt
        const systemPrompt = languagePrompts[languageCode];
        
        // Optimize response based on message count and type
        let optimizedPrompt = message;
        if (session.messageCount === 1) {
            // First message - be welcoming
            optimizedPrompt = `User says: "${message}". This is their first message. Respond warmly and ask how you can help with electric vehicles.`;
        } else if (message.toLowerCase().includes('thank') || message.toLowerCase().includes('thanks') || 
                   message.toLowerCase().includes('gracias') || message.toLowerCase().includes('merci') ||
                   message.toLowerCase().includes('danke') || message.toLowerCase().includes('धन्यवाद') ||
                   message.toLowerCase().includes('谢谢') || message.toLowerCase().includes('ありがとう') ||
                   message.toLowerCase().includes('감사합니다')) {
            // Thank you message - be appreciative
            optimizedPrompt = `User says: "${message}". They're thanking you. Respond warmly and offer to help with anything else.`;
        } else if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye') ||
                   message.toLowerCase().includes('adiós') || message.toLowerCase().includes('au revoir') ||
                   message.toLowerCase().includes('auf wiedersehen') || message.toLowerCase().includes('अलविदा') ||
                   message.toLowerCase().includes('再见') || message.toLowerCase().includes('さようなら') ||
                   message.toLowerCase().includes('안녕히')) {
            // Goodbye message - be friendly
            optimizedPrompt = `User says: "${message}". They're saying goodbye. Respond warmly and invite them back anytime.`;
        }
        
        // Add language context to the prompt
        optimizedPrompt = `${systemPrompt}\n\nUser message (${languageCode}): ${optimizedPrompt}\n\nRespond in the same language as the user's message.`;
        
        try {
            // Add the user message to history
            session.chatSession.history.push({
                role: "user",
                parts: [{ text: optimizedPrompt }]
            });

            // Generate response using new SDK
            const response = await genAI.models.generateContent({
                model: session.chatSession.model,
                contents: session.chatSession.history,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 150,
                    candidateCount: 1,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            });

            const text = response.text;
            
            // Add the model response to history
            session.chatSession.history.push({
                role: "model",
                parts: [{ text: text }]
            });
            
            // Ensure response is concise for natural conversation
            const maxLength = 200;
            const finalResponse = text.length > maxLength ? 
                text.substring(0, maxLength) + '...' : text;
            
            res.json({ 
                success: true,
                response: finalResponse,
                messageType,
                model: session.modelUsed,
                isFallback: session.isFallback,
                responseTime: Date.now() - session.lastActivity.getTime()
            });
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Handle rate limiting and quota issues
            if (error.status === 429) {
                res.status(429).json({ 
                    error: 'Rate limit exceeded',
                    details: 'Too many requests. Please wait a moment and try again.',
                    retryAfter: error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || '60s'
                });
            } else if (error.message.includes('quota') || error.message.includes('Quota')) {
                res.status(429).json({ 
                    error: 'API quota exceeded',
                    details: 'Daily/monthly quota limit reached. Please try again later or upgrade your plan.',
                    suggestion: 'Consider using a different API key or upgrading your Gemini API plan'
                });
            } else {
                res.status(500).json({ 
                    error: 'Failed to get AI response',
                    details: error.message 
                });
            }
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.delete('/api/chat/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (chatSessions.has(sessionId)) {
            chatSessions.delete(sessionId);
            res.json({ 
                success: true,
                message: 'Session ended successfully' 
            });
        } else {
            res.status(404).json({ 
                error: 'Session not found' 
            });
        }
        
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// WebSocket for real-time communication (optional, for backward compatibility)
wss.on('connection', ws => {
    console.log('Client connected via WebSocket');
    activeConnections.add(ws);

    ws.on('message', async message => {
        try {
            if (typeof message !== 'string') {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                return;
            }

            const data = JSON.parse(message);
            
            if (!data.type) {
                ws.send(JSON.stringify({ type: 'error', message: 'Message type is required' }));
                return;
            }

            // Handle WebSocket messages using the same logic as REST API
            if (data.type === 'startSession') {
                const response = await fetch(`http://localhost:${PORT}/api/chat/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: data.sessionId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    ws.send(JSON.stringify({ 
                        type: 'sessionStarted', 
                        sessionId: result.sessionId,
                        model: result.model,
                        fallback: result.isFallback 
                    }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: result.error }));
                }
                
            } else if (data.type === 'textInput' || data.type === 'voiceInput') {
                if (!data.sessionId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Session ID is required' }));
                    return;
                }
                
                const response = await fetch(`http://localhost:${PORT}/api/chat/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: data.sessionId,
                        message: data.text,
                        messageType: data.type === 'voiceInput' ? 'voice' : 'text'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    ws.send(JSON.stringify({ 
                        type: data.type === 'voiceInput' ? 'voiceResponse' : 'textResponse',
                        text: result.response,
                        model: result.model
                    }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: result.error }));
                }
            }

        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Processing error' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        activeConnections.delete(ws);
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
        activeConnections.delete(ws);
    });
});

// Clean up expired sessions (older than 1 hour)
setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [sessionId, session] of chatSessions.entries()) {
        if (session.lastActivity < oneHourAgo) {
            console.log(`Cleaning up expired session: ${sessionId}`);
            chatSessions.delete(sessionId);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🚀 Revolt Voice Assistant Server');
    console.log('================================');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 API status: http://localhost:${PORT}/api/status`);
    console.log(`🎤 Voice interface: http://localhost:${PORT}`);
    console.log('================================');
});