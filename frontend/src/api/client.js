import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient";

/**
 * 모든 API 호출은 이 인스턴스를 쓴다.
 *
 * 서버 에러 응답 형식 (backend: global/exception/ErrorResponse)
 *   { status, code, message, errors: [{ field, message }], timestamp }
 *
 * 인증 토큰 첨부와 401 자동 갱신은 아래 인터셉터에서 처리합니다.
 */
export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000, // AI 추천은 최대 20초 + 여유
});

// 같은 탭에서 여러 요청이 실패해도 갱신은 한 번만 실행합니다.
let refreshPromise = null;

const AUTH_PATHS = new Set([
  "/auth/signup",
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
]);

function isAuthRequest(config) {
  return AUTH_PATHS.has(config.url?.split("?")[0]);
}

/** 로그인 정보와 이전 회원의 조회 캐시를 제거합니다. */
function clearSession() {
  useAuthStore.getState().clear();
  void queryClient.cancelQueries().catch(() => {});
  queryClient.clear();

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

/** 모든 보호 API에 최신 Access Token을 첨부합니다. */
api.interceptors.request.use((config) => {
  const session = useAuthStore.getState();

  if (!isAuthRequest(config) && session.accessToken) {
    config.headers.set("Authorization", `Bearer ${session.accessToken}`);
    config._authAccessToken = session.accessToken;
    config._authUserId = session.user?.id;
  } else {
    config.headers.delete("Authorization");
    config._authAccessToken = null;
    config._authUserId = null;
  }

  return config;
});

/** 토큰 교체 중 세션이 변경되면 이전 응답으로 덮어쓰지 않습니다. */
function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const originalRefreshToken = useAuthStore.getState().refreshToken;

  if (!originalRefreshToken) {
    clearSession();
    return Promise.reject(new Error("로그인이 필요합니다."));
  }

  refreshPromise = api
    .post("/auth/refresh", { refreshToken: originalRefreshToken })
    .then(({ data }) => {
      const current = useAuthStore.getState();

      if (current.refreshToken !== originalRefreshToken) {
        throw new Error("로그인 정보가 변경되었습니다.");
      }

      current.setSession(data);
      return data.accessToken;
    })
    .catch((error) => {
      if (useAuthStore.getState().refreshToken === originalRefreshToken) {
        clearSession();
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** 보호 API의 401만 처리하며 원래 요청은 한 번만 재시도합니다. */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (!config || error.response?.status !== 401 || isAuthRequest(config)) {
      return Promise.reject(error);
    }

    const current = useAuthStore.getState();

    // 계정 전환 전의 요청을 새 회원의 권한으로 다시 실행하지 않습니다.
    if (config._authUserId !== current.user?.id) {
      return Promise.reject(error);
    }

    if (config._authRetried) {
      if (current.accessToken === config._authAccessToken) {
        clearSession();
      }
      return Promise.reject(error);
    }

    config._authRetried = true;

    // 늦게 도착한 401은 다른 요청이 이미 갱신한 토큰으로 재시도합니다.
    if (current.accessToken && current.accessToken !== config._authAccessToken) {
      return api(config);
    }

    try {
      await refreshSession();

      // 갱신을 기다리던 중 로그아웃·계정 전환됐으면 재시도하지 않습니다.
      const session = useAuthStore.getState();
      if (!session.accessToken || config._authUserId !== session.user?.id) {
        return Promise.reject(error);
      }

      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

/** 화면에 보여줄 에러 메시지. 서버 ErrorResponse.message → 없으면 기본 문구 */
export function getErrorMessage(
  error,
  fallback = "요청을 처리하지 못했습니다.",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message).join("\n");
    }
    return data?.message ?? fallback;
  }
  return fallback;
}

/** 서버 에러 코드 (예: 'INVENTORY_001'). 코드별 분기 처리에 사용 */
export function getErrorCode(error) {
  return axios.isAxiosError(error) ? error.response?.data?.code : undefined;
}
