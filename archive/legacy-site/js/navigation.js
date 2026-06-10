// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navigation = document.querySelector('.navigation');
  const hamburger = document.querySelector('.hamburger');

  menuToggle.addEventListener('click', () => {
    navigation.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close menu when clicking on a link (for mobile)
  document.querySelectorAll('.links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navigation.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  });

  // Update menu toggle visibility based on screen size
  function handleResize() {
    if (window.innerWidth > 768) {
      navigation.classList.remove('active');
      hamburger.classList.remove('active');
    }
  }

  window.addEventListener('resize', handleResize);
});