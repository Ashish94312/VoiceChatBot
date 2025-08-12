#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Revolt Voice Assistant Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ .env file already exists');
} else {
    console.log('❌ .env file not found');
    console.log('Creating .env file...\n');
    
    rl.question('Enter your Google Gemini API Key (get one from https://makersuite.google.com/app/apikey): ', (apiKey) => {
        if (!apiKey.trim()) {
            console.log('❌ API key is required. Please run setup again.');
            rl.close();
            return;
        }
        
        const envContent = `# Google Gemini API Key
GEMINI_API_KEY=${apiKey.trim()}

# Server Configuration
PORT=3000

# Optional: Environment
NODE_ENV=development
`;
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully!');
        console.log('\n🎉 Setup complete! You can now run:');
        console.log('   npm start');
        rl.close();
    });
}

// Check dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json found');
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        console.log('✅ Dependencies installed');
    } else {
        console.log('❌ Dependencies not installed');
        console.log('Run: npm install');
    }
} else {
    console.log('❌ package.json not found');
}

console.log('\n📋 Next steps:');
console.log('1. Make sure you have a Google Gemini API key');
console.log('2. Run: npm install (if not already done)');
console.log('3. Run: npm start');
console.log('4. Open: http://localhost:3000');
console.log('\n🔗 Get your API key: https://makersuite.google.com/app/apikey');

if (envExists) {
    rl.close();
}
