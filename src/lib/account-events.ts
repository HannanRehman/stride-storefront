export function notifyAccount() {
  window.dispatchEvent(new Event("stride-account"));
  try {
    localStorage.setItem("stride-account-event", crypto.randomUUID());
  } catch {
    /* This tab still receives the event. */
  }
}
