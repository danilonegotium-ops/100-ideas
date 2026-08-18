import { promises as dns } from "node:dns";

export type Availability = "likely-available" | "likely-taken" | "unknown";

interface NodeDnsError extends Error {
  code?: string;
}

/**
 * Best-effort domain availability signal using DNS only — NOT a real WHOIS
 * check, and the UI must always show that disclaimer alongside this result.
 *
 * We check for NS (nameserver) delegation rather than an A record. Reasoning
 * (confirmed by live testing against known domains, see the coder's
 * handoff notes): a registered domain can be "parked" with no A record at
 * all, but it still has NS records once delegated by the registrar. A name
 * with NO NS records anywhere is the strongest DNS-only signal that nothing
 * is registered there. This is still imperfect — a domain can be registered
 * but not yet delegated (freshly bought, DNS not configured), or a
 * registrar's placeholder page can serve NS records for names that aren't
 * actually registered in some edge configurations — hence "likely", not
 * "definitely".
 */
export async function checkDomainAvailability(domain: string): Promise<Availability> {
  try {
    const records = await withTimeout(dns.resolveNs(domain), 5000);
    return records.length > 0 ? "likely-taken" : "likely-available";
  } catch (err) {
    const code = (err as NodeDnsError).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return "likely-available";
    }
    // Timeout, server failure, etc — genuinely can't tell, don't guess.
    return "unknown";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("dns lookup timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
