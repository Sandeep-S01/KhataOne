// Serialized into Chromium by Playwright. Records timing only, never form values.
export function installFeedbackProbe({ tagName, label }) {
  window.__khataoneFeedbackProbe = null;
  let observer;
  let timer;
  const stop = () => {
    observer?.disconnect();
    clearTimeout(timer);
    document.removeEventListener("click", onClick, true);
  };
  window.__khataoneStopFeedbackProbe?.();
  window.__khataoneStopFeedbackProbe = stop;
  function inspect() {
    const result = window.__khataoneFeedbackProbe;
    if (!result || result.feedback_ms !== null) return;
    const visible = [...document.querySelectorAll('[role="status"]')].some((element) => {
      if (!/Updating results|Loading page/.test(element.textContent ?? "")) return false;
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility === "visible";
    });
    if (visible) {
      result.feedback_ms = Math.round(performance.now() - result.click_time_ms);
      stop();
    }
  }
  function onClick(event) {
    const target = event.target.closest?.(tagName);
    if (!target || target.textContent?.trim() !== label) return;
    window.__khataoneFeedbackProbe = { click_time_ms: performance.now(), feedback_ms: null };
    document.removeEventListener("click", onClick, true);
    observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    inspect();
  }
  document.addEventListener("click", onClick, true);
  timer = setTimeout(stop, 30000);
}
