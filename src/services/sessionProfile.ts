export interface SessionProfileState<Profile> {
  uid: string | null;
  status: 'loading' | 'ready' | 'error';
  profile: Profile | null;
  error: string | null;
}

export function createSessionProfileLoader<Profile>(
  fetchProfile: (uid: string) => Promise<Profile | null>,
  onState: (state: SessionProfileState<Profile>) => void,
) {
  let generation = 0;
  let disposed = false;
  return {
    async load(uid: string | null) {
      if (disposed) return;
      const request = ++generation;
      onState({ uid, status: uid ? 'loading' : 'ready', profile: null, error: null });
      if (!uid) return;
      try {
        const profile = await fetchProfile(uid);
        if (!disposed && request === generation) onState({ uid, status: 'ready', profile, error: null });
      } catch (error) {
        if (!disposed && request === generation) onState({
          uid, status: 'error', profile: null,
          error: error instanceof Error ? error.message : 'Your saved profile could not be loaded.',
        });
      }
    },
    dispose() { disposed = true; generation += 1; },
  };
}

export function getEntryStage<Profile>(
  authResolved: boolean,
  uid: string | null,
  state: SessionProfileState<Profile>,
  hasChart: boolean,
) {
  if (!authResolved) return 'session-loading';
  if (!uid) return 'login';
  if (state.uid !== uid || state.status === 'loading') return 'profile-loading';
  if (state.status === 'error') return 'profile-error';
  return hasChart ? 'workspace' : 'onboarding';
}
