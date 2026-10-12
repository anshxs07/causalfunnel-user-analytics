
(function () {
  const API_URL = "http://localhost:4000/api/events";
  const STORAGE_KEY = "causalfunnel_session_id";

  // Create or reuse a session ID
  function getSessionId() {
    let sessionId = localStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
      sessionId =
        "sess_" +
        (window.crypto?.randomUUID
          ? crypto.randomUUID()
          : Date.now() + "_" + Math.random().toString(36).slice(2));

      localStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
  }

  const sessionId = getSessionId();

  // Send event to backend
  function trackEvent(eventType, extraData = {}) {
    const eventData = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...extraData
    };

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventData),
      keepalive: true
    }).catch((error) => {
      console.error("Analytics tracking failed:", error);
    });
  }

  // Track page view
  trackEvent("page_view");

  // Track clicks across the webpage
  document.addEventListener("click", function (event) {
    trackEvent("click", {
      click_x: event.clientX,
      click_y: event.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  });

  // Expose a small public API for manual tracking if needed
  window.CausalFunnel = {
    track: trackEvent,
    sessionId
  };
})();
