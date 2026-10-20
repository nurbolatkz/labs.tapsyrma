// Shared payload helpers for labs scored by the generic validator in server.py.
// `fields` are answer ids sent as-is; `tables` maps a table answer id to the row ids it must contain.
export function genericPayload(fields, tables = {}) {
  return {
    isComplete(answers) {
      const filled = (v) => String(v ?? "").trim() !== "";
      return fields.every((id) => (tables[id] ? tables[id].every((row) => filled(answers[id]?.[row])) : filled(answers[id]))) &&
        String(answers.conclusion || "").trim().length >= 20;
    },
    toPayload(answers) {
      return { answers: Object.fromEntries(fields.map((id) => [id, answers[id]])), conclusion: answers.conclusion };
    },
    fromPayload(p) {
      return { answers: { ...(p.answers || {}), conclusion: p.conclusion }, captures: {} };
    },
  };
}
