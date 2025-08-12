#!/usr/bin/env node

const { GoogleGenAI } = require('@google/genai');
const config = require('./config');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Please run: npm run setup');
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

async function testModel(modelName) {
    try {
        console.log(`🧪 Testing model: ${modelName}`);
        
        const response = await genAI.models.generateContent({
            model: modelName,
            contents: "Say 'Hello from Revolt!' in one sentence.",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 50,
            }
        });
        
        const text = response.text;
        
        console.log(`✅ ${modelName}: ${text}`);
        return true;
    } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 Testing Gemini Models');
    console.log('========================\n');
    
    const models = [
        config.primaryModel,
        config.fallbackModel
    ];
    
    let successCount = 0;
    
    for (const model of models) {
        const success = await testModel(model);
        if (success) successCount++;
        console.log(''); // Empty line for readability
    }
    
    console.log('========================');
    console.log(`Results: ${successCount}/${models.length} models working`);
    
    if (successCount === 0) {
        console.log('❌ No models are working. Please check your API key.');
        process.exit(1);
    } else if (successCount === models.length) {
        console.log('✅ All models are working!');
    } else {
        console.log('⚠️ Some models are not available, but fallback should work.');
    }
}

main().catch(console.error);
