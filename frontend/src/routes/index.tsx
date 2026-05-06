import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/auth/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/common/NotFoundPage";
import { ROUTES } from "../constants";

const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;
