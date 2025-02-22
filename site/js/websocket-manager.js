// WebSocket manager for order stream
class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('Connected to order stream');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Dispatch connection event
      document.dispatchEvent(new CustomEvent('wsConnected'));
    };

    this.ws.onclose = () => {
      console.log('Disconnected from order stream');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
  }

  handleMessage(data) {
    switch(data.type) {
      case 'newOrder':
        document.dispatchEvent(new CustomEvent('wsNewOrder', { detail: data.order }));
        break;
      case 'orderCancelled':
        document.dispatchEvent(new CustomEvent('wsOrderCancelled', { detail: data.order }));
        break;
      case 'trade':
        document.dispatchEvent(new CustomEvent('wsTrade', { detail: data.trade }));
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      
      console.log(`Reconnecting attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      document.dispatchEvent(new CustomEvent('wsMaxReconnectFailed'));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export the manager
window.WebSocketManager = WebSocketManager;
