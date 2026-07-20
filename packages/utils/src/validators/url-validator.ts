/**
 * SSRF URL Validator for SiteGrade
 *
 * Prevents Server-Side Request Forgery by:
 * 1. Blocking private/loopback IP ranges (IPv4 + IPv6)
 * 2. Blocking cloud metadata endpoints (169.254.169.254, metadata.google.internal)
 * 3. Blocking non-HTTP(S) schemes
 * 4. DNS rebinding protection via hostname resolution check
 *
 * @see docs/SECURITY.md
 */

import dns from "node:dns/promises";
import net from "node:net";
import type { ValidationResult } from "@sitegarde/types";

// Private IPv4 CIDR ranges
const BLOCKED_IPV4_RANGES: Array<{ network: number; mask: number }> = [
  { network: ipToInt("127.0.0.0"), mask: cidrMask(8) },   // loopback
  { network: ipToInt("10.0.0.0"), mask: cidrMask(8) },    // RFC1918 class-A
  { network: ipToInt("172.16.0.0"), mask: cidrMask(12) },  // RFC1918 class-B
  { network: ipToInt("192.168.0.0"), mask: cidrMask(16) }, // RFC1918 class-C
  { network: ipToInt("169.254.0.0"), mask: cidrMask(16) }, // link-local/metadata
  { network: ipToInt("100.64.0.0"), mask: cidrMask(10) },  // CGNAT
  { network: ipToInt("0.0.0.0"), mask: cidrMask(8) },      // unspecified
  { network: ipToInt("224.0.0.0"), mask: cidrMask(4) },    // multicast
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "fd00::ec2",
  "::1",
]);

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function cidrMask(bits: number): number {
  return (0xffffffff << (32 - bits)) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const ipInt = ipToInt(ip);
  return BLOCKED_IPV4_RANGES.some(({ network, mask }) => (ipInt & mask) === network);
}

function isPrivateIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false;
  if (ip === "::1") return true;
  const firstByte = parseInt(ip.split(":")[0] ?? "0", 16);
  if ((firstByte & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((firstByte & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  return false;
}

function isPrivateIP(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip);
}

/**
 * Validates a URL for safe use as an audit target.
 * Returns { valid: true, sanitizedUrl } or { valid: false, error }.
 */
export async function validateAuditUrl(rawUrl: string): Promise<ValidationResult> {
  // Step 1: Parse URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "Invalid URL format. Please include the scheme (https://example.com)" };
  }

  // Step 2: Scheme check
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { valid: false, error: `URL scheme "${parsed.protocol}" is not allowed. Only http:// and https:// are supported.` };
  }

  // Step 3: Hostname blocklist
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: `Hostname "${hostname}" is not allowed.` };
  }

  // Step 4: Direct IP check
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      return { valid: false, error: "Private and reserved IP addresses are not allowed as audit targets." };
    }
    return { valid: true, sanitizedUrl: parsed.toString() };
  }

  // Step 5: DNS resolution + rebinding check
  let resolvedAddresses: string[];
  try {
    const records = await dns.lookup(hostname, { all: true });
    resolvedAddresses = records.map((r) => r.address);
  } catch {
    return { valid: false, error: `Could not resolve hostname "${hostname}". Please check the URL and try again.` };
  }

  if (resolvedAddresses.length === 0) {
    return { valid: false, error: `Hostname "${hostname}" did not resolve to any IP addresses.` };
  }

  for (const ip of resolvedAddresses) {
    if (isPrivateIP(ip)) {
      return { valid: false, error: `Hostname "${hostname}" resolves to a private IP address (${ip}), which is not allowed.` };
    }
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}

export type { ValidationResult };
