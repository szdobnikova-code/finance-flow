import { setupWorker } from "msw/browser";

import { handlers } from "@/api/msw/handlers";

export const worker = setupWorker(...handlers);
