export async function jsonRequest<T>(
    url: string,
    body: FormData | Record<string, unknown> = {},
    method: 'GET' | 'POST' | 'PATCH' = 'POST',
): Promise<T> {
    const token = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);
    const multipart = body instanceof FormData;
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
            ...(!multipart ? { 'Content-Type': 'application/json' } : {}),
        },
        body: method === 'GET' ? undefined : multipart ? body : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({ message: 'Svaret kunde inte läsas. Försök igen.' }));
    if (!response.ok) throw new Error(data.errors ? Object.values(data.errors).flat().join(' ') : (data.message ?? 'Något gick fel. Försök igen.'));
    return data as T;
}
