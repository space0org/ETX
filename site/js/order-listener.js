// Order event listener for EtherDelta smart contract
class OrderEventListener {
  constructor(web3Provider, contractAddress) {
    this.provider = web3Provider;
    this.contractAddress = contractAddress;
    this.orders = new Map();
    this.trades = new Map();
    
    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager('wss://sdex-alb-664814673.ap-southeast-2.elb.amazonaws.com/ws');
    
    // Setup WebSocket event handlers
    document.addEventListener('wsNewOrder', (event) => this.handleWsOrder(event.detail));
    document.addEventListener('wsOrderCancelled', (event) => this.handleWsOrderCancelled(event.detail));
    document.addEventListener('wsTrade', (event) => this.handleWsTrade(event.detail));
    
    // ABI for order-related events
    this.eventABI = [
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "name": "tokenGet", "type": "address"},
          {"indexed": true, "name": "amountGet", "type": "uint256"},
          {"indexed": true, "name": "tokenGive", "type": "address"},
          {"indexed": false, "name": "amountGive", "type": "uint256"},
          {"indexed": false, "name": "expires", "type": "uint256"},
          {"indexed": false, "name": "nonce", "type": "uint256"},
          {"indexed": false, "name": "user", "type": "address"}
        ],
        "name": "Order",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": false, "name": "tokenGet", "type": "address"},
          {"indexed": false, "name": "amountGet", "type": "uint256"},
          {"indexed": false, "name": "tokenGive", "type": "address"},
          {"indexed": false, "name": "amountGive", "type": "uint256"},
          {"indexed": false, "name": "expires", "type": "uint256"},
          {"indexed": false, "name": "nonce", "type": "uint256"},
          {"indexed": false, "name": "user", "type": "address"},
          {"indexed": false, "name": "v", "type": "uint8"},
          {"indexed": false, "name": "r", "type": "bytes32"},
          {"indexed": false, "name": "s", "type": "bytes32"}
        ],
        "name": "Cancel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": false, "name": "tokenGet", "type": "address"},
          {"indexed": false, "name": "amountGet", "type": "uint256"},
          {"indexed": false, "name": "tokenGive", "type": "address"},
          {"indexed": false, "name": "amountGive", "type": "uint256"},
          {"indexed": false, "name": "get", "type": "address"},
          {"indexed": false, "name": "give", "type": "address"}
        ],
        "name": "Trade",
        "type": "event"
      }
    ];
  }

  async initialize() {
    if (!this.provider) {
      throw new Error('Web3 provider not available');
    }

    // Create contract instance
    const ethers = await import('https://cdn.ethers.io/lib/ethers-5.2.esm.min.js');
    this.contract = new ethers.Contract(this.contractAddress, this.eventABI, this.provider);

    // Start listening to events
    this.listenToEvents();
    
    // Connect WebSocket
    this.wsManager.connect();
  }

  listenToEvents() {
    // Listen for new orders
    this.contract.on('Order', (tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user) => {
      const order = {
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        nonce,
        user,
        status: 'active',
        timestamp: Date.now()
      };
      
      const orderId = this.getOrderId(order);
      this.orders.set(orderId, order);
      
      // Dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('newOrder', { detail: order }));
    });

    // Listen for order cancellations
    this.contract.on('Cancel', (tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user) => {
      const orderId = this.getOrderId({
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        nonce,
        user
      });
      
      if (this.orders.has(orderId)) {
        const order = this.orders.get(orderId);
        order.status = 'cancelled';
        this.orders.set(orderId, order);
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('orderCancelled', { detail: order }));
      }
    });

    // Listen for trades
    this.contract.on('Trade', (tokenGet, amountGet, tokenGive, amountGive, get, give) => {
      const trade = {
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        buyer: get,
        seller: give,
        timestamp: Date.now(),
        txHash: null // Will be populated from transaction receipt
      };

      // Get transaction hash from event
      const txHash = trade.txHash = this.provider.getTransaction().hash;
      this.trades.set(txHash, trade);

      // Update affected orders
      this.updateOrdersForTrade(trade);

      // Dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('newTrade', { detail: trade }));
    });
  }

  updateOrdersForTrade(trade) {
    // Find and update affected orders
    for (const [orderId, order] of this.orders.entries()) {
      if (order.status !== 'active') continue;

      const isMatchingOrder = 
        order.tokenGet === trade.tokenGet &&
        order.tokenGive === trade.tokenGive &&
        (order.user === trade.buyer || order.user === trade.seller);

      if (isMatchingOrder) {
        // Calculate remaining amount
        const remainingGet = order.amountGet.sub(trade.amountGet);
        const remainingGive = order.amountGive.sub(trade.amountGive);

        if (remainingGet.isZero() && remainingGive.isZero()) {
          // Order fully filled
          order.status = 'filled';
        } else {
          // Order partially filled
          order.amountGet = remainingGet;
          order.amountGive = remainingGive;
        }
        
        this.orders.set(orderId, order);
        document.dispatchEvent(new CustomEvent('orderUpdated', { detail: order }));
      }
    }
  }

  getOrderId(order) {
    return `${order.user}-${order.nonce}`;
  }

  getActiveOrders() {
    return Array.from(this.orders.values()).filter(order => order.status === 'active');
  }

  getRecentTrades(limit = 50) {
    return Array.from(this.trades.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  handleWsOrder(order) {
    const orderId = this.getOrderId(order);
    this.orders.set(orderId, { ...order, source: 'websocket' });
    document.dispatchEvent(new CustomEvent('newOrder', { detail: order }));
  }

  handleWsOrderCancelled(order) {
    const orderId = this.getOrderId(order);
    if (this.orders.has(orderId)) {
      const existingOrder = this.orders.get(orderId);
      existingOrder.status = 'cancelled';
      this.orders.set(orderId, existingOrder);
      document.dispatchEvent(new CustomEvent('orderCancelled', { detail: existingOrder }));
    }
  }

  handleWsTrade(trade) {
    const txHash = trade.txHash || `ws-${Date.now()}-${Math.random()}`;
    this.trades.set(txHash, { ...trade, source: 'websocket' });
    this.updateOrdersForTrade(trade);
    document.dispatchEvent(new CustomEvent('newTrade', { detail: trade }));
  }
  stop() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    if (this.wsManager) {
      this.wsManager.disconnect();
    }
  }
}

// Export the listener
window.OrderEventListener = OrderEventListener;
