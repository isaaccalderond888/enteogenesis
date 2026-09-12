import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/adminlogin")({
  head: () => ({
    meta: [
      { title: "Acceso interno · Terrasana" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
