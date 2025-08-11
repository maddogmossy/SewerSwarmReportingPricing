import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        // Try to parse as JSON first
        try {
          const jsonError = JSON.parse(text);
          errorMessage = jsonError.message || text;
        } catch {
          // If JSON parsing fails, use the raw text
          errorMessage = text;
        }
      }
    } catch {
      // If reading text fails, stick with statusText
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  params?: Record<string, string | undefined>,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  // Build URL with query parameters
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    if (searchParams.toString()) {
      fullUrl += `?${searchParams.toString()}`;
    }
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers: isFormData ? {} : data ? { "Content-Type": "application/json" } : {},
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      cache: "no-cache", // Force fresh data, prevent cached responses
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: false,
      throwOnError: false,

    },
    mutations: {
      retry: false,
      throwOnError: false,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
