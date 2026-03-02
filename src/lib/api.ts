const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://127.0.0.1:5000/api';


const getToken = () => localStorage.getItem('clipstrike_token');

const headers = () => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
        localStorage.removeItem('clipstrike_token');
        window.location.href = '/login';
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data as T;
}

export const apiGet = <T>(path: string) =>
    fetch(`${API_BASE}${path}`, { headers: headers() }).then((r) => handleResponse<T>(r));

export const apiPost = <T>(path: string, body?: unknown) =>
    fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: headers(),
        body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r));

export const apiDelete = <T>(path: string) =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: headers() }).then((r) =>
        handleResponse<T>(r)
    );
