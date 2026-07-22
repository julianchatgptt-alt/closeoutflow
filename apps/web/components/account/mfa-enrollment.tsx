"use client";

import { Button, Input, Label } from "@closeoutflow/ui";
import { KeyRound, QrCode, ShieldCheck } from "lucide-react";
import { useActionState } from "react";

import {
  type MfaActionState,
  startMfaEnrollmentAction,
  useRecoveryCodeAction,
  verifyMfaEnrollmentAction
} from "../../actions/security";

const initialState: MfaActionState = {};

export function MfaEnrollment({ existingFactorId }: { existingFactorId?: string }) {
  const [enrollment, startAction, starting] = useActionState(
    startMfaEnrollmentAction,
    initialState
  );
  const [verification, verifyAction, verifying] = useActionState(
    verifyMfaEnrollmentAction,
    initialState
  );
  const [recovery, recoveryAction, recovering] = useActionState(
    useRecoveryCodeAction,
    initialState
  );

  if (existingFactorId) {
    return (
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck aria-hidden="true" className="size-4 text-success-foreground" />
            Authenticator protection is active
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A verified authenticator is required when the workspace requests higher assurance.
          </p>
        </div>
        <form
          action={recoveryAction}
          className="space-y-3 rounded-lg bg-surface-sunken p-4 sm:w-80"
        >
          <input type="hidden" name="factorId" value={existingFactorId} />
          <Label htmlFor="recoveryCode" className="flex items-center gap-2">
            <KeyRound aria-hidden="true" className="size-4" />
            Use a recovery code
          </Label>
          <p className="text-xs leading-5 text-muted-foreground">
            Use one saved code only when the authenticator is unavailable.
          </p>
          <Input
            id="recoveryCode"
            name="recoveryCode"
            autoComplete="one-time-code"
            className="font-mono uppercase tracking-wider"
            required
          />
          <Button type="submit" variant="outline" loading={recovering} className="w-full">
            Continue with recovery code
          </Button>
          <ActionStatus state={recovery} />
        </form>
      </div>
    );
  }

  return (
    <div>
      {!enrollment.factorId && !verification.recoveryCodes ? (
        <form action={startAction}>
          <Button type="submit" loading={starting}>
            Set up authenticator
          </Button>
        </form>
      ) : null}
      <ActionStatus state={enrollment} />
      {enrollment.factorId && enrollment.qrCode && !verification.recoveryCodes ? (
        <form action={verifyAction} className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr]">
          <input type="hidden" name="factorId" value={enrollment.factorId} />
          <div className="rounded-lg border bg-white p-3">
            {/* Supabase returns a local SVG data URI; the secret is never sent to analytics/logs. */}
            <img
              src={enrollment.qrCode}
              alt="QR code for your Closeout authenticator"
              width={192}
              height={192}
            />
          </div>
          <div className="space-y-4">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <QrCode aria-hidden="true" className="size-4 text-primary" />
                Scan, then verify
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add Closeout to your authenticator and enter the current six-digit code.
              </p>
            </div>
            <details className="text-sm">
              <summary>Can’t scan the QR code?</summary>
              <p className="mt-2 break-all rounded-md bg-surface-sunken p-3 font-mono text-xs">
                {enrollment.secret}
              </p>
            </details>
            <div>
              <Label htmlFor="mfa-code">Six-digit code</Label>
              <Input
                id="mfa-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="mt-1.5 max-w-48 font-mono tracking-[0.28em]"
                required
              />
            </div>
            <Button type="submit" loading={verifying}>
              Verify and enable
            </Button>
            <ActionStatus state={verification} />
          </div>
        </form>
      ) : null}
      {verification.recoveryCodes ? (
        <div
          className="mt-5 rounded-lg border border-warning-border bg-warning-subtle p-5"
          role="status"
        >
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound aria-hidden="true" className="size-4 text-warning-foreground" />
            Save your recovery codes now
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Each code works once and will not be shown again. Store them somewhere separate from
            your authenticator.
          </p>
          <ul className="mt-4 grid gap-2 rounded-md bg-surface p-4 font-mono text-sm sm:grid-cols-2">
            {verification.recoveryCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ActionStatus({
  state
}: {
  state: { error?: string; message?: string; recoveryCodes?: string[] };
}) {
  if (state.error)
    return (
      <p className="mt-3 text-sm text-destructive" role="alert">
        {state.error}
      </p>
    );
  if (state.message && !state.recoveryCodes)
    return (
      <p className="mt-3 text-sm text-muted-foreground" role="status">
        {state.message}
      </p>
    );
  return null;
}
