// Orders display handler
document.addEventListener('DOMContentLoaded', () => {
  const ordersContainer = document.getElementById('orders-container');
  
  // Template for orders list
  const template = `
    <div class="orders-container">
      <h4>Active Orders</h4>
      <table class="table table-condensed">
        <tr>
          <th>Token Pair</th>
          <th>Price</th>
          <th>Amount</th>
          <th>Total</th>
          <th>Expires</th>
          <th>User</th>
        </tr>
        <tbody id="orders-list"></tbody>
      </table>
    </div>
  `;

  // Initialize display
  if (ordersContainer) {
    ordersContainer.innerHTML = template;
    const ordersList = document.getElementById('orders-list');

    // Listen for new orders
    document.addEventListener('newOrder', (event) => {
      const order = event.detail;
      const row = createOrderRow(order);
      ordersList.appendChild(row);
    });

    // Listen for order cancellations
    document.addEventListener('orderCancelled', (event) => {
      const order = event.detail;
      const row = document.getElementById(`order-${order.user}-${order.nonce}`);
      if (row) {
        row.classList.add('cancelled');
      }
    });

    // Listen for order updates
    document.addEventListener('orderUpdated', (event) => {
      const order = event.detail;
      const row = document.getElementById(`order-${order.user}-${order.nonce}`);
      if (row) {
        row.replaceWith(createOrderRow(order));
      }
    });
  }

  function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.id = `order-${order.user}-${order.nonce}`;
    tr.className = `order-item ${order.status === 'cancelled' ? 'cancelled' : ''}`;
    
    tr.innerHTML = `
      <td><a href="https://etherscan.io/token/${order.tokenGet}" target="_blank">${order.tokenName || order.tokenGet}</a>/ETH</td>
      <td>${(order.amountGive / order.amountGet).toFixed(5)}</td>
      <td>${order.amountGet.toFixed(3)}</td>
      <td>${order.amountGive.toFixed(3)}</td>
      <td>${new Date(order.expires * 1000).toLocaleString()}</td>
      <td><a href="https://etherscan.io/address/${order.user}" target="_blank">${order.user.slice(0, 10)}...</a></td>
    `;
    
    return tr;
  }
});
