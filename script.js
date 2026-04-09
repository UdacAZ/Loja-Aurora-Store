/**
 * AURORA STORE — script.js
 * Funcionalidades: navbar scroll, menu mobile, animações de scroll,
 * carrinho simulado, formulário, botão voltar ao topo.
 */

/* ============================================================
   1. UTILITÁRIOS
============================================================ */

/**
 * Exibe uma notificação toast temporária.
 * @param {string} message - Texto da notificação.
 * @param {number} duration - Duração em ms (padrão: 3000).
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  // Remove automaticamente após o tempo definido
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* ============================================================
   2. NAVBAR — scroll e menu mobile
============================================================ */
function initNavbar() {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');
  const mobileLinks = document.querySelectorAll('.nav-mobile-link');

  if (!header) return;

  /* ---- Efeito de scroll ---- */
  const handleScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Verifica estado inicial

  /* ---- Menu hamburguer (mobile) ---- */
  if (!hamburger || !navMobile) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navMobile.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Fecha o menu ao clicar em um link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMobile.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Fecha o menu ao clicar fora
  document.addEventListener('click', (e) => {
    const clickedOutside =
      !header.contains(e.target);

    if (clickedOutside && navMobile.classList.contains('open')) {
      hamburger.classList.remove('open');
      navMobile.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   3. LINK ATIVO NO MENU — realça a seção visível
============================================================ */
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-desktop a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}

/* ============================================================
   4. ANIMAÇÕES DE SCROLL (Intersection Observer)
============================================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Para de observar após animar (performance)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,        // Começa a animar quando 12% do elemento está visível
      rootMargin: '0px 0px -40px 0px', // Ativa um pouco antes do final da viewport
    }
  );

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   5. CARRINHO — Estado, renderização e interações
============================================================ */

/** Estado do carrinho */
const cart = {
  items: [],

  add(name, price) {
    const existing = this.items.find(i => i.name === name);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ id: Date.now(), name, price, qty: 1 });
    }
    this.save();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },

  updateQty(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.save();
  },

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  get count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  save() {
    try { localStorage.setItem('aurora_cart', JSON.stringify(this.items)); } catch {}
  },

  load() {
    try {
      const data = localStorage.getItem('aurora_cart');
      if (data) this.items = JSON.parse(data);
    } catch {}
  }
};

/** Formata número para moeda brasileira */
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Atualiza o badge de contagem do carrinho */
function updateCartBadge() {
  const cartCount = document.getElementById('cartCount');
  if (!cartCount) return;
  const n = cart.count;
  cartCount.textContent = n;
  cartCount.classList.toggle('hidden-badge', n === 0);

  cartCount.classList.remove('bump');
  void cartCount.offsetWidth;
  cartCount.classList.add('bump');
  setTimeout(() => cartCount.classList.remove('bump'), 400);
}

/** Renderiza os itens dentro do drawer */
function renderCartDrawer() {
  const list      = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartEmptyState');
  const footer    = document.getElementById('cartDrawerFooter');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl   = document.getElementById('cartTotalLabel');
  const shippingEl = document.getElementById('cartShippingLabel');

  if (!list) return;

  list.innerHTML = '';

  const isEmpty = cart.items.length === 0;
  emptyState.style.display = isEmpty ? 'flex' : 'none';
  list.style.display        = isEmpty ? 'none' : 'block';
  footer.style.display      = isEmpty ? 'none' : 'flex';

  if (isEmpty) return;

  cart.items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-unit-price">${formatBRL(item.price)} / un.</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="minus" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" data-action="plus" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
      </div>
      <div class="cart-item-right">
        <p class="cart-item-total">${formatBRL(item.price * item.qty)}</p>
        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remover item">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    list.appendChild(li);
  });

  const subtotal = cart.total;
  const freeShipping = subtotal >= 299;
  const shipping = freeShipping ? 0 : 19.90;
  const total = subtotal + shipping;

  subtotalEl.textContent = formatBRL(subtotal);
  shippingEl.textContent = freeShipping ? 'Grátis' : formatBRL(shipping);
  shippingEl.className = freeShipping ? 'cart-free-shipping' : '';
  totalEl.textContent = formatBRL(total);
}

