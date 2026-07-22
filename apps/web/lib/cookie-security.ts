export function shouldUseSecureCookies(
  appEnvironment: string | undefined,
  nodeEnvironment = process.env.NODE_ENV
): boolean {
  return (
    nodeEnvironment === "production" && appEnvironment !== "local" && appEnvironment !== "test"
  );
}
