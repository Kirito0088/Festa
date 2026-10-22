// A deliberate sign-out navigates somewhere itself; the app shell must not
// race it with a redirect to the sign-in page.
let signedOutAt = 0;

export function markDeliberateSignOut() {
  signedOutAt = Date.now();
}

export function isDeliberateSignOut() {
  return Date.now() - signedOutAt < 5000;
}
