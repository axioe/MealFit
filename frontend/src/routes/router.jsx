import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { FridgePage } from '@/pages/FridgePage'
import { LoginPage } from '@/pages/LoginPage'
import { MyPage } from '@/pages/MyPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { RecommendPage } from '@/pages/RecommendPage'
import { ShoppingPage } from '@/pages/ShoppingPage'
import { WorkoutPage } from '@/pages/WorkoutPage'

// TODO(로그인 담당): 로그인 구현 후 AppLayout 아래 화면들을 로그인 가드로 감싼다.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/recommend', element: <RecommendPage /> },
      { path: '/recipes/:id', element: <RecipeDetailPage /> },
      { path: '/fridge', element: <FridgePage /> },
      { path: '/shopping', element: <ShoppingPage /> },
      { path: '/workout', element: <WorkoutPage /> },
      { path: '/mypage', element: <MyPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
