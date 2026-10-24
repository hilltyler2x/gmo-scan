// Empty on the website (same-origin /api calls). The phone app has no server
// of its own, so its build sets this to the live site's address (.env.app).
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
