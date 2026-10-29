import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const session = {
  state: "authenticated",
  accessToken: "access-in-memory",
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: 1,
    email: "c@example.test",
    fullName: "Customer",
    phone: "+94771234567",
    role: "CUSTOMER",
    status: "ACTIVE",
    emailVerified: false,
    profileComplete: true,
  },
};
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("BroadcastChannel", undefined);
  fetcher = vi.fn(
    async (req: Request) =>
      new Response(
        JSON.stringify(
          req.url.endsWith("/csrf") ? { csrfToken: "csrf-token" } : session,
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );
  vi.stubGlobal("fetch", fetcher);
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: vi.fn((_name, callback) => callback()) },
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("session transport", () => {
  it("single-flights refresh, obtains CSRF inside the lock, and never stores credentials", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const client = await import("./client.js");
    const first = client.refreshSession();
    const second = client.refreshSession();
    expect(first).toBe(second);
    await expect(first).resolves.toEqual(session);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const refresh = fetcher.mock.calls[1][0] as Request;
    expect(refresh.headers.get("X-CSRF-Token")).toBe("csrf-token");
    expect(refresh.credentials).toBe("same-origin");
    expect(storage).not.toHaveBeenCalled();
    storage.mockRestore();
  });
  it("does not loop on terminal refresh failure", async () => {
    fetcher.mockImplementation(
      async (req: Request) =>
        new Response(
          JSON.stringify(
            req.url.endsWith("/csrf")
              ? { csrfToken: "csrf" }
              : { code: "UNAUTHENTICATED", detail: "Sign in again." },
          ),
          {
            status: req.url.endsWith("/csrf") ? 200 : 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
    );
    const client = await import("./client.js");
    await expect(client.refreshSession()).rejects.toMatchObject({
      problem: { status: 401 },
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("clears local credentials and blocks automatic cookie login after failed logout", async () => {
    const client = await import("./client.js");
    await client.refreshSession();
    fetcher.mockRejectedValue(new TypeError("offline"));
    await expect(client.logout()).rejects.toThrow();
    const count = fetcher.mock.calls.length;
    await expect(client.refreshSession()).rejects.toThrow(
      "Sign-out is pending",
    );
    expect(fetcher).toHaveBeenCalledTimes(count);
  });
});
