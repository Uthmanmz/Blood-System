const API_BASE_URL =
  'http://localhost/blood-network-api/api';

export async function apiRequest(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      credentials: 'include',

      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },

      ...options,
    }
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      'Invalid response received from the server'
    );
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || 'Something went wrong'
    );
  }

  return result;
}


export function apiGet(endpoint) {
  return apiRequest(endpoint, {
    method: 'GET',
  });
}


export function apiPost(endpoint, data = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}