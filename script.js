var pkgData = {
  starter:  { name:'Starter Package',  cash:'$250',   pay:'4 biweekly payments of $111.56',  total:'$446.25',  features:['Full Access to Starter Course','Secure online sign-up','$5,000-valued savings book','Budgeting tools'] },
  silver:   { name:'Silver Package',   cash:'$500',   pay:'6 biweekly payments of $148.75',  total:'$892.50',  features:['Full Access to Silver Courses','Secure online sign-up','$10,000-valued savings book','Instant Cash Side Hustle','Budgeting tools','Debt tools'] },
  gold:     { name:'Gold Package',     cash:'$750',   pay:'8 biweekly payments of $167.34',  total:'$1,338.75',features:['Full Access to Gold Courses','Secure online sign-up','$15,000-valued savings book','Instant Cash Side Hustle','Budgeting tools','Debt tools'] },
  platinum: { name:'Platinum Package', cash:'$1,000', pay:'9 biweekly payments of $198.33',  total:'$1,785.00',features:['Full Access to Platinum Courses','Secure online sign-up','$20,000-valued savings book','Instant Cash Side Hustle','Budgeting tools','Debt tools'] },
  diamond:  { name:'Diamond Package',  cash:'$1,250', pay:'10 biweekly payments of $223.13', total:'$2,231.25',features:['Full Access to Diamond Courses','Secure online sign-up','$25,000-valued savings book','Instant Cash Side Hustle','Budgeting tools','Debt tools','Priority support','Premium resources'] },
  elite:    { name:'Elite Package',    cash:'$1,500', pay:'11 biweekly payments of $243.41', total:'$2,677.50',features:['Full Access to Elite Courses','Secure online sign-up','$30,000-valued savings book','Instant Cash Side Hustle','Budgeting tools','Debt tools','Priority support','Premium resources'] }
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
      '<div class="co-sum-pay">' + d.pay + '</div>' +
      '<div class="co-sum-total">Total Price with GST: ' + d.total + '</div>';
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
