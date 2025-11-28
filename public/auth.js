const identity = window.netlifyIdentity;

function normalizeUser(user) {
  return user
    ? {
        id: user.id,
        email: user.email,
        token: user.token?.access_token ?? null
      }
    : null;
}

function ensureIdentity() {
  if (!identity) {
    console.warn('Netlify Identity (Auth0) non disponibile: aggiungi lo script ufficiale.');
    return null;
  }
  identity.init();
  return identity;
}

export async function getSession() {
  const id = ensureIdentity();
  if (!id) return null;

  const current = id.currentUser();
  if (current) return { user: normalizeUser(current) };

  return new Promise((resolve) => {
    const handler = (user) => {
      id.off('init', handler);
      resolve(user ? { user: normalizeUser(user) } : null);
    };
    id.on('init', handler);
    id.init();
  });
}

export async function openAuthWidget(mode = 'login') {
  const id = ensureIdentity();
  if (!id) throw new Error('Auth0/Netlify Identity non configurato');

  return new Promise((resolve, reject) => {
    const onSuccess = (user) => {
      cleanup();
      resolve({ user: normalizeUser(user) });
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      id.off('login', onSuccess);
      id.off('signup', onSuccess);
      id.off('error', onError);
    };

    id.on('login', onSuccess);
    id.on('signup', onSuccess);
    id.on('error', onError);
    id.open(mode);
  });
}

export async function requireAuth(mode = 'login') {
  const session = await getSession();
  if (session?.user) return session;
  return openAuthWidget(mode);
}

export function onAuthChange(callback) {
  const id = ensureIdentity();
  if (!id) return () => {};

  const handleLogin = (user) => callback('login', { user: normalizeUser(user) });
  const handleLogout = () => callback('logout', null);
  const handleInit = (user) => callback('init', user ? { user: normalizeUser(user) } : null);

  id.on('login', handleLogin);
  id.on('logout', handleLogout);
  id.on('init', handleInit);

  return () => {
    id.off('login', handleLogin);
    id.off('logout', handleLogout);
    id.off('init', handleInit);
  };
}

export async function signOutUser() {
  const id = ensureIdentity();
  if (!id) return;
  return id.logout();
}
