/* Credit Pulse — Free Debt Payoff Calculator (snowball vs avalanche)
   Plain JavaScript, no libraries. The simulation is a pure function so it can
   be tested outside the browser (node: require('./debt-payoff.js')). */
(function (root) {
  'use strict';

  var MAX_MONTHS = 600;
  var EPS = 0.005; // half a cent

  /**
   * Simulate paying off debts month by month.
   * debts: [{ name, balance, rate (annual %), minPayment }]
   * extra: extra monthly payment on top of all minimums
   * method: 'snowball' (smallest balance first) | 'avalanche' (highest rate first)
   *
   * Each month: interest is added, every open debt gets its minimum, then the
   * rest of the fixed monthly budget (all minimums + extra) goes to the target
   * debt. When a debt is paid off its minimum stays in the budget, so it rolls
   * into the next debt in the payoff order.
   */
  function simulate(debts, extra, method) {
    var list = debts.map(function (d, i) {
      return { idx: i, name: d.name, balance: d.balance, rate: d.rate, minPayment: d.minPayment, paidMonth: null, interest: 0 };
    });

    var order = list.slice().sort(function (a, b) {
      if (method === 'avalanche') {
        return (b.rate - a.rate) || (a.balance - b.balance) || (a.idx - b.idx);
      }
      return (a.balance - b.balance) || (b.rate - a.rate) || (a.idx - b.idx);
    });

    var budget = list.reduce(function (s, d) { return s + d.minPayment; }, 0) + (extra || 0);
    var totalInterest = 0;
    var month = 0;

    list.forEach(function (d) { if (d.balance <= EPS) { d.balance = 0; d.paidMonth = 0; } });

    function openDebts() { return list.filter(function (d) { return d.balance > EPS; }); }

    while (openDebts().length && month < MAX_MONTHS) {
      month++;
      // 1. Interest accrues on every open balance.
      openDebts().forEach(function (d) {
        var interest = d.balance * (d.rate / 100) / 12;
        d.balance += interest;
        d.interest += interest;
        totalInterest += interest;
      });
      // 2. Minimum payment on every open debt.
      var available = budget;
      openDebts().forEach(function (d) {
        var pay = Math.min(d.minPayment, d.balance, available);
        d.balance -= pay;
        available -= pay;
      });
      // 3. Whatever is left goes to debts in payoff order (rollover).
      for (var i = 0; i < order.length && available > EPS; i++) {
        var t = order[i];
        if (t.balance <= EPS) continue;
        var p = Math.min(t.balance, available);
        t.balance -= p;
        available -= p;
      }
      list.forEach(function (d) {
        if (d.paidMonth === null && d.balance <= EPS) { d.balance = 0; d.paidMonth = month; }
      });
    }

    var paidOff = openDebts().length === 0;
    var payoffOrder = list
      .filter(function (d) { return d.paidMonth !== null; })
      .sort(function (a, b) { return (a.paidMonth - b.paidMonth) || (order.indexOf(a) - order.indexOf(b)); })
      .map(function (d) { return { name: d.name, month: d.paidMonth }; });

    return {
      method: method,
      paidOff: paidOff,
      months: paidOff ? month : null,
      totalInterest: totalInterest,
      monthlyBudget: budget,
      payoffOrder: payoffOrder,
      unpaid: list.filter(function (d) { return d.paidMonth === null; }).map(function (d) { return d.name; })
    };
  }

  /** Debts whose minimum payment does not cover the first month's interest. */
  function interestWarnings(debts) {
    return debts.filter(function (d) {
      return d.balance > 0 && d.minPayment <= d.balance * (d.rate / 100) / 12;
    });
  }

  function addMonths(start, n) {
    return new Date(start.getFullYear(), start.getMonth() + n, 1);
  }

  var api = { simulate: simulate, interestWarnings: interestWarnings, addMonths: addMonths, MAX_MONTHS: MAX_MONTHS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.CPDebtPayoff = api;

  /* ------------------------------------------------------------------ UI */
  if (typeof document === 'undefined') return;

  var MAX_DEBTS = 10;
  var money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
  var money2 = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var monthFmt = new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric' });
  var rowSeq = 0;

  function el(id) { return document.getElementById(id); }
  function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : NaN; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function duration(m) {
    var y = Math.floor(m / 12), r = m % 12, parts = [];
    if (y) parts.push(plural(y, 'year'));
    if (r || !y) parts.push(plural(r, 'month'));
    return parts.join(', ');
  }

  function addRow(d) {
    var rows = el('dpcRows');
    if (rows.children.length >= MAX_DEBTS) return;
    rowSeq++;
    var id = 'dpc' + rowSeq;
    var row = document.createElement('div');
    row.className = 'calc-row dpc-row';
    row.innerHTML =
      '<div class="calc-field calc-field--name"><label for="' + id + 'n">Debt name</label>' +
        '<input type="text" id="' + id + 'n" data-k="name" maxlength="40" placeholder="e.g. Visa" value="' + esc(d && d.name || '') + '"></div>' +
      '<div class="calc-field"><label for="' + id + 'b">Balance ($)</label>' +
        '<input type="number" id="' + id + 'b" data-k="balance" min="0" step="0.01" inputmode="decimal" placeholder="0" value="' + (d ? d.balance : '') + '"></div>' +
      '<div class="calc-field"><label for="' + id + 'r">Interest rate (%)</label>' +
        '<input type="number" id="' + id + 'r" data-k="rate" min="0" max="100" step="0.01" inputmode="decimal" placeholder="0" value="' + (d ? d.rate : '') + '"></div>' +
      '<div class="calc-field"><label for="' + id + 'm">Minimum monthly payment ($)</label>' +
        '<input type="number" id="' + id + 'm" data-k="minPayment" min="0" step="0.01" inputmode="decimal" placeholder="0" value="' + (d ? d.minPayment : '') + '"></div>' +
      '<button type="button" class="calc-remove" aria-label="Remove this debt" title="Remove this debt">&times;</button>';
    row.querySelector('.calc-remove').addEventListener('click', function () {
      if (el('dpcRows').children.length > 1) { row.remove(); } else { row.querySelectorAll('input').forEach(function (i) { i.value = ''; }); }
      refresh();
    });
    rows.appendChild(row);
    refresh();
  }

  function readDebts() {
    var debts = [], errors = [];
    Array.prototype.forEach.call(el('dpcRows').children, function (row, i) {
      var get = function (k) { return row.querySelector('[data-k="' + k + '"]').value; };
      var name = get('name').trim() || ('Debt ' + (i + 1));
      var rawB = get('balance'), rawR = get('rate'), rawM = get('minPayment');
      if (rawB === '' && rawR === '' && rawM === '') return; // empty row: ignore
      var b = num(rawB), r = rawR === '' ? 0 : num(rawR), m = num(rawM);
      if (!(b > 0)) { errors.push(name + ': enter a balance greater than $0.'); return; }
      if (!(r >= 0) || r > 100) { errors.push(name + ': enter an interest rate between 0% and 100%.'); return; }
      if (!(m > 0)) { errors.push(name + ': enter a minimum monthly payment greater than $0.'); return; }
      debts.push({ name: name, balance: b, rate: r, minPayment: m });
    });
    return { debts: debts, errors: errors };
  }

  function card(res, label, start) {
    if (!res.paidOff) {
      return '<div class="dpc-card"><h3>' + label + '</h3><p class="dpc-big dpc-bad">Not paid off in 50 years</p>' +
        '<p class="dpc-note">With these payments, ' + esc(res.unpaid.join(', ')) + ' would still have a balance after ' + MAX_MONTHS + ' months. Try a larger extra payment.</p></div>';
    }
    var orderHtml = res.payoffOrder.map(function (p) {
      return '<li><strong>' + esc(p.name) + '</strong> &mdash; paid off ' + monthFmt.format(addMonths(start, p.month)) + '</li>';
    }).join('');
    return '<div class="dpc-card"><h3>' + label + '</h3>' +
      '<dl class="dpc-stats">' +
        '<div><dt>Debt-free date</dt><dd>' + monthFmt.format(addMonths(start, res.months)) + '</dd></div>' +
        '<div><dt>Time to pay off</dt><dd>' + plural(res.months, 'month') + ' <span>(' + duration(res.months) + ')</span></dd></div>' +
        '<div><dt>Total interest paid</dt><dd>' + money2.format(res.totalInterest) + '</dd></div>' +
      '</dl>' +
      '<p class="dpc-order-h">Payoff order</p><ol class="dpc-order">' + orderHtml + '</ol></div>';
  }

  function refresh() {
    var rows = el('dpcRows');
    el('dpcAdd').disabled = rows.children.length >= MAX_DEBTS;
    el('dpcCount').textContent = rows.children.length + ' of ' + MAX_DEBTS + ' debts';
    calculate();
  }

  function calculate() {
    var out = el('dpcResults');
    var read = readDebts();
    var extraRaw = el('dpcExtra').value;
    var extra = extraRaw === '' ? 0 : num(extraRaw);
    if (!(extra >= 0)) read.errors.push('Extra monthly payment must be $0 or more.');

    if (read.errors.length) {
      out.innerHTML = '<div class="calc-alert calc-alert--bad" role="alert"><ul>' + read.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
      return;
    }
    if (!read.debts.length) {
      out.innerHTML = '<p class="dpc-empty">Add at least one debt to see your payoff plan.</p>';
      return;
    }

    var debts = read.debts;
    var start = new Date(); start = new Date(start.getFullYear(), start.getMonth(), 1);
    var snow = simulate(debts, extra, 'snowball');
    var aval = simulate(debts, extra, 'avalanche');
    var html = '';

    var warn = interestWarnings(debts);
    if (warn.length) {
      html += '<div class="calc-alert calc-alert--warn" role="alert"><strong>Heads up:</strong><ul>' + warn.map(function (d) {
        return '<li>The minimum payment on <strong>' + esc(d.name) + '</strong> (' + money2.format(d.minPayment) + ') doesn&rsquo;t cover its monthly interest (about ' +
          money2.format(d.balance * d.rate / 100 / 12) + '). On its own, this debt would never be paid off.</li>';
      }).join('') + '</ul></div>';
    }

    html += '<p class="dpc-budget">Total monthly payment: <strong>' + money2.format(snow.monthlyBudget) + '</strong> (minimums' + (extra > 0 ? ' + ' + money2.format(extra) + ' extra' : '') + ')</p>';

    if (snow.paidOff && aval.paidOff) {
      var diff = snow.totalInterest - aval.totalInterest;
      var monthsDiff = snow.months - aval.months;
      var verdict;
      if (Math.abs(diff) < 1 && monthsDiff === 0) {
        verdict = 'Both methods cost about the same with these debts. Pick the one that keeps you motivated.';
      } else if (diff >= 1) {
        verdict = '<strong>Avalanche saves you ' + money2.format(diff) + '</strong> in interest' +
          (monthsDiff > 0 ? ' and gets you debt-free ' + plural(monthsDiff, 'month') + ' sooner' : '') + ' compared with snowball.';
      } else if (diff <= -1) {
        verdict = '<strong>Snowball saves you ' + money2.format(-diff) + '</strong> in interest' +
          (monthsDiff < 0 ? ' and gets you debt-free ' + plural(-monthsDiff, 'month') + ' sooner' : '') + ' compared with avalanche.';
      } else {
        verdict = 'Both methods cost about the same in interest, but ' + (monthsDiff > 0 ? 'avalanche' : 'snowball') + ' finishes ' + plural(Math.abs(monthsDiff), 'month') + ' sooner.';
      }
      html += '<div class="dpc-verdict">' + verdict + '</div>';
    }

    html += '<div class="dpc-cards">' + card(aval, 'Avalanche <small>highest interest rate first</small>', start) +
      card(snow, 'Snowball <small>smallest balance first</small>', start) + '</div>';
    out.innerHTML = html;
  }

  function init() {
    if (!el('dpcRows')) return;
    [
      { name: 'Visa', balance: 5000, rate: 19.99, minPayment: 150 },
      { name: 'Car loan', balance: 12000, rate: 7.5, minPayment: 300 },
      { name: 'Line of credit', balance: 3000, rate: 11, minPayment: 90 }
    ].forEach(addRow);
    el('dpcAdd').addEventListener('click', function () { addRow(); var last = el('dpcRows').lastElementChild; if (last) last.querySelector('input').focus(); });
    el('dpcForm').addEventListener('input', calculate);
    el('dpcForm').addEventListener('submit', function (e) { e.preventDefault(); calculate(); el('dpcResults').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el('dpcReset').addEventListener('click', function () {
      el('dpcRows').innerHTML = '';
      el('dpcExtra').value = '';
      addRow();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}(typeof window !== 'undefined' ? window : globalThis));
