// Configuration for Revolt Voice Assistant
// This file allows easy switching between production and development models

const config = {
    // Production configuration (final submission)
    production: {
        primaryModel: 'gemini-2.0-flash-001',
        fallbackModel: 'gemini-2.0-flash-exp',
        description: 'Production config with available models'
    },
    
    // Development configuration (for testing without rate limits)
    development: {
        primaryModel: 'gemini-2.0-flash-001',
        fallbackModel: 'gemini-2.0-flash-exp',
        description: 'Development config with available models'
    },
    
    // Testing configuration (for extensive testing)
    testing: {
        primaryModel: 'gemini-2.0-flash-exp',
        fallbackModel: 'gemini-2.0-flash-001',
        description: 'Testing config with available models'
    }
};

// Get current environment
const environment = process.env.NODE_ENV || 'production';

// Export the appropriate configuration
module.exports = {
    ...config[environment],
    environment,
    allConfigs: config
};

// Log current configuration
console.log(`🔧 Using ${environment} configuration:`);
console.log(`   Primary: ${config[environment].primaryModel}`);
console.log(`   Fallback: ${config[environment].fallbackModel}`);
console.log(`   Description: ${config[environment].description}`);
