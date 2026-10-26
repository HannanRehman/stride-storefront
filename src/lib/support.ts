export const requestKinds = ["question", "cancellation", "return"] as const;
export type RequestKind = (typeof requestKinds)[number];
export type SupportRequest = {
  id: string;
  kind: RequestKind;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  order_id: string | null;
  created_at: string;
  updated_at: string;
};
export type SupportMessage = {
  client_key: string;
  id: string;
  author_role: "customer" | "owner";
  body: string;
  created_at: string;
};
