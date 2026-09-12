import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/aplicar")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
