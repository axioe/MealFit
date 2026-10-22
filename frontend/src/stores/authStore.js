import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 로그인 정보와 토큰을 관리합니다.
 * 화면에서는 토큰을 직접 저장하지 않고 이 Store를 사용합니다.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      /**
       * 회원가입·로그인·재발급 응답을 저장합니다.
       * TokenResponse의 필드명과 동일하게 받습니다.
       */
      setSession: ({ accessToken, refreshToken, user }) => {
        set({
          accessToken,
          refreshToken,
          user,
        })
      },

      /** 로그아웃 또는 재발급 실패 시 로그인 정보를 제거합니다. */
      clear: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        })
      },
    }),
    {
      // 다른 프로젝트의 저장 정보와 구분하는 키입니다.
      name: 'mealfit-auth',

      // 로그인 데이터만 저장하고 함수는 저장하지 않습니다.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)