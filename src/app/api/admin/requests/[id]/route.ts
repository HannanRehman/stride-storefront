import { readRequest, changeRequest } from "@/lib/support-server";
type Context = { params: Promise<{ id: string }> };
export const GET = async (request: Request, c: Context) =>
  readRequest((await c.params).id, true, request);
export const POST = async (request: Request, c: Context) =>
  changeRequest(request, (await c.params).id, true);
