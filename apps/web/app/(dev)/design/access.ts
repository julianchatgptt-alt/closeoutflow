export type DesignGalleryEnvironment = "local" | "test" | "preview" | "staging" | "production";

export function isDesignGalleryEnabled(environment: DesignGalleryEnvironment): boolean {
  return environment === "local" || environment === "test";
}
