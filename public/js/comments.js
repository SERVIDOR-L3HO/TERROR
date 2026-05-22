import { db } from '/js/firebase-config.js';
import { currentUser, initials } from '/js/auth.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  serverTimestamp, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initComments(historiaId) {
  const section = document.getElementById('commentsSection');
  if (!section) return;

  const commentsRef = collection(db, 'comentarios', historiaId, 'items');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  // Real-time listener
  onSnapshot(q, snap => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    renderComments(list, historiaId);
  }, err => {
    console.warn('Comments:', err.message);
    loadCommentsFallback(historiaId);
  });

  renderCommentForm(historiaId);
}

async function loadCommentsFallback(historiaId) {
  try {
    const commentsRef = collection(db, 'comentarios', historiaId, 'items');
    const snap = await getDocs(query(commentsRef, orderBy('createdAt', 'asc')));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    renderComments(list, historiaId);
  } catch (e) {
    console.warn(e);
  }
}

function renderComments(list, historiaId) {
  const container = document.getElementById('commentsList');
  const countEl   = document.getElementById('commentsCount');
  if (!container) return;

  if (countEl) countEl.textContent = `${list.length} comentario${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:2.5rem 0">
      <div class="empty-icon">💬</div>
      <p class="empty-sub">Sé el primero en comentar esta historia.</p>
    </div>`;
    return;
  }

  container.innerHTML = list.map(c => {
    const date = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'}) : '';
    const isOwn = currentUser && currentUser.uid === c.autorId;
    const avatarHtml = c.autorFoto
      ? `<img src="${c.autorFoto}" alt="${c.autorNombre}">`
      : `<span>${initials(c.autorNombre)}</span>`;
    return `
      <div class="comment-item" id="comment-${c.id}">
        <div class="comment-avatar">${avatarHtml}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${c.autorNombre || 'Anónimo'}</span>
            <span class="comment-date">${date}</span>
            ${isOwn ? `<button class="comment-delete" onclick="deleteComment('${historiaId}','${c.id}')">✕ Eliminar</button>` : ''}
          </div>
          <p class="comment-text">${escapeHtml(c.texto)}</p>
        </div>
      </div>`;
  }).join('');
}

function renderCommentForm(historiaId) {
  const formArea = document.getElementById('commentFormArea');
  if (!formArea) return;

  if (!currentUser) {
    formArea.innerHTML = `<div class="comment-auth-hint">
      <a href="/login">Inicia sesión</a> para dejar un comentario.
    </div>`;
    return;
  }

  const avatarHtml = currentUser.photoURL
    ? `<img src="${currentUser.photoURL}" alt="">`
    : `<span>${initials(currentUser.displayName || currentUser.email)}</span>`;

  formArea.innerHTML = `
    <div class="comment-form">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <div class="comment-avatar">${avatarHtml}</div>
        <textarea id="commentText" placeholder="¿Qué te pareció esta historia?..." maxlength="600" rows="3"></textarea>
      </div>
      <div class="comment-form-footer">
        <span class="char-hint"><span id="commentCharCount">0</span>/600</span>
        <button class="btn btn-primary btn-sm" id="submitCommentBtn" onclick="submitComment('${historiaId}')">Publicar comentario</button>
      </div>
    </div>`;

  document.getElementById('commentText').addEventListener('input', function() {
    document.getElementById('commentCharCount').textContent = this.value.length;
  });
}

window.submitComment = async function(historiaId) {
  const textarea = document.getElementById('commentText');
  const btn      = document.getElementById('submitCommentBtn');
  if (!textarea || !currentUser) return;

  const texto = textarea.value.trim();
  if (!texto || texto.length < 3) {
    window.showToast('Escribe al menos 3 caracteres.', 'error'); return;
  }

  btn.disabled = true; btn.textContent = 'Publicando...';
  try {
    await addDoc(collection(db, 'comentarios', historiaId, 'items'), {
      texto,
      autorId:     currentUser.uid,
      autorNombre: currentUser.displayName || currentUser.email.split('@')[0],
      autorFoto:   currentUser.photoURL || null,
      createdAt:   serverTimestamp()
    });
    textarea.value = '';
    document.getElementById('commentCharCount').textContent = '0';
    window.showToast('Comentario publicado.', 'success');
  } catch (e) {
    window.showToast('Error al publicar: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Publicar comentario';
  }
};

window.deleteComment = async function(historiaId, commentId) {
  if (!confirm('¿Eliminar este comentario?')) return;
  try {
    await deleteDoc(doc(db, 'comentarios', historiaId, 'items', commentId));
    window.showToast('Comentario eliminado.', 'info');
  } catch (e) {
    window.showToast('Error: ' + e.message, 'error');
  }
};

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
