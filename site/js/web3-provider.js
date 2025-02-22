// Modern MetaMask integration using EIP-6963
let selectedProvider = null;
let selectedAccount = null;

// Listen for provider announcements
window.addEventListener('eip6963:announceProvider', (event) => {
  if (event.detail.info.name === 'MetaMask') {
    selectedProvider = event.detail.provider;
    
    // Set up provider event listeners
    selectedProvider.on('accountsChanged', handleAccountsChanged);
    selectedProvider.on('chainChanged', handleChainChanged);
    selectedProvider.on('disconnect', handleDisconnect);
  }
});

// Handle account changes
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    selectedAccount = null;
    // Update UI to show disconnected state
    document.dispatchEvent(new CustomEvent('web3AccountChanged', { detail: null }));
  } else if (accounts[0] !== selectedAccount) {
    selectedAccount = accounts[0];
    // Update UI with new account
    document.dispatchEvent(new CustomEvent('web3AccountChanged', { detail: selectedAccount }));
  }
}

// Handle chain changes
function handleChainChanged() {
  // Reload the page on chain change as recommended by MetaMask
  window.location.reload();
}

// Handle disconnect
function handleDisconnect() {
  selectedAccount = null;
  selectedProvider = null;
  document.dispatchEvent(new CustomEvent('web3AccountChanged', { detail: null }));
}

// Initialize provider detection
window.addEventListener('load', () => {
  window.dispatchEvent(new Event('eip6963:requestProvider'));
});

// Export provider functions
window.web3Provider = {
  getProvider: () => selectedProvider,
  getSelectedAccount: () => selectedAccount,
  isConnected: () => selectedProvider !== null && selectedAccount !== null,
  connect: async () => {
    if (!selectedProvider) {
      throw new Error('No MetaMask provider found');
    }
    const accounts = await selectedProvider.request({
      method: 'eth_requestAccounts'
    });
    handleAccountsChanged(accounts);
    return accounts[0];
  }
};
