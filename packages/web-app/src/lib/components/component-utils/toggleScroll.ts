export function toggleScroll(active: Boolean) {
  const body = document.body;
  if (active) {
    body.style.overflowY = "hidden";
  } else {
    body.style.overflowY = "auto";
  }
}