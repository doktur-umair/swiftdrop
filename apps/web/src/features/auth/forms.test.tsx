import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import { AuthForm } from "./forms.js";
import { login, register } from "./client.js";
vi.mock("./client.js", () => ({
  login: vi.fn(),
  register: vi.fn(),
  googleProviders: vi.fn().mockResolvedValue({ google: false }),
  errorMessage: () =>
    "Cannot reach SwiftDrop. Check your connection and try again.",
  ApiError: class extends Error {},
}));
vi.mock("./session.js", () => ({
  useSession: () => ({
    state: { status: "anonymous", user: null },
    accept: vi.fn(),
  }),
  roleHome: () => "/account",
}));
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function page(registering = false) {
  return render(
    <MemoryRouter>
      <AuthForm registering={registering} />
    </MemoryRouter>,
  );
}
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Full name"), "Example Customer");
  await user.type(
    screen.getByLabelText("Email address"),
    "Customer@Example.test",
  );
  await user.type(
    screen.getByLabelText("Sri Lankan phone number"),
    "0771234567",
  );
  await user.type(
    screen.getByLabelText("Password", { exact: true }),
    "A unique delivery passphrase!",
  );
  return user;
}
describe("authentication forms", () => {
  it("links errors to fields, focuses the first error, and checks confirmation", async () => {
    page(true);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(register).not.toHaveBeenCalled();
    await fill();
    await user.type(
      screen.getByLabelText("Confirm password"),
      "does not match",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
  it("prevents duplicate submissions and clears secrets on accepted signup", async () => {
    let complete!: (value: { message: string }) => void;
    vi.mocked(register).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    page(true);
    const user = await fill();
    await user.type(
      screen.getByLabelText("Confirm password"),
      "A unique delivery passphrase!",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("button", { name: /Please wait/ })).toBeDisabled();
    expect(register).toHaveBeenCalledTimes(1);
    complete({ message: "Registration received." });
    await screen.findByText("Registration received.");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("");
  });
  it("preserves non-sensitive input and recovers controls after a network failure", async () => {
    vi.mocked(login).mockRejectedValue(new TypeError("network"));
    page();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Email address"),
      "customer@example.test",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "A unique delivery passphrase!",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText(/Cannot reach SwiftDrop/);
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "customer@example.test",
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
  });
  it("has no detected axe violations in the form region", async () => {
    const { container } = page(true);
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
