export async function adminDataRequest(path, options = {}) {
  const response = await fetch(`/api/admin-data${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Unable to update data");
  }

  return data;
}
