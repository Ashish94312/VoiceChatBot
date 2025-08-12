#!/usr/bin/env node

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Please run: npm run setup');
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

async function listModels() {
    try {
        console.log('🔍 Testing available models...\n');
        
        // Test common models that should be available
        const commonModels = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-2.0-flash-001',
            'gemini-2.0-flash-exp',
            'gemini-2.0-pro',
            'gemini-2.0-pro-exp',
            'gemini-1.0-pro',
            'gemini-1.0-pro-vision'
        ];
        
        console.log('Testing common models:');
        console.log('=====================\n');
        
        const workingModels = [];
        
        for (const modelName of commonModels) {
            try {
                const response = await genAI.models.generateContent({
                    model: modelName,
                    contents: "Say 'Hello' in one word.",
                    generationConfig: {
                        maxOutputTokens: 10,
                    }
                });
                console.log(`✅ ${modelName}: ${response.text}`);
                workingModels.push(modelName);
            } catch (error) {
                console.log(`❌ ${modelName}: ${error.message}`);
            }
        }
        
        console.log('\n=====================');
        console.log(`Working models: ${workingModels.length}/${commonModels.length}`);
        if (workingModels.length > 0) {
            console.log('Available models for use:');
            workingModels.forEach(model => console.log(`   • ${model}`));
        }
        

        
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
