export type SemanticHasher = (
  canonicalValue: string,
) => string | Promise<string>;

interface SubtleDigest {
  digest(algorithm: "SHA-256", data: Uint8Array): Promise<ArrayBuffer>;
}

interface Utf8Encoder {
  encode(value: string): Uint8Array;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function webCryptoSubtle(): SubtleDigest | undefined {
  const host = globalThis as typeof globalThis & {
    crypto?: { readonly subtle?: SubtleDigest };
  };
  return host.crypto?.subtle;
}

function utf8Encode(value: string): Uint8Array {
  const host = globalThis as typeof globalThis & {
    TextEncoder?: new () => Utf8Encoder;
  };
  if (host.TextEncoder === undefined)
    throw new Error("SHA-256 requires a runtime UTF-8 encoder");
  return new host.TextEncoder().encode(value);
}

export async function sha256Hex(
  canonicalValue: string,
  hasher?: SemanticHasher,
): Promise<string> {
  if (hasher !== undefined) {
    const digest = await hasher(canonicalValue);
    if (!/^[a-f0-9]{64}$/.test(digest))
      throw new Error(
        "Injected semantic hasher must return lowercase SHA-256 hex",
      );
    return digest;
  }
  const subtle = webCryptoSubtle();
  if (subtle === undefined)
    throw new Error(
      "SHA-256 requires Web Crypto or an injected deterministic hasher",
    );
  const digest = await subtle.digest("SHA-256", utf8Encode(canonicalValue));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function semanticId(
  prefix: "evt_v1" | "sat_pass_v1" | "sat_window_v1",
  semanticParts: unknown,
  hasher?: SemanticHasher,
): Promise<string> {
  return `${prefix}_${await sha256Hex(canonicalJson(semanticParts), hasher)}`;
}
