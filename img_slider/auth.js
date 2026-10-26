// ═══════════════════════════════════════════════════════════
//  AUTH MODULE — локальная "база данных" пользователей
//  В реальном проекте заменить localStorage на fetch() к API
// ═══════════════════════════════════════════════════════════

const AUTH = {
  // Получить массив всех пользователей
  getUsers() {
    return JSON.parse(localStorage.getItem('pp3d_users') || '[]');
  },

  // Сохранить массив пользователей
  saveUsers(users) {
    localStorage.setItem('pp3d_users', JSON.stringify(users));
  },

  // Получить текущую сессию
  getSession() {
    return JSON.parse(localStorage.getItem('pp3d_session') || 'null');
  },

  // Сохранить сессию
  setSession(user) {
    localStorage.setItem('pp3d_session', JSON.stringify({
      email: user.email,
      name: user.name,
      phone: user.phone,
      loggedInAt: new Date().toISOString()
    }));
  },

  // Очистить сессию
  clearSession() {
    localStorage.removeItem('pp3d_session');
  },

  // Регистрация
  register(name, email, phone, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Пользователь с таким email уже существует' };
    }
    if (users.find(u => u.phone === phone)) {
      return { ok: false, error: 'Пользователь с таким телефоном уже существует' };
    }
    const newUser = {
      id: 'u_' + Date.now(),
      name,
      email,
      phone,
      password, // ⚠️ в реальном проекте хешировать bcrypt!
      createdAt: new Date().toISOString(),
      orders: []
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setSession(newUser);
    return { ok: true };
  },

  // Вход
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: 'Неверный email или пароль' };
    this.setSession(user);
    return { ok: true };
  },

  // Выход
  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  },

  // Проверка авторизации
  isLoggedIn() {
    return !!this.getSession();
  },

  // Получить текущего пользователя
  currentUser() {
    const session = this.getSession();
    if (!session) return null;
    const users = this.getUsers();
    return users.find(u => u.email === session.email) || null;
  },

  // Добавить заказ в историю
  addOrder(order) {
    const user = this.currentUser();
    if (!user) return;
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx === -1) return;
    order.id = 'ord_' + Date.now();
    order.date = new Date().toLocaleDateString('ru-RU');
    users[idx].orders.unshift(order);
    this.saveUsers(users);
    // Обновить сессию
    this.setSession(users[idx]);
  }
};

// ═══════════════════════════════════════════════════════════
//  UI: обновление навигации на всех страницах
// ═══════════════════════════════════════════════════════════
function updateAuthUI() {
  const session = AUTH.getSession();
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (session) {
    navAuth.innerHTML = `
      <a href="profile.html" class="btn btn-outline" style="margin-right:0.5rem;">👤 ${session.name}</a>
      <button class="btn btn-primary" onclick="AUTH.logout()" style="font-size:0.85rem;padding:0.5rem 1rem;">Выйти</button>
    `;
  } else {
    navAuth.innerHTML = `
      <a href="login.html" class="btn btn-outline" style="margin-right:0.5rem;">Войти</a>
      <a href="register.html" class="btn btn-primary" style="font-size:0.85rem;padding:0.5rem 1rem;">Регистрация</a>
    `;
  }
}

// Автозапуск при загрузке
document.addEventListener('DOMContentLoaded', updateAuthUI);