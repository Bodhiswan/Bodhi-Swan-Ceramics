/**
 * Bodhi Swan Ceramics - Modern JavaScript
 * Apple-inspired interactions and animations
 */

class BodhiSwanApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupScrollEffects();
    this.setupAnimations();
    this.setupAccessibility();
    this.setupPerformance();
  }

  // Navigation System
  setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    const navLinks = document.querySelectorAll('.nav-mobile-menu a');

    if (navToggle && navMobile) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
      });

      // Close menu when clicking links
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navToggle.classList.remove('active');
          navMobile.classList.remove('active');
          document.body.style.overflow = '';
        });
      });

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMobile.classList.contains('active')) {
          navToggle.classList.remove('active');
          navMobile.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
  }

  // Scroll Effects
  setupScrollEffects() {
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNav = () => {
      const currentScrollY = window.scrollY;
      
      if (nav) {
        // Hide nav when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          nav.classList.add('hidden');
        } else {
          nav.classList.remove('hidden');
        }
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });

    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.card, .hero-content, section > *').forEach(el => {
      observer.observe(el);
    });
  }

  // Smooth Animations
  setupAnimations() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        
        if (target) {
          const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
          const targetPosition = target.offsetTop - navHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Parallax effect for hero sections
    const parallaxElements = document.querySelectorAll('.hero');
    
    if (parallaxElements.length > 0) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
          const rate = scrolled * -0.5;
          element.style.transform = `translateY(${rate}px)`;
        });
      }, { passive: true });
    }

    // Hover effects for cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  // Accessibility Enhancements
  setupAccessibility() {
    // Keyboard navigation for custom elements
    document.querySelectorAll('.btn, .card').forEach(element => {
      if (!element.hasAttribute('tabindex') && element.tagName !== 'A' && element.tagName !== 'BUTTON') {
        element.setAttribute('tabindex', '0');
      }

      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });

    // Focus management for mobile menu
    const navToggle = document.querySelector('.nav-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    const firstNavLink = document.querySelector('.nav-mobile-menu a');

    if (navToggle && navMobile && firstNavLink) {
      navToggle.addEventListener('click', () => {
        setTimeout(() => {
          if (navMobile.classList.contains('active')) {
            firstNavLink.focus();
          }
        }, 100);
      });
    }

    // Announce page changes for screen readers
    this.announcePageChanges();
  }

  announcePageChanges() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    document.body.appendChild(announcer);

    // Announce when navigation changes
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const pageName = link.textContent.trim();
        announcer.textContent = `Navigating to ${pageName}`;
      });
    });
  }

  // Performance Optimizations
  setupPerformance() {
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // Preload critical resources
    const preloadLinks = [
      { href: '/assets/css/style.css', as: 'style' },
      { href: '/assets/js/app.js', as: 'script' }
    ];

    preloadLinks.forEach(link => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.href = link.href;
      preloadLink.as = link.as;
      document.head.appendChild(preloadLink);
    });

    // Service Worker registration (if available)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  // Utility Methods
  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Analytics (placeholder for future implementation)
  trackEvent(eventName, properties = {}) {
    // Placeholder for analytics tracking
    console.log('Event tracked:', eventName, properties);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BodhiSwanApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - pause animations, etc.
    document.body.classList.add('page-hidden');
  } else {
    // Page is visible - resume animations
    document.body.classList.remove('page-hidden');
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BodhiSwanApp;
}