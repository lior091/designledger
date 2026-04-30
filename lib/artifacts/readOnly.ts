export function isReadOnlyMode() {
  // Vercel (and similar) deployments should be treated as read-only when using JSON-file storage.
  // You can override locally by setting READ_ONLY=false.
  const override = process.env.READ_ONLY;
  if (override === "false") return false;
  if (override === "true") return true;
  return process.env.VERCEL === "1";
}

