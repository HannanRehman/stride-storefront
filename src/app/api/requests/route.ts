import { listRequests, openRequest } from "@/lib/support-server";
export const GET = (request: Request) => listRequests(request);
export const POST = openRequest;
