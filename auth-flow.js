// UI helpers only. Account authorization remains enforced by Supabase.
export const escapeAuthHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function authReturnKind({search = '', hash = ''} = {}) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  if (query.get('auth') === 'recovery' || query.get('type') === 'recovery' || fragment.get('type') === 'recovery') return 'recovery';
  if (query.get('verified') === '1' || query.has('code') || query.has('token_hash') || query.get('type') === 'signup' || fragment.get('type') === 'signup' || fragment.has('access_token')) return 'verification';
  return null;
}

export const authEmailStatus = kind => kind === 'reset'
  ? 'Check your inbox and spam folder. If this address is eligible for password recovery, follow the reset link in the email. If no email arrives, verify the address and try again in a minute.'
  : 'Check your inbox and spam folder. If this address has an account awaiting confirmation, follow the confirmation link in the email. If no email arrives, verify the address and try again in a minute.';

export async function requestAuthEmail(auth, kind, email, origin) {
  if (!auth || !['reset', 'confirmation'].includes(kind)) throw new Error('Account services are unavailable right now. Please try again later.');
  const address = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address.');
  const base = new URL(origin).origin;
  try {
    if (kind === 'reset') await auth.resetPasswordForEmail(address, {redirectTo: `${base}/?auth=recovery`});
    else await auth.resend({type: 'signup', email: address, options: {emailRedirectTo: `${base}/?verified=1`}});
  } catch {
    // Membership responses, rate limits and transport errors receive the same
    // conditional status. This UI never queries account existence.
  }
  return authEmailStatus(kind);
}

export function confirmationCopy(role) {
  return role === 'parent'
    ? {account: 'parent account', next: 'continue setting up your family'}
    : role === 'student'
      ? {account: 'learner account', next: 'continue setting up your learning profile'}
      : {account: 'account', next: 'continue your account setup'};
}

export function verifiedAccountDestination(role) {
  if (role === 'parent') return '/?app=1&onboarding=child';
  if (role === 'student' || role === 'admin') return '/?app=1';
  return null;
}

export function createRecoveryController(auth) {
  let recoveryUserId = null;
  let recoveryVersion = 0;
  let busy = false;
  const listeners = new Set();
  function notify() { for (const listener of listeners) listener(Boolean(recoveryUserId)); }
  return {
    get ready() { return Boolean(recoveryUserId); },
    subscribe(listener) { listeners.add(listener); if (recoveryUserId) listener(true); return () => listeners.delete(listener); },
    handleAuthEvent(event, session) {
      if (event === 'PASSWORD_RECOVERY' && session?.user?.id) { recoveryUserId = session.user.id; recoveryVersion++; notify(); }
      else if (event === 'SIGNED_OUT' || (recoveryUserId && ['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event) && session?.user?.id !== recoveryUserId)) { recoveryUserId = null; recoveryVersion++; notify(); }
    },
    async updatePassword(password, confirmation) {
      if (busy) throw new Error('A password update is already in progress.');
      if (!auth || !recoveryUserId) throw new Error('Open a new password reset link from your email before choosing a password.');
      if (String(password).length < 8) throw new Error('Use at least 8 characters for your new password.');
      if (password !== confirmation) throw new Error('The passwords do not match.');
      busy = true;
      try {
        const userId = recoveryUserId;
        const version = recoveryVersion;
        const {data, error} = await auth.getUser();
        if (error || data?.user?.id !== userId || recoveryUserId !== userId || version !== recoveryVersion) throw new Error('Your reset session is no longer valid. Request a new reset link.');
        const result = await auth.updateUser({password});
        if (result.error) throw new Error('Your password could not be updated. Use a different password with at least 8 characters, or request a new reset link.');
        recoveryUserId = null;
        notify();
        let signOutFailed = false;
        try { signOutFailed = Boolean((await auth.signOut({scope:'local'}))?.error); } catch { signOutFailed = true; }
        return {signOutFailed};
      } finally { busy = false; }
    }
  };
}
