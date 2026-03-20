import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  layout("routes/app-layout.tsx", [
    route("dashboard", "routes/dashboard-home.tsx"),
    route("dashboard/poops", "routes/dashboard-poops.tsx"),
    route("dashboard/cats", "routes/dashboard-cats.tsx"),
    route("dashboard/settings", "routes/dashboard-settings.tsx"),
  ]),
] satisfies RouteConfig;