/** Abre/fecha o drawer do carrinho */
function openCartDrawer() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function initBuyButtons() {
  const buyButtons = document.querySelectorAll('.btn-buy');
  if (!buyButtons.length) return;

  cart.load();
  updateCartBadge();
  renderCartDrawer();

  // Animação bump
  const style = document.createElement('style');
  style.textContent = `
    .cart-count.bump { animation: cartBump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes cartBump { 0%{transform:scale(1)} 50%{transform:scale(1.6)} 100%{transform:scale(1)} }
    .cart-count.hidden-badge { display: none; }
  `;
  document.head.appendChild(style);

  buyButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const name  = this.dataset.product || 'Produto';
      const price = parseFloat(this.dataset.price) || 0;

      cart.add(name, price);
      updateCartBadge();
      renderCartDrawer();

      // Feedback visual no botão
      const originalHTML = this.innerHTML;
      this.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
      this.style.background = 'var(--gold)';
      this.disabled = true;
      setTimeout(() => {
        this.innerHTML = originalHTML;
        this.style.background = '';
        this.disabled = false;
      }, 1800);

      showToast(`"${name}" adicionado ao carrinho!`);
    });
  });

  // Clique no ícone do carrinho (header) → abre drawer
  document.querySelector('.cart-btn')?.addEventListener('click', openCartDrawer);

  // Fechar drawer
  document.getElementById('cartClose')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartDrawer);

  // Delegação de eventos nos itens (qty e remove)
  document.getElementById('cartItemsList')?.addEventListener('click', e => {
    const qtyBtn    = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.cart-item-remove');

    if (qtyBtn) {
      const id     = Number(qtyBtn.dataset.id);
      const action = qtyBtn.dataset.action;
      cart.updateQty(id, action === 'plus' ? 1 : -1);
      updateCartBadge();
      renderCartDrawer();
    }

    if (removeBtn) {
      const id = Number(removeBtn.dataset.id);
      cart.remove(id);
      updateCartBadge();
      renderCartDrawer();
      showToast('Item removido do carrinho.');
    }
  });

  // Botão "Finalizar Compra"
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    closeCartDrawer();
    openCheckoutModal();
  });
}

/* ============================================================
   6. ÍCONES DE WISHLIST — toggle coração
============================================================ */
function initWishlist() {
  const wishlistBtns = document.querySelectorAll('.btn-wishlist');

  wishlistBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const icon = this.querySelector('i');
      if (!icon) return;

      if (icon.classList.contains('fa-heart') && !icon.classList.contains('fas-active')) {
        icon.style.color = '#e74c3c';
        icon.classList.add('fas-active');
        showToast('Produto salvo na lista de desejos!');
      } else {
        icon.style.color = '';
        icon.classList.remove('fas-active');
      }
    });
  });
}

/* ============================================================
   7. FORMULÁRIO DE CONTATO — validação e envio simulado
============================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Coleta e valida campos
    const name    = this.querySelector('#name');
    const email   = this.querySelector('#email');
    const message = this.querySelector('#message');

    let isValid = true;

    // Remove erros anteriores
    this.querySelectorAll('.field-error').forEach(el => el.remove());
    this.querySelectorAll('input, textarea, select').forEach(el => {
      el.style.borderColor = '';
    });

    // Validação simples
    if (!name.value.trim() || name.value.trim().length < 2) {
      showFieldError(name, 'Informe seu nome completo.');
      isValid = false;
    }

    if (!isValidEmail(email.value.trim())) {
      showFieldError(email, 'Informe um e-mail válido.');
      isValid = false;
    }

    if (!message.value.trim() || message.value.trim().length < 10) {
      showFieldError(message, 'A mensagem deve ter pelo menos 10 caracteres.');
      isValid = false;
    }

    if (!isValid) return;

    // Simula envio
    const submitBtn = this.querySelector('[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Mensagem enviada!';

      showToast('Mensagem enviada com sucesso! Entraremos em contato em breve.');

      // Reseta após 2.5s
      setTimeout(() => {
        form.reset();
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }, 2500);
    }, 1500);
  });
}

/** Exibe uma mensagem de erro abaixo de um campo. */
function showFieldError(field, message) {
  field.style.borderColor = '#e74c3c';

  const error = document.createElement('span');
  error.className = 'field-error';
  error.textContent = message;
  error.style.cssText = `
    display: block;
    font-size: 0.75rem;
    color: #e74c3c;
    margin-top: 4px;
    font-weight: 500;
  `;
  field.parentNode.appendChild(error);
}

