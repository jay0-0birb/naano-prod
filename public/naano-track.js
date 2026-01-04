/**
 * Naano Tracking Script
 * 
 * Embed this script on your SaaS website to track 3-second rule
 * 
 * Usage:
 * <script src="https://konex.app/naano-track.js" data-event-id="EVENT_ID"></script>
 * 
 * Or inline:
 * <script>
 *   window.naanoEventId = 'EVENT_ID';
 *   (function() {
 *     var script = document.createElement('script');
 *     script.src = 'https://konex.app/naano-track.js';
 *     script.async = true;
 *     document.head.appendChild(script);
 *   })();
 * </script>
 */

(function() {
  'use strict';

  // Get event ID from data attribute or global variable
  var eventId = null;
  var scriptTag = document.querySelector('script[data-event-id]');
  
  if (scriptTag) {
    eventId = scriptTag.getAttribute('data-event-id');
  } else if (window.naanoEventId) {
    eventId = window.naanoEventId;
  }

  if (!eventId) {
    console.warn('Naano: eventId not found');
    return;
  }

  // Track time on site
  var startTime = Date.now();
  var hasReported = false;
  var minTimeSeconds = 3;

  // Report when user stays 3+ seconds
  function reportTimeOnSite() {
    if (hasReported) return;
    
    var timeOnSite = Math.floor((Date.now() - startTime) / 1000);
    
    if (timeOnSite >= minTimeSeconds) {
      hasReported = true;
      
      // Send to tracking API
      fetch('https://konex.app/api/track/3sec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          timeOnSite: timeOnSite,
        }),
      }).catch(function(error) {
        console.warn('Naano: Failed to report time on site', error);
      });
    }
  }

  // Report on page visibility change (user leaves)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      reportTimeOnSite();
    }
  });

  // Report when user navigates away
  window.addEventListener('beforeunload', function() {
    reportTimeOnSite();
  });

  // Report after 3 seconds
  setTimeout(reportTimeOnSite, minTimeSeconds * 1000);

  // Also report on scroll (user is engaged)
  var scrollReported = false;
  window.addEventListener('scroll', function() {
    if (!scrollReported) {
      scrollReported = true;
      setTimeout(reportTimeOnSite, 1000); // Report 1 second after scroll
    }
  }, { once: true });
})();

