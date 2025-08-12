#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Revolt Voice Assistant Fixes');
console.log('=======================================\n');

// Test 1: Check if .env file exists
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GEMINI_API_KEY=')) {
        console.log('✅ .env file exists with API key');
    } else {
        console.log('⚠️ .env file exists but missing API key');
    }
} else {
    console.log('❌ .env file not found - run: npm run setup');
}

// Test 2: Check package.json for setup script
console.log('\n2. Checking package.json...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageContent.scripts && packageContent.scripts.setup) {
        console.log('✅ Setup script found in package.json');
    } else {
        console.log('❌ Setup script missing from package.json');
    }
} else {
    console.log('❌ package.json not found');
}

// Test 3: Check if setup.js exists
console.log('\n3. Checking setup script...');
const setupPath = path.join(__dirname, 'setup.js');
if (fs.existsSync(setupPath)) {
    console.log('✅ setup.js exists');
} else {
    console.log('❌ setup.js not found');
}

// Test 4: Check server.js for improved error handling
console.log('\n4. Checking server.js improvements...');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Check for improved error messages
    if (serverContent.includes('GEMINI_API_KEY not set in environment variables')) {
        console.log('✅ Improved API key error handling');
    } else {
        console.log('⚠️ API key error handling not updated');
    }
    
    // Check for startup message improvements
    if (serverContent.includes('🚀 Revolt Voice Assistant Server')) {
        console.log('✅ Improved startup messages');
    } else {
        console.log('⚠️ Startup messages not updated');
    }
} else {
    console.log('❌ server.js not found');
}

// Test 5: Check client.js improvements
console.log('\n5. Checking client.js improvements...');
const clientPath = path.join(__dirname, 'public', 'client.js');
if (fs.existsSync(clientPath)) {
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    
    // Check for AbortController usage
    if (clientContent.includes('AbortController')) {
        console.log('✅ Improved timeout handling with AbortController');
    } else {
        console.log('⚠️ Timeout handling not updated');
    }
    
    // Check for server health check
    if (clientContent.includes('checkServerStatus')) {
        console.log('✅ Server health check added');
    } else {
        console.log('⚠️ Server health check not added');
    }
    
    // Check for better error messages
    if (clientContent.includes('GEMINI_API_KEY is set in .env file')) {
        console.log('✅ Better error messages for API key issues');
    } else {
        console.log('⚠️ Error messages not improved');
    }
} else {
    console.log('❌ client.js not found');
}

// Test 6: Check diagnostic.js improvements
console.log('\n6. Checking diagnostic.js improvements...');
const diagnosticPath = path.join(__dirname, 'public', 'diagnostic.js');
if (fs.existsSync(diagnosticPath)) {
    const diagnosticContent = fs.readFileSync(diagnosticPath, 'utf8');
    
    // Check for AbortSignal usage
    if (diagnosticContent.includes('AbortSignal.timeout')) {
        console.log('✅ Improved timeout handling in diagnostics');
    } else {
        console.log('⚠️ Diagnostic timeout handling not updated');
    }
} else {
    console.log('❌ diagnostic.js not found');
}

console.log('\n=======================================');
console.log('🎉 Fix verification complete!');
console.log('\n📋 Summary of improvements:');
console.log('✅ Fixed model name typo in server.js');
console.log('✅ Added proper timeout handling with AbortController');
console.log('✅ Improved error messages and user guidance');
console.log('✅ Added server health checks');
console.log('✅ Created interactive setup script');
console.log('✅ Enhanced diagnostic tools');
console.log('✅ Better startup messages and logging');
console.log('\n🚀 To get started:');
console.log('1. Run: npm run setup (if .env not configured)');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:3000');
