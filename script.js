var pkgData = {
  starter:  { name:'Starter Package',  cash:'$250',   pay:'4 biweekly payments of $111.56',  total:'$446.25',  features:['Full Access to Starter Course','Secure online sign-up','Up to $5,000+ VIP Membership Perks','Budgeting tools'] },
  silver:   { name:'Silver Package',   cash:'$500',   pay:'6 biweekly payments of $148.75',  total:'$892.50',  features:['Full Access to Silver Courses','Secure online sign-up','Up to $10,000+ VIP Membership Perks','Side Hustle of the Month','Budgeting tools','Debt tools'] },
  gold:     { name:'Gold Package',     cash:'$750',   pay:'8 biweekly payments of $167.34',  total:'$1,338.75',features:['Full Access to Gold Courses','Secure online sign-up','Up to $15,000+ VIP Membership Perks','Side Hustle of the Month','Budgeting tools','Debt tools'] },
  platinum: { name:'Platinum Package', cash:'$1,000', pay:'9 biweekly payments of $198.33',  total:'$1,785.00',features:['Full Access to Platinum Courses','Secure online sign-up','Up to $20,000+ VIP Membership Perks','Side Hustle of the Month','Budgeting tools','Debt tools'] },
  diamond:  { name:'Diamond Package',  cash:'$1,250', pay:'10 biweekly payments of $223.13', total:'$2,231.25',features:['Full Access to Diamond Courses','Secure online sign-up','Up to $25,000+ VIP Membership Perks','Side Hustle of the Month','Budgeting tools','Debt tools','Priority support','Premium resources'] },
  elite:    { name:'Elite Package',    cash:'$1,500', pay:'11 biweekly payments of $243.41', total:'$2,677.50',features:['Full Access to Elite Courses','Secure online sign-up','Up to $30,000+ VIP Membership Perks','Side Hustle of the Month','Budgeting tools','Debt tools','Priority support','Premium resources'] }
};
var selectedPkg = 'silver';

// Page-id ↔ URL-path routing tables
var PAGE_URLS = {
  home:     '/',
  hiw:      '/how-it-works',
  packages: '/packages',
  faq:      '/faq',
  contact:  '/contact-us',
  checkout: '/checkout',
  privacy:  '/privacy-policy',
  tos:      '/terms-of-service'
};
var URL_PAGES = (function() {
  var m = {};
  Object.keys(PAGE_URLS).forEach(function(k) { m[PAGE_URLS[k]] = k; });
  return m;
}());

function navigate(page, pkg) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); }
  if (page === 'checkout' && pkg) { selectPackage(pkg); }
  window.scrollTo(0, 0);
  closeMenu();
  // Update active nav link
  document.querySelectorAll('.nav-links a').forEach(function(a){ a.classList.remove('active'); });
  var nl = document.getElementById('nl-' + page);
  if (nl) nl.classList.add('active');
  // Re-run reveal for new page
  initReveal();
  initScratchCards();
  // Keep the browser URL in sync — enables direct linking and back/forward
  var _newPath = PAGE_URLS[page] || '/';
  if (window.location.pathname !== _newPath) {
    history.pushState({ page: page, pkg: pkg || null }, '', _newPath);
  } else {
    // Attach state to the initial history entry on first load
    history.replaceState({ page: page, pkg: pkg || null }, '', _newPath);
  }
}

