// Order UI handler
document.addEventListener('DOMContentLoaded', () => {
  let orderListener = null;

  // Initialize order listener when Web3 is connected
  document.addEventListener('web3AccountChanged', async (event) => {
    const account = event.detail;
    if (account && window.web3Provider) {
      const provider = window.web3Provider.getProvider();
      
      // Initialize order listener with contract address
      orderListener = new OrderEventListener(
        provider,
        '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819'
      );
      
      try {
        await orderListener.initialize();
      } catch (error) {
        console.error('Failed to initialize order listener:', error);
        alertify.error('Failed to load orders. Please try again.');
      }
    } else if (orderListener) {
      // Stop listening when disconnected
      orderListener.stop();
      orderListener = null;
    }
  });

  // Handle new orders
  document.addEventListener('newOrder', (event) => {
    const order = event.detail;
    updateOrdersUI([order], 'add');
  });

  // Handle cancelled orders
  document.addEventListener('orderCancelled', (event) => {
    const order = event.detail;
    updateOrdersUI([order], 'cancel');
  });

  function updateOrdersUI(orders, action) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    orders.forEach(order => {
      if (action === 'add') {
        const orderElement = createOrderElement(order);
        ordersList.appendChild(orderElement);
      } else if (action === 'cancel') {
        const existingOrder = document.getElementById(`order-${order.id}`);
        if (existingOrder) {
          existingOrder.classList.add('cancelled');
        }
      }
    });
  }

  function createOrderElement(order) {
    const div = document.createElement('div');
    div.id = `order-${order.id}`;
    div.className = 'order-item';
    
    div.innerHTML = `
      <div class="order-details">
        <span class="token-get">${order.tokenGet}</span>
        <span class="amount-get">${order.amountGet}</span>
        <span class="token-give">${order.tokenGive}</span>
        <span class="amount-give">${order.amountGive}</span>
        <span class="expires">Expires: ${new Date(order.expires * 1000).toLocaleString()}</span>
      </div>
    `;
    
    return div;
  }
});
