/**
 * Bodhi Swan Ceramics - Main JavaScript
 * Consolidated functionality for navigation, analytics, and interactions
 */

// Configuration
const CONFIG = {
  // TODO: Replace with actual GA4 Measurement ID
  GA_MEASUREMENT_ID: 'G-PLACEHOLDER_MEASUREMENT_ID',
  MOBILE_BREAKPOINT: 768
};

// Analytics Setup
function initAnalytics() {
  if (CONFIG.GA_MEASUREMENT_ID !== 'G-PLACEHOLDER_MEASUREMENT_ID') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', CONFIG.GA_MEASUREMENT_ID);

    // Enhanced click tracking
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a');
      if (!a) return;
      
      const href = a.getAttribute('href') || '';
      
      // Track booking button clicks
      if (a.dataset.cta === 'book-class') {
        gtag('event', 'book_click', {
          event_category: 'engagement',
          event_label: href
        });
      }
      
      // Track Etsy clicks
      if (href.includes('etsy.com')) {
        gtag('event', 'etsy_click', {
          event_category: 'engagement',
          event_label: href
        });
      }
    });
  }
}

// Mobile Navigation and Auto-Hide Header
function initMobileNavigation() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navigation = document.querySelector('.navigation');
  const hamburger = document.querySelector('.hamburger');
  const header = document.querySelector('.header');

  if (!menuToggle || !navigation || !hamburger || !header) return;

  // Auto-hide header functionality
  let lastScrollTop = 0;
  let scrollTimeout;

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clear existing timeout
    clearTimeout(scrollTimeout);
    
    // Show header when scrolling up or at top
    if (scrollTop < lastScrollTop || scrollTop < 100) {
      header.classList.remove('hidden');
      navigation.classList.remove('hidden');
    }
    // Hide header when scrolling down
    else if (scrollTop > lastScrollTop && scrollTop > 200) {
      header.classList.add('hidden');
      navigation.classList.add('hidden');
      // Close mobile menu if open
      navigation.classList.remove('active');
      hamburger.classList.remove('active');
    }

    // Add compact class when scrolled
    if (scrollTop > 50) {
      header.classList.add('compact');
    } else {
      header.classList.remove('compact');
    }

    lastScrollTop = scrollTop;

    // Show header again after scroll stops
    scrollTimeout = setTimeout(() => {
      header.classList.remove('hidden');
      navigation.classList.remove('hidden');
    }, 1000);
  }

  // Throttled scroll handler
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
      setTimeout(() => { ticking = false; }, 16);
    }
  }

  window.addEventListener('scroll', requestTick);

  // Toggle menu
  menuToggle.addEventListener('click', () => {
    navigation.classList.toggle('active');
    hamburger.classList.toggle('active');
    // Show header when opening menu
    header.classList.remove('hidden');
    navigation.classList.remove('hidden');
  });

  // Close menu when clicking on a link (mobile only)
  document.querySelectorAll('.links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) {
        navigation.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  });

  // Handle resize events
  function handleResize() {
    if (window.innerWidth > CONFIG.MOBILE_BREAKPOINT) {
      navigation.classList.remove('active');
      hamburger.classList.remove('active');
    }
  }

  window.addEventListener('resize', handleResize);
}

// Performance optimizations
function initPerformanceOptimizations() {
  // Lazy load images that aren't already lazy loaded
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Preload critical resources
  const criticalResources = [
    '/assets/css/main.css'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
}

// Accessibility improvements
function initAccessibility() {
  // Add focus indicators for keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // Improve button accessibility
  document.querySelectorAll('.button').forEach(button => {
    if (!button.getAttribute('role')) {
      button.setAttribute('role', 'button');
    }
    
    // Add keyboard support for non-button elements
    if (button.tagName !== 'BUTTON' && button.tagName !== 'A') {
      button.setAttribute('tabindex', '0');
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    }
  });
}

// Form enhancements
function initFormEnhancements() {
  // Add form validation feedback
  document.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('invalid', (e) => {
      e.target.classList.add('error');
    });

    field.addEventListener('input', (e) => {
      if (e.target.validity.valid) {
        e.target.classList.remove('error');
      }
    });
  });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Error handling
function initErrorHandling() {
  window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    
    // Track errors in analytics if available
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: e.error.message,
        fatal: false
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: 'Unhandled promise rejection',
        fatal: false
      });
    }
  });
}

// Initialize everything when DOM is ready
function init() {
  initAnalytics();
  initMobileNavigation();
  initPerformanceOptimizations();
  initAccessibility();
  initFormEnhancements();
  initSmoothScrolling();
  initErrorHandling();

  // Add loaded class to body for CSS transitions
  document.body.classList.add('loaded');
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    CONFIG
  };
}