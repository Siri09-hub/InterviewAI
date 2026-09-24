const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export interface ApiFetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(
    message: string,
    status: number,
    detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// =====================================================
// NORMAL JSON API REQUEST
// =====================================================

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
  } = options;

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] =
      "application/json";
  }

  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      finalHeaders["Authorization"] =
        `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method,
      headers: finalHeaders,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  let data: unknown = null;

  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data
        ? (
            data as {
              detail?: unknown;
            }
          ).detail
        : undefined;

    const message =
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      detail ?? data
    );
  }

  return data as T;
}

// =====================================================
// BLOB / AUDIO API REQUEST
// =====================================================

export async function apiFetchBlob(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<Blob> {
  const {
    method = "GET",
    body,
    headers = {},
  } = options;

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] =
      "application/json";
  }

  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      finalHeaders["Authorization"] =
        `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method,
      headers: finalHeaders,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  if (!response.ok) {
    let data: unknown = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data
        ? (
            data as {
              detail?: unknown;
            }
          ).detail
        : undefined;

    const message =
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      detail ?? data
    );
  }

  return await response.blob();
}

// =====================================================
// FILE UPLOAD WITH PROGRESS
// =====================================================

export function apiUploadWithProgress<T>(
  endpoint: string,
  file: File,
  fieldName: string,
  onProgress?: (
    percent: number
  ) => void
): Promise<T> {
  return new Promise(
    (resolve, reject) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(
              "access_token"
            )
          : null;

      const xhr =
        new XMLHttpRequest();

      xhr.open(
        "POST",
        `${API_URL}${endpoint}`
      );

      if (token) {
        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${token}`
        );
      }

      xhr.upload.onprogress = (
        event
      ) => {
        if (
          event.lengthComputable &&
          onProgress
        ) {
          const percent = Math.round(
            (event.loaded /
              event.total) *
              100
          );

          onProgress(percent);
        }
      };

      xhr.onload = () => {
        let data: unknown =
          null;

        try {
          data = xhr.responseText
            ? JSON.parse(
                xhr.responseText
              )
            : null;
        } catch {
          data = xhr.responseText;
        }

        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {
          resolve(data as T);
          return;
        }

        const detail =
          data &&
          typeof data === "object" &&
          "detail" in data
            ? (
                data as {
                  detail?: unknown;
                }
              ).detail
            : undefined;

        const message =
          typeof detail === "string"
            ? detail
            : `Request failed with status ${xhr.status}`;

        reject(
          new ApiError(
            message,
            xhr.status,
            detail ?? data
          )
        );
      };

      xhr.onerror = () => {
        reject(
          new ApiError(
            "A network error occurred during upload.",
            0
          )
        );
      };

      const formData =
        new FormData();

      formData.append(
        fieldName,
        file
      );

      xhr.send(formData);
    }
  );
}
export async function apiUploadAudio<T>(
  endpoint: string,
  file: File,
  fieldName = "file"
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const formData = new FormData();
  formData.append(fieldName, file);

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    }
  );

  let data: unknown = null;

  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data
        ? (
            data as {
              detail?: unknown;
            }
          ).detail
        : undefined;

    const message =
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      detail ?? data
    );
  }

  return data as T;
}