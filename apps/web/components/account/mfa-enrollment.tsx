"use client";

import { Button, Input, Label } from "@closeoutflow/ui";
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
      <form action={recoveryAction} className="space-y-3">
        <input type="hidden" name="factorId" value={existingFactorId} />
        <Label htmlFor="recoveryCode">Use a recovery code for a lost authenticator</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="recoveryCode"
            name="recoveryCode"
            autoComplete="one-time-code"
            className="max-w-xs"
            required
          />
          <Button type="submit" variant="outline" loading={recovering}>
            Use recovery code
          </Button>
        </div>
        <ActionStatus state={recovery} />
      </form>
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
        <form action={verifyAction} className="mt-4 space-y-4">
          <input type="hidden" name="factorId" value={enrollment.factorId} />
          {/* Supabase returns a local SVG data URI; the secret is never sent to analytics/logs. */}
          <img
            src={enrollment.qrCode}
            alt="QR code for your Closeout authenticator"
            width={192}
            height={192}
            className="rounded-md bg-white p-2"
          />
          <details className="text-sm">
            <summary>Can’t scan the QR code?</summary>
            <p className="mt-2 break-all font-mono">{enrollment.secret}</p>
          </details>
          <div>
            <Label htmlFor="mfa-code">Six-digit code</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="mfa-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="max-w-40"
                required
              />
              <Button type="submit" loading={verifying}>
                Verify and enable
              </Button>
            </div>
          </div>
          <ActionStatus state={verification} />
        </form>
      ) : null}
      {verification.recoveryCodes ? (
        <div className="mt-4" role="status">
          <p className="font-medium">
            Save these one-time codes now. They will not be shown again.
          </p>
          <ul className="mt-3 grid gap-2 rounded-md bg-muted p-4 font-mono text-sm sm:grid-cols-2">
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
