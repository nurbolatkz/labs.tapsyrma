export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("kk-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Converts an ISO date to the value a datetime-local input expects (local time, no seconds).
export function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null;
}
