export type PrivateStorageKey = string & { readonly __privateStorageKey: unique symbol };

export type SignedStorageUrl = {
  url: string;
  expiresAt: Date;
  visibility: "private";
};

export interface StorageAdapter {
  createUploadUrl(key: PrivateStorageKey, expiresInSeconds: number): Promise<SignedStorageUrl>;
  createDownloadUrl(key: PrivateStorageKey, expiresInSeconds: number): Promise<SignedStorageUrl>;
}

function createLocalSignedUrl(
  operation: "upload" | "download",
  key: PrivateStorageKey,
  expiresInSeconds: number
): SignedStorageUrl {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const encoded = encodeURIComponent(key);
  return {
    url: "https://private-storage.local.invalid/" + operation + "/" + encoded,
    expiresAt,
    visibility: "private"
  };
}

export const localStorageAdapter: StorageAdapter = {
  async createUploadUrl(key, expiresInSeconds) {
    return createLocalSignedUrl("upload", key, expiresInSeconds);
  },
  async createDownloadUrl(key, expiresInSeconds) {
    return createLocalSignedUrl("download", key, expiresInSeconds);
  }
};

export function privateStorageKey(value: string): PrivateStorageKey {
  if (!value.startsWith("org/") || value.includes("..")) {
    throw new Error("Private storage keys must be organization-scoped and traversal-safe.");
  }
  return value as PrivateStorageKey;
}
