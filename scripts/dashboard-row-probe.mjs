// Serialized into the browser by Playwright; keep this function self-contained.
export function installRowProbe({ href, tableName }) {
  window.__khataoneStopRowProbe?.();
  window.__khataoneClickTime = null;
  window.__khataoneRowProbe = null;
  let observer;
  let timer;
  const stop = () => {
    observer?.disconnect();
    clearTimeout(timer);
    document.removeEventListener("click", onClick, true);
  };
  const inspect = () => {
    if (window.__khataoneClickTime === null) return;
    const region = [...document.querySelectorAll('[role="region"]')]
      .find((element) => element.getAttribute("aria-label") === tableName);
    const row = region?.querySelector("tbody tr");
    if (!row || row.closest('[aria-busy="true"]')) return;
    const bounds = row.getBoundingClientRect();
    const style = getComputedStyle(row);
    if (!bounds.width || !bounds.height || style.visibility === "hidden" || style.visibility === "collapse") return;
    const observed = performance.now();
    window.__khataoneRowProbe = {
      click_unix_ms: performance.timeOrigin + window.__khataoneClickTime,
      visible_dom_unix_ms: performance.timeOrigin + observed,
      click_to_visible_dom_ms: observed - window.__khataoneClickTime,
    };
    stop();
  };
  function onClick(event) {
    const anchor = event.target.closest?.("a");
    if (!anchor || new URL(anchor.href).pathname !== href) return;
    window.__khataoneClickTime = performance.now();
    document.removeEventListener("click", onClick, true);
    observer = new MutationObserver(inspect);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    inspect();
  }
  window.__khataoneStopRowProbe = stop;
  document.addEventListener("click", onClick, true);
  timer = setTimeout(stop, 30000);
}
