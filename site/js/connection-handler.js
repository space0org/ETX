// MetaMask connection handler
document.addEventListener('DOMContentLoaded', () => {
  const connectButton = document.getElementById('metamask-connect');
  if (connectButton) {
    connectButton.addEventListener('click', async () => {
      try {
        const provider = window.web3Provider.getProvider();
        if (!provider) {
          alertify.error('MetaMask not detected. Please install MetaMask.');
          return;
        }

        // Request accounts using modern MetaMask API
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
          // Verify we're on the correct network (Ethereum Mainnet)
          const chainId = await provider.request({
            method: 'eth_chainId'
          });

          if (chainId !== '0x1') {
            alertify.error('Please connect to Ethereum Mainnet');
            return;
          }

          // Update UI to show connected state
          connectButton.innerHTML = `
            <i class="fa fa-check"></i> Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}
          `;
          connectButton.classList.remove('btn-primary');
          connectButton.classList.add('btn-success');

          // Trigger account changed event for other components
          document.dispatchEvent(new CustomEvent('web3AccountChanged', {
            detail: accounts[0]
          }));
        }
      } catch (error) {
        console.error('Connection error:', error);
        alertify.error('Failed to connect to MetaMask. Please try again.');
      }
    });
  }
});
