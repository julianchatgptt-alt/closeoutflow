import { serverEnv } from "@closeoutflow/env/server";
import { Button } from "@closeoutflow/ui";

import { oauthSignInAction } from "../../actions/auth";

export function OAuthButtons({ next = "/onboarding" }: { next?: string }) {
  const googleEnabled = Boolean(
    serverEnv.OAUTH_GOOGLE_CLIENT_ID && serverEnv.OAUTH_GOOGLE_CLIENT_SECRET
  );
  const microsoftEnabled = Boolean(
    serverEnv.OAUTH_MICROSOFT_CLIENT_ID && serverEnv.OAUTH_MICROSOFT_CLIENT_SECRET
  );

  if (!googleEnabled && !microsoftEnabled) return null;

  return (
    <div className="mb-5 space-y-2" aria-label="Single sign-on options">
      {googleEnabled ? (
        <form action={oauthSignInAction}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="next" value={next} />
          <Button className="w-full" variant="outline" type="submit">
            Continue with Google
          </Button>
        </form>
      ) : null}
      {microsoftEnabled ? (
        <form action={oauthSignInAction}>
          <input type="hidden" name="provider" value="azure" />
          <input type="hidden" name="next" value={next} />
          <Button className="w-full" variant="outline" type="submit">
            Continue with Microsoft
          </Button>
        </form>
      ) : null}
      <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
