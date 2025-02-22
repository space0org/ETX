// Matrix chat toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('matrix-chat-toggle');
  const chatContainer = document.getElementById('matrix-chat-container');

  if (toggleButton && chatContainer) {
    toggleButton.addEventListener('click', () => {
      // Toggle chat visibility
      const isVisible = chatContainer.style.display === 'block';
      chatContainer.style.display = isVisible ? 'none' : 'block';
      
      // Update button state
      toggleButton.classList.toggle('active', !isVisible);
    });
  }
});
