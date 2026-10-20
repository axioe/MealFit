import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FridgePage } from '@/pages/FridgePage'
import { MyPage } from '@/pages/MyPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { RecommendPage } from '@/pages/RecommendPage'
import { ShoppingPage } from '@/pages/ShoppingPage'
import { ProtectedRoute, PublicOnlyRoute } from './guards'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/recommend', element: <RecommendPage /> },
          { path: '/recipes/:id', element: <RecipeDetailPage /> },
          { path: '/fridge', element: <FridgePage /> },
          { path: '/shopping', element: <ShoppingPage /> },
          { path: '/mypage', element: <MyPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
