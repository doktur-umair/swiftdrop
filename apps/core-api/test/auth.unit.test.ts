import { describe, it, expect } from "@jest/globals";
import { registrationSchema, passwordSchema } from "@swiftdrop/contracts";
import { generateKeyPairSync } from "node:crypto";
import { decodeJwt, importPKCS8, SignJWT } from "jose";
import { createTokenService } from "../src/modules/auth/jwt.js";
import {
  requireRole,
  requireCompleteProfile,
} from "../src/modules/auth/index.js";
import {
  decryptVerifier,
  encryptVerifier,
  GoogleOidc,
} from "../src/modules/auth/google.js";
import type { Request, Response } from "express";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 3072,
});
const config = {
  privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  publicKeys: {
    "test-1": publicKey.export({ type: "spki", format: "pem" }).toString(),
  },
  AUTH_KEY_ID: "test-1",
  API_ISSUER: "https://api.swiftdrop.test",
  HUMAN_AUDIENCE: "swiftdrop-web",
};
describe("shared policy", () => {
  it("canonicalises identifiers while preserving passwords and plus-tags", () => {
    const value = registrationSchema.parse({
      fullName: " Example Customer ",
      email: " Example+Tag@Example.COM ",
      phone: "0771234567",
      password: "  a long passphrase  ",
    });
    expect(value).toMatchObject({
      email: "example+tag@example.com",
      phone: "+94771234567",
      password: "  a long passphrase  ",
    });
  });
  it("rejects privilege fields, short/common passwords and UTF-8 truncation", () => {
    expect(
      registrationSchema.safeParse({
        fullName: "Customer",
        email: "c@example.com",
        phone: "0771234567",
        password: "a unique test passphrase",
        role: "ADMIN",
      }).success,
    ).toBe(false);
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("films+pic+galeries").success).toBe(false);
    expect(passwordSchema.safeParse("😀".repeat(18)).success).toBe(true);
    expect(passwordSchema.safeParse("😀".repeat(19)).success).toBe(false);
  });
  it("admin inherits dispatcher while dispatcher cannot enter admin", () => {
    const outcomes: unknown[] = [];
    requireRole("DISPATCHER")(
      {} as Request,
      { locals: { user: { role: "ADMIN" } } } as unknown as Response,
      (value) => {
        outcomes.push(value);
      },
    );
    requireRole("ADMIN")(
      {} as Request,
      { locals: { user: { role: "DISPATCHER" } } } as unknown as Response,
      (value) => {
        outcomes.push(value);
      },
    );
    expect(outcomes[0]).toBeUndefined();
    expect(outcomes[1]).toMatchObject({ status: 403 });
  });
  it("rejects business access for incomplete profiles", () => {
    let denied: unknown;
    requireCompleteProfile(
      {} as Request,
      { locals: { user: { profileComplete: false } } } as unknown as Response,
      (error) => {
        denied = error;
      },
    );
    expect(denied).toMatchObject({ status: 403, code: "PROFILE_INCOMPLETE" });
    requireCompleteProfile(
      {} as Request,
      { locals: { user: { profileComplete: true } } } as unknown as Response,
      (error) => {
        denied = error;
      },
    );
    expect(denied).toBeUndefined();
  });
});
describe("RS256 tokens", () => {
  it("issues only required claims for exactly 900 seconds", async () => {
    const service = await createTokenService(config);
    const token = await service.issue(42, "CUSTOMER");
    const claims = decodeJwt(token.accessToken);
    expect(Object.keys(claims).sort()).toEqual([
      "aud",
      "exp",
      "iat",
      "iss",
      "jti",
      "role",
      "sub",
    ]);
    expect(Number(claims.exp) - Number(claims.iat)).toBe(900);
    expect(await service.verify(token.accessToken)).toMatchObject({
      id: 42,
      role: "CUSTOMER",
    });
  });
  it.each([
    "audience",
    "issuer",
    "expired",
    "role",
    "missing-jti",
    "unknown-kid",
  ])("rejects %s even with a trusted signature", async (scenario) => {
    const service = await createTokenService(config);
    const now = Math.floor(Date.now() / 1000);
    const builder = new SignJWT({
      role: scenario === "role" ? "ROOT" : "CUSTOMER",
    })
      .setProtectedHeader({
        alg: "RS256",
        typ: "JWT",
        kid: scenario === "unknown-kid" ? "unknown" : "test-1",
      })
      .setSubject("42")
      .setIssuer(
        scenario === "issuer" ? "https://wrong.test" : config.API_ISSUER,
      )
      .setAudience(
        scenario === "audience" ? "merchant-audience" : config.HUMAN_AUDIENCE,
      )
      .setIssuedAt(scenario === "expired" ? now - 1800 : now)
      .setExpirationTime(scenario === "expired" ? now - 900 : now + 900);
    if (scenario !== "missing-jti")
      builder.setJti("ad25c0de-1122-4333-a444-112233445566");
    const token = await builder.sign(
      await importPKCS8(config.privateKey, "RS256"),
    );
    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });
  it("rejects malformed tokens and untrusted keys/configuration", async () => {
    const service = await createTokenService(config);
    await expect(service.verify("invalid")).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      createTokenService({ ...config, AUTH_KEY_ID: "missing" }),
    ).rejects.toThrow();
    const forged = await new SignJWT({ role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256", kid: "test-1" })
      .setSubject("42")
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("wrong key"));
    await expect(service.verify(forged)).rejects.toMatchObject({ status: 401 });
  });
});
describe("Google transaction protection", () => {
  it("encrypts PKCE verifiers and rejects modified ciphertext", () => {
    const secret = "oauth transaction secret that is private";
    const encrypted = encryptVerifier("pkce-verifier", secret);
    expect(encrypted).not.toContain("pkce-verifier");
    expect(decryptVerifier(encrypted, secret)).toBe("pkce-verifier");
    const [iv, tag, ciphertext] = encrypted.split(".");
    const changed = `${ciphertext[0] === "a" ? "b" : "a"}${ciphertext.slice(1)}`;
    expect(() => decryptVerifier(`${iv}.${tag}.${changed}`, secret)).toThrow();
  });
  it("keeps Google unavailable until all server credentials exist", () => {
    expect(new GoogleOidc({ oauthSecret: "secret" }).enabled()).toBe(false);
  });
});
