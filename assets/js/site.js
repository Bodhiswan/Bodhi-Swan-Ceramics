// Google Analytics
(function() {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
  document.head.appendChild(script);
})();

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-XXXXXXX');

// Click tracking
document.addEventListener('click', function(e) {
  const a = e.target.closest('a');
  if (!a) return;
  
  const href = a.getAttribute('href') || '';
  
  if (a.dataset.cta === 'book-class') {
    gtag('event', 'book_click', {
      event_category: 'engagement',
      event_label: href
    });
  }
  
  if (href.includes('etsy.com')) {
    gtag('event', 'etsy_click', {
      event_category: 'engagement',
      event_label: href
    });
  }
});