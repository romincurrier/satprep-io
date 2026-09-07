import { supabase } from './supabase.js';
import { authReturnKind, createRecoveryController, verifiedAccountDestination } from './auth-flow.js';

// Capture callback kind before the auth client consumes its URL fragment.
export const initialAuthReturn = authReturnKind(location);
export const passwordRecovery = createRecoveryController(supabase?.auth);

// Keep this callback synchronous to avoid the client's auth session lock.
supabase?.auth.onAuthStateChange((event, session) => passwordRecovery.handleAuthEvent(event, session));

async function routeVerifiedAccount() {
  // Recovery must stay on the password screen and never enter onboarding.
  if (initialAuthReturn !== 'verification' || !supabase) return;
  try {
    for (let i = 0; i < 20; i++) {
      const {data} = await supabase.auth.getSession();
      if (data?.session) {
        const {data:profile} = await supabase.from('profiles').select('role').eq('id',data.session.user.id).maybeSingle();
        const destination = verifiedAccountDestination(profile?.role);
        if (destination) { location.replace(destination); return; }
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    location.replace('/?auth=login&confirmation=unavailable');
  } catch {
    location.replace('/?auth=login&confirmation=unavailable');
  }
}
routeVerifiedAccount();