function navigateToPackagesGrid() {
  navigate('packages');
  window.requestAnimationFrame(function() {
    window.requestAnimationFrame(function() {
      var grid = document.querySelector('#page-packages .pkg-grid');
      if (!grid) return;
      var top = grid.getBoundingClientRect().top + window.pageYOffset - 28;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });
}

function navigateToSignup() {
  window.location.href = 'https://signup.creditpulse.ca/';
}

var selectedHeroPkg = 'elite';
var heroPkgOrder = ['starter', 'silver', 'gold', 'elite'];

function selectHeroPkg(pkg) {
  var d = pkgData[pkg];
  if (!d) return;
  selectedHeroPkg = pkg;

  heroPkgOrder.forEach(function(id) {
    var tile = document.getElementById('hc-pkg-tile-' + id);
    if (tile) tile.classList.toggle('hc-pkg-tile--active', id === pkg);
  });

  var amountEl = document.getElementById('hc-amount');
  var descPkgEl = document.getElementById('hc-desc-pkg');
  if (amountEl) amountEl.textContent = d.cash;
  if (descPkgEl) descPkgEl.textContent = d.name;

  var savingsFeature = d.features.filter(function(f) { return /VIP Membership Perks/i.test(f); })[0] || '';
  var savingsAmt = (savingsFeature.match(/\$[\d,]+/) || [])[0];
  var savingsLabel = savingsAmt ? savingsAmt + '+ VIP Membership Perks' : '';

  var perk1 = document.getElementById('hc-perk-1');
  var perk2 = document.getElementById('hc-perk-2');
  var perk3 = document.getElementById('hc-perk-3');
  if (perk1) perk1.textContent = d.cash + ' Cashback Subscriber Reward';
  if (perk2) perk2.textContent = 'Expert insights and educational content';
  if (perk3 && savingsLabel) perk3.textContent = savingsLabel;
}

function pickHeroBenefits() {
  navigate('checkout', selectedHeroPkg);
}

function selectPackage(pkg) {
  selectedPkg = pkg;
  document.querySelectorAll('.co-pkg-card').forEach(function(c){
    c.classList.remove('selected');
    c.setAttribute('aria-pressed', 'false');
  });
  var card = document.getElementById('co-pkg-' + pkg);
  if (card) {
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }
  var d = pkgData[pkg];
  if (!d) return;
  renderPackagePreview(pkg);
  var el = document.getElementById('co-sum-inner');
  if (el) {
    var chk = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    var featuresHtml = '<ul class="co-sum-features">' + d.features.map(function(f){ return '<li>' + chk + '<span>' + f + '</span></li>'; }).join('') + '</ul>';
    el.innerHTML = '<div class="co-sum-pkg">' + d.name + '</div>' +
      '<div class="co-sum-cash-row"><div class="co-sum-cash">' + d.cash + '</div>' +
      '<div class="co-sum-cash-note">Cashback earned upon membership activation</div></div>' +
      featuresHtml +
      '<div class="co-sum-pay">' + d.pay + '</div>';
  }
}

function previewPackage(pkg) {
  renderPackagePreview(pkg);
}

function restorePackagePreview() {
  renderPackagePreview(selectedPkg);
}

function renderPackagePreview(pkg) {
  var d = pkgData[pkg];
  var preview = document.getElementById('co-pkg-preview');
  var name = document.getElementById('co-preview-name');
  var cash = document.getElementById('co-preview-cash');
  var features = document.getElementById('co-preview-features');
  if (!d || !preview || !name || !cash || !features) return;
  name.textContent = d.name;
  cash.textContent = d.cash + ' Cashback';
  features.innerHTML = d.features.map(function(feature) {
    return '<li>' + feature + '</li>';
  }).join('');
  preview.setAttribute('data-package', pkg);
}

function handleSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  var chk = document.getElementById('co-agree-check');
  if (!chk || !chk.checked) {
    alert('Please confirm that you understand Credit Pulse is an education-based membership platform before proceeding.');
    return;
  }
  window.location.href = 'https://signup.creditpulse.ca/';
}

function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}
function toggleFaq(btn) {
  var item = btn.closest('.faq-item');
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i){ i.classList.remove('open'); });
  if (!isOpen) item.classList.add('open');
}

function filterFaq(cat, tabEl) {
  document.querySelectorAll('.faq-tab').forEach(function(t){ t.classList.remove('active'); });
  tabEl.classList.add('active');
  document.querySelectorAll('.faq-card .faq-item').forEach(function(item) {
    var show = cat === 'all' || item.getAttribute('data-cat') === cat;
    item.style.display = show ? '' : 'none';
    if (!show && item.classList.contains('open')) item.classList.remove('open');
  });
}

// Single IntersectionObserver instance – disconnect before reuse to prevent observer accumulation
var _revealObs = null;
function initReveal() {
  if (_revealObs) { _revealObs.disconnect(); _revealObs = null; }
  var els = document.querySelectorAll('.page.active .reveal:not(.visible)');
  if (!els.length) return;
  _revealObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function(){ entry.target.classList.add('visible'); }, i * 70);
        _revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(function(el){ _revealObs.observe(el); });
}

