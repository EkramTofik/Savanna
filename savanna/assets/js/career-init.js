/**
 * Career Gateway initialization for Savanna demo pages.
 * Logs component ready events for demonstration purposes.
 * 
 * This script is externalized to comply with Content Security Policy (CSP)
 * that prohibits inline scripts.
 */

document.addEventListener("savanna:ready", function (event) {
  console.log("ሞጁል ተጫነ", event.detail);
});

document.addEventListener("savanna:job-card:mounted", function (event) {
  console.log("Job card mounted:", event.detail);
});

document.addEventListener("savanna:credential:mounted", function (event) {
  console.log("Credential mounted:", event.detail);
});
