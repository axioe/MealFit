// 백엔드 DTO와 1:1로 맞춘다. 백엔드 응답이 바뀌면 이 파일도 같이 고친다.

export interface ApiFieldError {
  field: string
  message: string
}

/** 모든 에러 응답 형식 (backend: global/exception/ErrorResponse) */
export interface ApiErrorResponse {
  status: number
  code: string
  message: string
  errors?: ApiFieldError[]
  timestamp: string
}

export interface Me {
  id: number
  email: string
  nickname: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: Me
}

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export type Goal = 'LOSS' | 'MAINTAIN' | 'GAIN'
export type CookingTime = 10 | 20 | 30

export interface Profile {
  nickname: string
  goal: Goal
  cookingTimePref: CookingTime
  budgetPerMeal?: number | null
  allergies: string[]
  excludedIngredients: string[]
}

export type ProfileUpdateRequest = Profile
