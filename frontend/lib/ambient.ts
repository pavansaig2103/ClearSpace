export function emitAmbientFocus(focused: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("clearspace:focus", { detail: { focused } }));
}

export function emitAmbientPulse() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("clearspace:pulse"));
}

