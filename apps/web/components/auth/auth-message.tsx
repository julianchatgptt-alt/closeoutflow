import { Alert } from "@closeoutflow/ui";

export function AuthMessage({
  error,
  message
}: {
  error?: string | undefined;
  message?: string | undefined;
}) {
  if (error) return <Alert tone="danger" title={error} />;
  if (message) return <Alert tone="success" title={message} />;
  return null;
}
