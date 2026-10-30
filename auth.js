// Supabase configuration for 3DPrint05.
// The publishable key is intended for browser use. Never put a secret/service_role key here.
const SUPABASE_URL = 'https://vtabvqnsswxmqdqnkpbf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__AyNaAazRNzfyrCHdsujDw_ot80jfxM';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  console.error('Supabase SDK не загрузился. Проверьте подключение к CDN.');
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

const AUTH = {
  client() {
    if (!window.supabaseClient) throw new Error('Не удалось подключиться к Supabase. Обновите страницу.');
    return window.supabaseClient;
  },
  async register(name, email, phone, password) {
    try {
      const { data, error } = await this.client().auth.signUp({
        email: String(email || '').trim().toLowerCase(),
        password,
        options: {
          data: { name: String(name || '').trim(), phone: String(phone || '').trim() },
          emailRedirectTo: window.location.origin + window.location.pathname.replace(/[^/]*$/, 'profile.html')
        }
      });
      if (error) return { ok: false, error: this.friendlyError(error) };
      return { ok: true, user: data.user, session: data.session, needsEmailConfirmation: !data.session };
    } catch (error) { return { ok: false, error: this.friendlyError(error) }; }
  },
  async login(email, password) {
    try {
      const { data, error } = await this.client().auth.signInWithPassword({
        email: String(email || '').trim().toLowerCase(), password
      });
      if (error) return { ok: false, error: this.friendlyError(error) };
      return { ok: true, user: data.user, session: data.session };
    } catch (error) { return { ok: false, error: this.friendlyError(error) }; }
  },
  async recoverPassword(email) {
    try {
      const redirectTo = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'update-password.html');
      const { error } = await this.client().auth.resetPasswordForEmail(
        String(email || '').trim().toLowerCase(), { redirectTo }
      );
      if (error) return { ok: false, error: this.friendlyError(error) };
      return { ok: true };
    } catch (error) { return { ok: false, error: this.friendlyError(error) }; }
  },
  async updatePassword(password) {
    try {
      const { error } = await this.client().auth.updateUser({ password });
      if (error) return { ok: false, error: this.friendlyError(error) };
      return { ok: true };
    } catch (error) { return { ok: false, error: this.friendlyError(error) }; }
  },
  async getSession() {
    const { data, error } = await this.client().auth.getSession();
    if (error) throw error;
    return data.session;
  },
  async currentUser() {
    const { data, error } = await this.client().auth.getUser();
    if (error || !data.user) return null;
    const u = data.user;
    return {
      id: u.id, email: u.email || '',
      name: u.user_metadata?.name || u.email?.split('@')[0] || 'Пользователь',
      phone: u.user_metadata?.phone || '', createdAt: u.created_at, orders: []
    };
  },
  async isLoggedIn() {
    try { return !!(await this.getSession()); } catch (_) { return false; }
  },
  async logout() {
    try {
      const { error } = await this.client().auth.signOut();
      if (error) throw error;
      window.location.href = 'index.html';
    } catch (error) { alert(this.friendlyError(error)); }
  },
  async addOrder(order) {
    console.warn('История заказов ещё не подключена к базе данных Supabase.', order);
    return { ok: false, error: 'Хранение заказов будет подключено следующим этапом.' };
  },
  friendlyError(error) {
    const m = String(error?.message || 'Неизвестная ошибка');
    if (/Invalid login credentials/i.test(m)) return 'Неверная почта или пароль.';
    if (/User already registered/i.test(m)) return 'Аккаунт с таким Email уже существует.';
    if (/Password should be at least/i.test(m)) return 'Пароль слишком короткий. Используйте не менее 6 символов.';
    if (/Email not confirmed/i.test(m)) return 'Подтвердите Email по ссылке из письма.';
    if (/rate limit/i.test(m)) return 'Слишком много запросов. Попробуйте позже.';
    return m;
  }
};

async function updateAuthUI() {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  let user = null;
  try { user = await AUTH.currentUser(); } catch (error) { console.error(error); }
  if (user) {
    const safeName = String(user.name).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    navAuth.innerHTML = `<a href="profile.html" class="btn-login"><span>${safeName}</span></a>
      <button class="btn-register" onclick="AUTH.logout()"><span>Выйти</span></button>`;
  } else {
    navAuth.innerHTML = `<a href="login.html" class="btn-login"><span>Войти</span></a>
      <a href="register.html" class="btn-register"><span>Регистрация</span></a>`;
  }
}
document.addEventListener('DOMContentLoaded', updateAuthUI);
