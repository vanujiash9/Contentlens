import { ApiError } from "./errors"

interface ApiEnvelope<T> {
  data?: T
  detail?: string | { code?: string; message?: string }
  error?: {
    code?: string
    message?: string
  }
}

interface ApiClientOptions {
  baseUrl?: string
  getAccessToken: () => Promise<string | null>
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly getAccessToken: () => Promise<string | null>

  constructor({ baseUrl = import.meta.env.VITE_API_BASE_URL ?? "", getAccessToken }: ApiClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "")
    this.getAccessToken = getAccessToken
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")

    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    if (token !== null) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (response.status === 204) {
      return undefined as T
    }

    const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

    if (!response.ok) {
      const detail = body?.detail
      const detailMessage = typeof detail === "string" ? detail : detail?.message
      const detailCode = typeof detail === "string" ? undefined : detail?.code
      const message = body?.error?.message ?? detailMessage ?? body?.error?.code ?? detailCode ?? response.statusText
      throw new ApiError(message, response.status, body?.error?.code ?? detailCode)
    }

    if (body !== null && "data" in body) {
      return body.data as T
    }

    return body as T
  }
}
