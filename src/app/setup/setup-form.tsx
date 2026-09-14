'use client';

import { useActionState, useState } from 'react';
import { setupAction, type SetupState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const initial: SetupState = {};

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, initial);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          placeholder="admin"
          autoComplete="username"
          aria-invalid={!!state.fieldErrors?.['username']}
          required
        />
        {state.fieldErrors?.['username'] && (
          <p className="text-xs text-destructive">{state.fieldErrors['username']}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          name="displayName"
          placeholder="System Administrator"
          autoComplete="name"
          aria-invalid={!!state.fieldErrors?.['displayName']}
          required
        />
        {state.fieldErrors?.['displayName'] && (
          <p className="text-xs text-destructive">{state.fieldErrors['displayName']}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min 12 chars, mixed case, number, special"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.['password']}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.fieldErrors?.['password'] && (
          <p className="text-xs text-destructive">{state.fieldErrors['password']}</p>
        )}
        <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
          <li>• At least 12 characters</li>
          <li>• Uppercase & lowercase letters</li>
          <li>• Number & special character</li>
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat password"
            autoComplete="new-password"
            aria-invalid={!!state.fieldErrors?.['confirmPassword']}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.fieldErrors?.['confirmPassword'] && (
          <p className="text-xs text-destructive">{state.fieldErrors['confirmPassword']}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        {pending ? 'Creating account…' : 'Create Administrator Account'}
      </Button>
    </form>
  );
}
