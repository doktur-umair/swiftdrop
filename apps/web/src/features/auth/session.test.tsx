import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SessionProvider, useSession } from "./session.js";
import { refreshSession } from "./client.js";
vi.mock("./client.js", () => ({
  refreshSession: vi.fn(),
  allowBootstrap: vi.fn(),
  clearSession: vi.fn(),
  blockBootstrap: vi.fn(),
  sessionEvents: null,
  ApiError: class extends Error {},
  errorMessage: () => "Service unavailable.",
}));
function Probe() {
  const { state } = useSession();
  return <div role="status">{state.status}</div>;
}
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps protected content out while bootstrap is pending", async () => {
  let reject!: (reason: Error) => void;
  vi.mocked(refreshSession).mockReturnValue(
    new Promise((_resolve, fail) => {
      reject = fail;
    }),
  );
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  reject(new Error("offline"));
  await screen.findByText("error");
});
