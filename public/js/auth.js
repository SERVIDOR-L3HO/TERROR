import { auth, db } from '/js/firebase-config.js';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export let currentUser = null;

// Create/update user doc in Firestore on first login
async function ensureUserProfile(user) {
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || null,
      bio: '',
      createdAt: serverTimestamp(),
      storiesCount: 0
    });
  }
}

// Build initials from name
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Update navbar UI based on auth state
function updateNavbar(user) {
  const loginArea  = document.getElementById('navLoginArea');
  const userArea   = document.getElementById('navUserArea');
  const avatarEl   = document.getElementById('navAvatarImg');
  const nameEl     = document.getElementById('navDropdownName');
  const emailEl    = document.getElementById('navDropdownEmail');
  const initEl     = document.getElementById('navAvatarInit');

  if (!loginArea) return;

  if (user) {
    loginArea.style.display = 'none';
    userArea.style.display  = 'flex';
    if (nameEl)  nameEl.textContent  = user.displayName || 'Usuario';
    if (emailEl) emailEl.textContent = user.email;
    if (user.photoURL && avatarEl) {
      avatarEl.src = user.photoURL;
      avatarEl.style.display = 'block';
      if (initEl) initEl.style.display = 'none';
    } else if (initEl) {
      initEl.textContent = initials(user.displayName || user.email);
      if (avatarEl) avatarEl.style.display = 'none';
    }
  } else {
    loginArea.style.display = 'flex';
    userArea.style.display  = 'none';
  }
}

// Init auth listener
export function initAuth(callback) {
  onAuthStateChanged(auth, async user => {
    currentUser = user;
    updateNavbar(user);
    if (user) await ensureUserProfile(user);
    if (callback) callback(user);
  });
}

// Toggle user dropdown
export function toggleDropdown() {
  const d = document.getElementById('navDropdown');
  if (d) d.classList.toggle('open');
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  const area = document.getElementById('navUserArea');
  const d    = document.getElementById('navDropdown');
  if (d && area && !area.contains(e.target)) d.classList.remove('open');
});

// Sign out
export async function doSignOut() {
  await signOut(auth);
  window.location.href = '/';
}

// Google sign-in
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Email sign-up
export async function signUpEmail(name, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

// Email sign-in
export async function signInEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'Este correo ya está registrado.',
    'auth/wrong-password':           'Contraseña incorrecta.',
    'auth/user-not-found':           'No existe cuenta con ese correo.',
    'auth/invalid-email':            'Correo no válido.',
    'auth/weak-password':            'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests':        'Demasiados intentos. Intenta más tarde.',
    'auth/popup-closed-by-user':     'Ventana cerrada. Inténtalo de nuevo.',
    'auth/network-request-failed':   'Error de red. Verifica tu conexión.',
    'auth/invalid-credential':       'Correo o contraseña incorrectos.',
  };
  return map[code] || 'Error de autenticación. Inténtalo de nuevo.';
}

export { initials };