/** Valida formato básico de e-mail. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ============================================================
   8. BOTÃO VOLTAR AO TOPO
============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');

  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   9. SCROLL SUAVE PARA LINKS ÂNCORA
============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('header')?.offsetHeight || 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   10. ANIMAÇÃO DO HERO — efeito de entrada ao carregar
============================================================ */
function initHeroAnimation() {
  const heroElements = document.querySelectorAll('.hero .reveal');

  // Pequeno delay para garantir que o CSS foi aplicado
  requestAnimationFrame(() => {
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 200 + index * 150);
    });
  });
}

/* ============================================================
   11. LAZY LOADING EXTRA — Para navegadores sem suporte nativo
============================================================ */
function initLazyLoading() {
  // O atributo loading="lazy" já faz isso nativamente nos navegadores modernos.
  // Esta função é um fallback para navegadores mais antigos.
  if ('loading' in HTMLImageElement.prototype) return;

  const images = document.querySelectorAll('img[loading="lazy"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => observer.observe(img));
}

/* ============================================================
   12. COUNTER ANIMADO (estatísticas do promo banner)
============================================================ */
function initCounterAnimation() {
  const statNumbers = document.querySelectorAll('.stat-number');

  if (!statNumbers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach(el => observer.observe(el));
}

/**
 * Anima um número do zero até o valor final.
 * Extrai apenas o número do texto (ignora "+", "K", "★", etc.).
 * @param {HTMLElement} el
 */
function animateCounter(el) {
  const text     = el.textContent.trim();
  const prefix   = text.match(/^[+]?/)?.[0] || '';
  const numMatch = text.match(/[\d]+/);
  const suffix   = text.replace(/^[+\d]+/, '');

  if (!numMatch) return;

  const target   = parseInt(numMatch[0], 10);
  const duration = 1500;
  const start    = performance.now();

  const step = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * target);

    el.textContent = `${prefix}${current}${suffix}`;

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

/* ============================================================
   CHECKOUT — Modal de 3 etapas
============================================================ */
function openCheckoutModal() {
  goToCheckoutStep(1);
  populateInstallments();
  populateOrderSummary();
  document.getElementById('checkoutOverlay').classList.add('open');
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

function goToCheckoutStep(step) {
  document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.checkout-step').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle('active', n <= step);
    s.classList.toggle('done', n < step);
  });
  const panel = document.getElementById(`checkoutStep${step}`);
  if (panel) panel.classList.add('active');
}

function populateInstallments() {
  const select = document.getElementById('ckInstallments');
  if (!select) return;
  const total = cart.total;
  select.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const val = total / i;
    const label = i === 1
      ? `1x de ${formatBRL(total)} (à vista)`
      : `${i}x de ${formatBRL(val)} sem juros`;
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

function populateOrderSummary() {
  const container = document.getElementById('orderSummaryItems');
  const totalEl   = document.getElementById('orderSummaryTotal');
  if (!container) return;

  container.innerHTML = cart.items.map(item => `
    <div class="order-summary-row">
      <span>${item.name} × ${item.qty}</span>
      <span>${formatBRL(item.price * item.qty)}</span>
    </div>
  `).join('');

  const subtotal = cart.total;
  const total = subtotal >= 299 ? subtotal : subtotal + 19.90;
  if (totalEl) totalEl.textContent = formatBRL(total);
}

function generateOrderNumber() {
  return '#AUR-' + Math.floor(10000 + Math.random() * 90000);
}

function initCheckout() {
  // Cancelar / fechar
  document.getElementById('checkoutCancelBtn')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutOverlay')?.addEventListener('click', closeCheckoutModal);

  // Navegação entre etapas
  document.getElementById('toStep2Btn')?.addEventListener('click', () => goToCheckoutStep(2));
  document.getElementById('backToStep1Btn')?.addEventListener('click', () => goToCheckoutStep(1));
  document.getElementById('toStep3Btn')?.addEventListener('click', () => {
    goToCheckoutStep(3);
    populateOrderSummary();
  });
  document.getElementById('backToStep2Btn')?.addEventListener('click', () => goToCheckoutStep(2));

  // Seletor de método de pagamento
  document.querySelectorAll('.payment-method').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
      const method = label.querySelector('input')?.value;
      document.getElementById('cardForm').style.display   = method === 'card'   ? 'block' : 'none';
      document.getElementById('pixPanel').style.display   = method === 'pix'    ? 'block' : 'none';
      document.getElementById('boletoPanel').style.display = method === 'boleto' ? 'block' : 'none';
    });
  });

  // Copiar chave Pix
  document.getElementById('pixCopyBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText('12.345.678/0001-90').catch(() => {});
    showToast('Chave Pix copiada!');
  });

  // Preview do cartão — número
  document.getElementById('ckCardNumber')?.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 16);
    this.value = v.replace(/(.{4})/g, '$1 ').trim();
    const display = document.getElementById('cardNumberDisplay');
    if (display) display.textContent = this.value || '•••• •••• •••• ••••';
  });

  // Preview do cartão — nome
  document.getElementById('ckCardName')?.addEventListener('input', function () {
    const display = document.getElementById('cardHolderDisplay');
    if (display) display.textContent = this.value.toUpperCase() || 'NOME NO CARTÃO';
  });

  // Preview do cartão — validade
  document.getElementById('ckCardExpiry')?.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.value = v;
    const display = document.getElementById('cardExpiryDisplay');
    if (display) display.textContent = this.value || 'MM/AA';
  });

  // Confirmar pedido
  document.getElementById('confirmOrderBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('confirmOrderBtn');
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    setTimeout(() => {
      const orderNum = generateOrderNumber();
      const name = document.getElementById('ckName')?.value.split(' ')[0] || 'Cliente';
      const email = document.getElementById('ckEmail')?.value || '—';

      document.getElementById('orderNumber').textContent = orderNum;
      document.getElementById('successName').textContent = name;
      document.getElementById('successEmail').textContent = email;

      // Mostra tela de sucesso
      document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('checkoutSuccess').classList.add('active');
      // Oculta steps
      document.querySelector('.checkout-steps').style.display = 'none';

      // Esvazia o carrinho
      cart.items = [];
      cart.save();
      updateCartBadge();
      renderCartDrawer();

      btn.innerHTML = origHTML;
      btn.disabled = false;
    }, 2000);
  });

  // Fechar tela de sucesso
  document.getElementById('successCloseBtn')?.addEventListener('click', () => {
    closeCheckoutModal();
    document.querySelector('.checkout-steps').style.display = '';
  });
}

/* ============================================================
   INICIALIZAÇÃO — Executa quando o DOM está pronto
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initActiveNavLink();
  initScrollAnimations();
  initHeroAnimation();
  initBuyButtons();
  initWishlist();
  initContactForm();
  initBackToTop();
  initSmoothScroll();
  initLazyLoading();
  initCounterAnimation();
  initCheckout();

  console.log('%c Aurora Store 🌟 ', 'background:#c9a84c;color:#fff;font-size:14px;padding:4px 8px;border-radius:4px;');
  console.log('%c Site carregado com sucesso! ', 'color:#c9a84c;font-size:12px;');
});
