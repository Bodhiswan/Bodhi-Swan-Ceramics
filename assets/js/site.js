// Google Analytics GA4
// TODO: Replace PLACEHOLDER_MEASUREMENT_ID with actual GA4 Measurement ID
const MEASUREMENT_ID = 'G-PLACEHOLDER_MEASUREMENT_ID';

(function() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
})();

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', MEASUREMENT_ID);

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
  
  // Track Etsy clicks (including UTM parameters)
  if (href.includes('etsy.com')) {
    gtag('event', 'etsy_click', {
      event_category: 'engagement',
      event_label: href
    });
  }
});