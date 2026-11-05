const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://aisupportplatform-3.onrender.com/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: `Server responded with status ${response.status}`,
    }));

    if (!response.ok && !data.error) {
      data.error = `HTTP Error ${response.status}`;
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with API server.",
    };
  }
}

