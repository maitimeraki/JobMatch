import { lazy } from "react";
import { RouteObject, Navigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { ProtectedRoute } from "./protected";
import Home from "../pages/Home";
import Feed from "../pages/Feed";
import PostDetail from "../pages/PostDetail";
import People from "../pages/People";
import ReferralsDashboard from "../pages/ReferralsDashboard";
import Jobs from "../pages/Jobs";
import JobDetail from "../pages/JobDetail";
import Profile from "../pages/Profile";
import Dashboard from "../pages/Dashboard";
import Admin from "../pages/Admin";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Bookmarks from "../pages/Bookmarks";
import Pricing from "../pages/Pricing";
import Shortlist from "../pages/Shortlist";
import Company from "../pages/Company";

const Applications = lazy(() => import("../pages/Applications"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      {
        path: "feed",
        element: (
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        ),
      },
      { path: "jobs", element: <Jobs /> },
      { path: "pricing", element: <Pricing /> },
      { path: "people", element: <People /> },
      {
        path: "referrals",
        element: (
          <ProtectedRoute>
            <ReferralsDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "shortlist",
        element: (
          <ProtectedRoute roles={["RECRUITER"]}>
            <Shortlist />
          </ProtectedRoute>
        ),
      },
      { path: "jobs/:id", element: <ProtectedRoute><JobDetail /></ProtectedRoute> },
      { path: "company/:recruiterId", element: <Company /> },
      {
        path: "posts/:id",
        element: (
          <ProtectedRoute>
            <PostDetail />
          </ProtectedRoute>
        ),
      },
      { path: "profile/:id", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute roles={["RECRUITER"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "applications",
        element: (
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "bookmarks",
        element: (
          <ProtectedRoute>
            <Bookmarks />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
