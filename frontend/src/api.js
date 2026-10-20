// Thin wrapper around the Python server API. Errors carry the server's Kazakh message.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Серверге қосылу мүмкін болмады. Интернетті немесе серверді тексеріңіз.", 0);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) throw new ApiError(data?.error || "Сервер қатесі.", response.status);
  return data;
}

export const api = {
  me: () => request("/api/teacher/me").catch((e) => (e.status === 401 ? { authenticated: false } : Promise.reject(e))),
  register: (body) => request("/api/teacher/register", { method: "POST", body }),
  login: (body) => request("/api/teacher/login", { method: "POST", body }),
  logout: () => request("/api/teacher/logout", { method: "POST", body: {} }),

  lab: (id) => request(`/api/labs/${encodeURIComponent(id)}`),
  submit: (id, body) => request(`/api/labs/${encodeURIComponent(id)}/submissions`, { method: "POST", body }),
  check: (kind, body) => request(`/api/demo/${encodeURIComponent(kind)}/check`, { method: "POST", body }),

  teacherLabs: () => request("/api/teacher/labs"),
  createLab: (body) => request("/api/teacher/labs", { method: "POST", body }),
  updateLab: (id, body) => request(`/api/teacher/labs/${encodeURIComponent(id)}`, { method: "PATCH", body }),
  results: (id) => request(`/api/teacher/labs/${encodeURIComponent(id)}/results`),
  submission: (id) => request(`/api/teacher/submissions/${encodeURIComponent(id)}`),
  csvUrl: (id) => `/api/teacher/labs/${encodeURIComponent(id)}/results.csv`,
};
