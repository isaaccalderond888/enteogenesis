import { createFileRoute } from "@tanstack/react-router";
import { FichaWizard } from "@/components/ficha";

export const Route = createFileRoute("/")({ component: FichaWizard });
