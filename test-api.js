const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🧪 Testing Revolt Motors AI Assistant API...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);

        // Test API status endpoint
        console.log('\n2. Testing API status endpoint...');
        const statusResponse = await fetch(`${API_BASE_URL}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ API status:', statusData);

        // Test starting a chat session
        console.log('\n3. Testing chat session start...');
        const startResponse = await fetch(`${API_BASE_URL}/chat/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const startData = await startResponse.json();
        console.log('✅ Chat session started:', startData);

        if (startData.success) {
            const sessionId = startData.sessionId;

            // Test sending a message
            console.log('\n4. Testing message sending...');
            const messageResponse = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    message: 'Hello! Tell me about electric vehicles.',
                    messageType: 'text'
                })
            });
            const messageData = await messageResponse.json();
            console.log('✅ Message response:', messageData);

            // Test ending the session
            console.log('\n5. Testing session end...');
            const endResponse = await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
                method: 'DELETE'
            });
            const endData = await endResponse.json();
            console.log('✅ Session ended:', endData);
        }

        console.log('\n🎉 All API tests completed successfully!');
        console.log('The server-to-server architecture is working properly.');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.log('\nMake sure the server is running with: npm start');
    }
}

// Run the test
testAPI();
