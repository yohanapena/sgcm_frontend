const API_BASE_URL = 'http://localhost:4000';

function redirectToLogin() {
  clearAuthStorage();
  window.location.reload();
}

function clearAuthStorage() {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userMedicoId');
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest({ path, method = 'GET', body, token } = {}) {
  if (!path) {
    throw new Error('Se requiere la ruta de la API');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('jwtToken');
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (fetchError) {
    throw new Error(`NETWORK_ERROR: ${fetchError.message || 'No se pudo conectar con el backend'}`);
  }

  if (response.status === 401) {
    redirectToLogin();
    throw new Error('No autorizado. La sesión ha expirado.');
  }

  const data = await safeParseJson(response);

  if (!response.ok) {
    const message = data?.message || data?.error || 'Error de comunicación con el servidor';
    throw new Error(message);
  }

  return data;
}