// Scratch-off bonus cards: canvas foil layer the visitor scratches away with
// mouse/touch/pen (unified via Pointer Events) to reveal the prize text underneath.
function initScratchCards() {
  var cards = document.querySelectorAll('.page.active .pkg-scratch');
  cards.forEach(function(card) {
    var canvas = card.querySelector('.pkg-scratch-canvas');
    if (!canvas || canvas.dataset.scratchReady) return;
    var rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // hidden page - size on next activation
    canvas.dataset.scratchReady = '1';

    var ctx = canvas.getContext('2d');
    var revealed = false;
    var drawing = false;
    var lastX = 0, lastY = 0;

    function paintFoil(w, h) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#8fd35f');
      g.addColorStop(.5, '#4d8a37');
      g.addColorStop(1, '#2c5a1d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.lineWidth = 2;
      for (var i = -h; i < w; i += 9) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      var label = '🎁 SCRATCH TO REVEAL VIP MEMBERSHIP PERKS';
      var fontSize = 12;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      do {
        ctx.font = '700 ' + fontSize + 'px Arial, sans-serif';
        fontSize -= 0.5;
      } while (ctx.measureText(label).width > w - 24 && fontSize > 8);
      ctx.fillText(label, w / 2, h / 2);
    }

    function size() {
      var r = card.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!revealed) paintFoil(r.width, r.height);
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fill();
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      canvas.classList.add('is-revealed');
      card.classList.add('is-revealed');
    }

    function checkProgress() {
      if (revealed) return;
      var w = canvas.width, h = canvas.height;
      if (!w || !h) return;
      var data;
      try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return; }
      var sampled = 0, cleared = 0;
      for (var i = 3; i < data.length; i += 4 * 24) {
        sampled++;
        if (data[i] === 0) cleared++;
      }
      if (sampled && cleared / sampled > 0.55) reveal();
    }

    function posFromEvent(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    canvas.addEventListener('pointerdown', function(e) {
      if (revealed) return;
      drawing = true;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      var p = posFromEvent(e);
      scratchAt(p.x, p.y);
      lastX = p.x; lastY = p.y;
    });
    canvas.addEventListener('pointermove', function(e) {
      if (!drawing || revealed) return;
      var p = posFromEvent(e);
      var dist = Math.hypot(p.x - lastX, p.y - lastY);
      var steps = Math.max(1, Math.floor(dist / 6));
      for (var s = 1; s <= steps; s++) {
        scratchAt(lastX + (p.x - lastX) * (s / steps), lastY + (p.y - lastY) * (s / steps));
      }
      lastX = p.x; lastY = p.y;
    });
    function stopDrawing() {
      if (!drawing) return;
      drawing = false;
      checkProgress();
    }
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);

    size();
    window.addEventListener('resize', debounce(size, 200));
  });
}

function debounce(fn, wait) {
  var t;
  return function() {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(ctx, args); }, wait);
  };
}

// Scroll handler: cache the navbar element, gate writes behind rAF, and skip
// identical writes to avoid forcing layout recalculation on every scroll tick.
var _navEl = null;
var _scrollTicking = false;
var _lastShadow = null;
window.addEventListener('scroll', function() {
  if (_scrollTicking) return;
  _scrollTicking = true;
  window.requestAnimationFrame(function() {
    // Read scroll position (no layout trigger; scrollY is a cached compositor value)
    var wantShadow = window.scrollY > 40 ? '0 2px 20px rgba(0,0,0,.12)' : 'none';
    // Write only when the value actually changes to avoid unnecessary style invalidation
    if (wantShadow !== _lastShadow) {
      if (!_navEl) _navEl = document.getElementById('navbar');
      _navEl.style.boxShadow = wantShadow;
      _lastShadow = wantShadow;
    }
    _scrollTicking = false;
  });
}, { passive: true }); // passive:true lets the browser composite immediately without waiting for JS

// Back / forward button support
window.addEventListener('popstate', function(e) {
  var page = (e.state && e.state.page)
    ? e.state.page
    : (URL_PAGES[window.location.pathname.replace(/\/$/, '') || '/'] || 'home');
  var pkg  = e.state && e.state.pkg ? e.state.pkg : undefined;
  navigate(page, pkg);
});

// Boot: navigate to the page that matches the current URL so direct links work
(function() {
  var initPath = window.location.pathname.replace(/\/$/, '') || '/';
  navigate(URL_PAGES[initPath] || 'home');
}());
