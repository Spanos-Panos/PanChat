const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiOptions = {
    method?: string
    body?: unknown
}

export async function apiFetch<T>(path: string , options: ApiOptions = {}): Promise<T> {
    const { method = 'GET' , body } = options
    
    const res = await fetch(`${API_BASE}${path}`,{
        method,
        headers: body ? {'Content-Type': 'application/json'} : undefined,
        body: body ? JSON.stringify(body): undefined,
        credentials: 'include',
    })

    const data = await res.json().catch(() => ({}))

    if(!res.ok){
        const message = 
        typeof data === 'object' && data && 'error' in data
        ? String((data as {error:string}).error)
        : res.statusText
    throw new Error(message)
    }

    return data as T
}