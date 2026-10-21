import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
const page = (load, name) => async () => ({ Component: (await load())[name] });
export const router = createBrowserRouter([
    { children: [
            { path: '/login', lazy: page(() => import('@/pages/LoginPage'), 'LoginPage') },
            { path: '/signup', lazy: page(() => import('@/pages/SignupPage'), 'SignupPage') },
        ] },
    { element: <AppLayout />, children: [
            { path: '/', element: <Navigate to="/dashboard" replace/> },
            { path: '/dashboard', lazy: page(() => import('@/pages/DashboardPage'), 'DashboardPage') },
            { path: '/recommend', lazy: page(() => import('@/pages/RecommendPage'), 'RecommendPage') },
            { path: '/recipes/:id', lazy: page(() => import('@/pages/RecipeDetailPage'), 'RecipeDetailPage') },
            { path: '/fridge', lazy: page(() => import('@/pages/FridgePage'), 'FridgePage') },
            { path: '/shopping', lazy: page(() => import('@/pages/ShoppingPage'), 'ShoppingPage') },
            { path: '/workout', lazy: page(() => import('@/pages/WorkoutPage'), 'WorkoutPage') },
            { path: '/calendar', lazy: page(() => import('@/pages/CalendarPage'), 'CalendarPage') },
            { path: '/weight', lazy: page(() => import('@/pages/WeightPage'), 'WeightPage') },
            { path: '/mypage', lazy: page(() => import('@/pages/MyPage'), 'MyPage') },
        ] },
    { path: '*', element: <Navigate to="/dashboard" replace/> },
]);
