import { listRequests } from "@/lib/support-server";
export const GET = (request: Request) => listRequests(request, true);
