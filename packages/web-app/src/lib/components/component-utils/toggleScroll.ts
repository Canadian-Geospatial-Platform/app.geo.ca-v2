export function toggleScroll(active: Boolean) {
  // Check if 'document' is defined to avoid error during server side rendering
  if (typeof document !== "undefined") {
    const body = document.body;
    body.style.overflowY = active ? "hidden" : "auto";
  }
}
