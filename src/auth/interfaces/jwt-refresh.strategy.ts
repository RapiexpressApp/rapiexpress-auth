export type RequestWithCookies = Request & {
  cookies: Record<string, string>;
};
