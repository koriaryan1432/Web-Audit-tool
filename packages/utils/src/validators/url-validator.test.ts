/**
 * SSRF URL Validator - Test Suite (15 tests)
 * Covers: valid URLs, loopback, private ranges, metadata endpoints,
 * non-HTTP schemes, malformed URLs, DNS rebinding, sanitization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAuditUrl } from "./url-validator";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn() },
}));

import dns from "node:dns/promises";
const mockLookup = vi.mocked(dns.lookup);

beforeEach(() => { vi.clearAllMocks(); });

describe("validateAuditUrl", () => {
  it("should accept a valid public HTTPS URL", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
    const result = await validateAuditUrl("https://example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe("https://example.com/");
    expect(result.error).toBeUndefined();
  });

  it("should accept a valid public HTTP URL", async () => {
    mockLookup.mockResolvedValue([{ address: "104.21.0.1", family: 4 }] as never);
    const result = await validateAuditUrl("http://example.com/path?q=1");
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toContain("http://example.com");
  });

  it("should block localhost", async () => {
    const result = await validateAuditUrl("http://localhost:3000");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not allowed/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("should block 127.0.0.1 loopback IP directly", async () => {
    const result = await validateAuditUrl("http://127.0.0.1");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private.*ip|reserved/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("should block 192.168.x.x private IP range", async () => {
    const result = await validateAuditUrl("https://192.168.1.100");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private.*ip|reserved/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("should block 10.x.x.x private IP range", async () => {
    const result = await validateAuditUrl("http://10.0.0.1/admin");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private.*ip|reserved/i);
  });

  it("should block 172.16-31.x.x private IP range", async () => {
    const result = await validateAuditUrl("http://172.20.0.1");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private.*ip|reserved/i);
  });

  it("should block AWS/GCP metadata endpoint 169.254.169.254", async () => {
    const result = await validateAuditUrl("http://169.254.169.254/latest/meta-data/");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private.*ip|reserved/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("should block metadata.google.internal hostname", async () => {
    const result = await validateAuditUrl("http://metadata.google.internal/computeMetadata/v1/");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not allowed/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("should block ftp:// scheme", async () => {
    const result = await validateAuditUrl("ftp://example.com/file.txt");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/scheme.*not allowed/i);
  });

  it("should block file:// scheme", async () => {
    const result = await validateAuditUrl("file:///etc/passwd");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/scheme.*not allowed/i);
  });

  it("should block malformed URLs", async () => {
    const result = await validateAuditUrl("not-a-url-at-all");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid url/i);
  });

  it("should block a hostname that resolves to a private IP (DNS rebinding)", async () => {
    mockLookup.mockResolvedValue([{ address: "192.168.1.1", family: 4 }] as never);
    const result = await validateAuditUrl("https://evil-rebind.example.com");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private ip/i);
  });

  it("should return a sanitized URL with trailing slash for root paths", async () => {
    mockLookup.mockResolvedValue([{ address: "1.1.1.1", family: 4 }] as never);
    const result = await validateAuditUrl("  HTTPS://CLOUDFLARE.COM  ");
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe("https://cloudflare.com/");
  });

  it("should return an error when DNS resolution fails", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    const result = await validateAuditUrl("https://this-domain-does-not-exist-xyz.com");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/could not resolve/i);
  });
});
