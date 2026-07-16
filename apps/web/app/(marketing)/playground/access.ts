export type PlaygroundEnvironment = "local" | "test" | "preview" | "staging" | "production";

export function isPlaygroundEnabled(environment: PlaygroundEnvironment): boolean {
  return environment === "local" || environment === "test";
}
