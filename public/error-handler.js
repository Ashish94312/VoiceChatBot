// Global error handler for better debugging
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Log to chat if available
    if (window.logMessage) {
        window.logMessage('❌ An unexpected error occurred. Please refresh the page and try again.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Log to chat if available
    if (window.logMessage) {
        window.logMessage('❌ A network or processing error occurred. Please try again.');
    }
});

// Handle WebSocket connection errors
window.addEventListener('beforeunload', function(event) {
    // Clean up any active connections
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.close();
    }
});

// Export logMessage function globally for error handler access
window.logMessage = function(message) {
    const outputDiv = document.getElementById('output');
    if (outputDiv) {
        outputDiv.innerHTML += `<p>${message}</p>`;
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }
};
