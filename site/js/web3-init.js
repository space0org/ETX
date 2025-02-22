// Initialize Web3 with the provider from web3-provider.js
window.addEventListener('DOMContentLoaded', () => {
  // Request providers using EIP-6963
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  
  // Listen for account changes
  document.addEventListener('web3AccountChanged', (event) => {
    const account = event.detail;
    if (account) {
      // Update UI to show connected state
      document.getElementById('connection').innerHTML = `
        <span class="nav-link">
          <i class="fa fa-check-circle"></i>
          ${account.substring(0, 6)}...${account.substring(38)}
        </span>
      `;

      // Initialize order listener
      try {
        const provider = window.web3Provider.getProvider();
        if (provider) {
          const orderListener = new OrderEventListener(
            provider,
            '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819' // EtherDelta contract address
          );
          orderListener.initialize().catch(error => {
            console.error('Failed to initialize order listener:', error);
            alertify.error('Failed to load orders. Please try again.');
          });
        }
      } catch (error) {
        console.error('Error initializing order listener:', error);
        alertify.error('Failed to initialize order system. Please refresh and try again.');
      }
    } else {
      // Update UI to show disconnected state
      document.getElementById('connection').innerHTML = `
        <span class="nav-link text-warning">
          <i class="fa fa-exclamation-circle"></i>
          Not Connected
        </span>
      `;
    }
  });
});
