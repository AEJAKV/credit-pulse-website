/* Credit Pulse — Free Budget Calculator (50/30/20 comparison)
   Plain JavaScript, no libraries. summarize() is pure so it can be tested
   outside the browser (node: require('./budget.js')). */
(function (root) {
  'use strict';

  var GUIDE = { needs: 50, wants: 30, savings: 20 };

  var DEFAULTS = {
    needs: [
      ['Rent or mortgage', 1500], ['Utilities', 150], ['Groceries', 500],
      ['Transportation', 250], ['Insurance', 120], ['Phone and internet', 130]
    ],
    wants: [['Dining out', 150], ['Entertainment', 80], ['Shopping', 150], ['Subscriptions', 40]],
    savings: [['Emergency fund', 200], ['TFSA / RRSP', 250], ['Extra debt payments', 150]]
  };

  /**
   * income: monthly take-home pay
   * groups: { needs: [amounts], wants: [amounts], savings: [amounts] }
   * Percentages are shares of take-home income (how the 50/30/20 guideline is
   * defined). "left" is unassigned money when there is a surplus.
   */
  function summarize(income, groups) {
    var sum = function (a) { return a.reduce(function (s, v) { return s + (v > 0 ? v : 0); }, 0); };
    var needs = sum(groups.needs), wants = sum(groups.wants), savings = sum(groups.savings);
    var total = needs + wants + savings;
    var surplus = income - total;
    var pct = function (v) { return income > 0 ? (v / income) * 100 : 0; };
    var p = { needs: pct(needs), wants: pct(wants), savings: pct(savings), left: surplus > 0 ? pct(surplus) : 0, total: pct(total) };
    var keys = ['needs', 'wants', 'savings', 'left'];
    var rounded = roundToTotal(keys.map(function (k) { return p[k]; }));
    var shown = {};
    keys.forEach(function (k, i) { shown[k] = rounded.values[i]; });
    shown.total = rounded.total;
    return {
      income: income, needs: needs, wants: wants, savings: savings, total: total, surplus: surplus,
      pct: p,
      shown: shown // one-decimal percentages whose rows add up exactly to shown.total
    };
  }

  /**
   * Round percentages to one decimal so the rounded rows add up exactly to the
   * rounded total (largest-remainder method): round each row down to a tenth,
   * then give the leftover tenths to the rows that lost the most in rounding.
   */
  function roundToTotal(values) {
    var tenths = values.map(function (v) { return v * 10; });
    var target = Math.round(tenths.reduce(function (s, v) { return s + v; }, 0) + 1e-9);
    var floors = tenths.map(function (v) { return Math.floor(v + 1e-9); });
    var short = target - floors.reduce(function (s, v) { return s + v; }, 0);
    tenths.map(function (v, i) { return { i: i, rem: v - floors[i] }; })
      .sort(function (a, b) { return (b.rem - a.rem) || (a.i - b.i); })
      .slice(0, Math.max(0, short))
      .forEach(function (x) { floors[x.i] += 1; });
    return { values: floors.map(function (t) { return t / 10; }), total: target / 10 };
  }

  var api = { summarize: summarize, roundToTotal: roundToTotal, GUIDE: GUIDE, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.CPBudget = api;

  /* ------------------------------------------------------------------ UI */
  if (typeof document === 'undefined') return;

  var money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var LABELS = { needs: 'Needs', wants: 'Wants', savings: 'Savings & Debt' };
  var rowSeq = 0;

  function el(id) { return document.getElementById(id); }
  function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtPct(p) { return (Math.round(p * 10) / 10).toFixed(1) + '%'; }
  // Display percentages come from r.shown (already rounded so rows add up to the total).

  function addRow(group, label, amount) {
    rowSeq++;
    var id = 'bc' + rowSeq;
    var row = document.createElement('div');
    row.className = 'calc-row bc-row';
    row.innerHTML =
      '<div class="calc-field"><label for="' + id + 'n">Expense</label>' +
        '<input type="text" id="' + id + 'n" maxlength="40" placeholder="e.g. Childcare" value="' + esc(label || '') + '"></div>' +
      '<div class="calc-field"><label for="' + id + 'a">Monthly amount ($)</label>' +
        '<input type="number" id="' + id + 'a" data-amount min="0" step="0.01" inputmode="decimal" placeholder="0" value="' + (amount != null ? amount : '') + '"></div>' +
      '<button type="button" class="calc-remove" aria-label="Remove this expense" title="Remove this expense">&times;</button>';
    row.querySelector('.calc-remove').addEventListener('click', function () { row.remove(); calculate(); });
    el('bcRows-' + group).appendChild(row);
    calculate();
    return row;
  }

  function amounts(group) {
    return Array.prototype.map.call(el('bcRows-' + group).querySelectorAll('[data-amount]'), function (i) { return num(i.value); });
  }

  function calculate() {
    var out = el('bcResults');
    if (!out) return;
    var income = num(el('bcIncome').value);
    var r = summarize(income, { needs: amounts('needs'), wants: amounts('wants'), savings: amounts('savings') });

    ['needs', 'wants', 'savings'].forEach(function (g) { el('bcSub-' + g).textContent = 'Subtotal: ' + money.format(r[g]); });

    if (!(income > 0)) {
      out.innerHTML = '<p class="dpc-empty">Enter your monthly take-home income to see your budget breakdown.</p>';
      return;
    }

    var ok = r.surplus >= 0;
    var html = '<div class="bc-summary">' +
      '<div class="bc-stat"><span>Monthly take-home income</span><strong>' + money.format(income) + '</strong></div>' +
      '<div class="bc-stat"><span>Total spending</span><strong>' + money.format(r.total) + '</strong></div>' +
      '<div class="bc-stat ' + (ok ? 'bc-stat--good' : 'bc-stat--bad') + '"><span>' + (ok ? 'Monthly surplus' : 'Monthly shortfall') + '</span><strong>' +
        (ok ? '' : '&minus;') + money.format(Math.abs(r.surplus)) + '</strong></div></div>';

    if (!ok) {
      html += '<div class="calc-alert calc-alert--bad" role="status">Your planned spending is ' + money.format(-r.surplus) +
        ' more than your take-home income each month. Look for wants you can trim, or needs you can renegotiate.</div>';
    }

    // Bar: shares of income. When spending exceeds income, scale to total spending.
    var base = Math.max(income, r.total);
    var barPx = out.clientWidth || 600;
    // Only print a label inside a segment when it fits (about 6.5px per character at this size).
    var fits = function (w, text) { return (w / 100) * barPx >= text.length * 6.5 + 12; };
    var seg = function (cls, v, text, pctOf) {
      var w = pctOf != null ? pctOf : (base > 0 ? (v / base) * 100 : 0);
      if (!(w > 0)) return '';
      var pctOnly = text.replace(/^[^0-9]+/, '');
      var label = fits(w, text) ? text : (fits(w, pctOnly) ? pctOnly : '');
      return '<span class="' + cls + '" style="width:' + w.toFixed(3) + '%" title="' + text + '">' + label + '</span>';
    };
    html += '<p class="bc-bar-label">Your split (share of take-home income)</p><div class="bc-bar" role="img" aria-label="Needs ' + fmtPct(r.shown.needs) +
      ', Wants ' + fmtPct(r.shown.wants) + ', Savings and Debt ' + fmtPct(r.shown.savings) + (r.pct.left > 0 ? ', Not yet assigned ' + fmtPct(r.shown.left) : '') + ' of income">' +
      seg('bc-seg-needs', r.needs, 'Needs ' + fmtPct(r.shown.needs)) +
      seg('bc-seg-wants', r.wants, 'Wants ' + fmtPct(r.shown.wants)) +
      seg('bc-seg-save', r.savings, 'Savings ' + fmtPct(r.shown.savings)) +
      seg('bc-seg-left', r.surplus > 0 ? r.surplus : 0, 'Left ' + fmtPct(r.shown.left)) + '</div>';
    html += '<p class="bc-bar-label">50/30/20 guideline</p><div class="bc-bar" role="img" aria-label="Guideline: Needs 50%, Wants 30%, Savings and Debt 20%">' +
      seg('bc-seg-needs', 0, 'Needs 50%', 50) + seg('bc-seg-wants', 0, 'Wants 30%', 30) + seg('bc-seg-save', 0, 'Savings 20%', 20) + '</div>';
    html += '<div class="bc-legend"><span><i class="bc-seg-needs"></i>Needs</span><span><i class="bc-seg-wants"></i>Wants</span><span><i class="bc-seg-save"></i>Savings &amp; Debt</span>' +
      (r.surplus > 0 ? '<span><i class="bc-seg-left"></i>Not yet assigned</span>' : '') + '</div>';

    var rows = ['needs', 'wants', 'savings'].map(function (g) {
      var d = r.shown[g] - GUIDE[g];
      var cls = Math.abs(d) <= 5 ? 'bc-diff-ok' : 'bc-diff-off';
      var txt = Math.abs(d) < 0.05 ? 'On target' : (d > 0 ? '+' : '&minus;') + fmtPct(Math.abs(d)).replace('%', ' pts');
      return '<tr><td>' + LABELS[g] + '</td><td>' + money.format(r[g]) + '</td><td>' + fmtPct(r.shown[g]) + '</td><td>' + GUIDE[g] + '%</td><td class="' + cls + '">' + txt + '</td></tr>';
    }).join('');
    if (r.surplus > 0) {
      rows += '<tr><td>Not yet assigned</td><td>' + money.format(r.surplus) + '</td><td>' + fmtPct(r.shown.left) + '</td><td>&mdash;</td><td>&mdash;</td></tr>';
    }
    html += '<div style="overflow-x:auto"><table class="bc-table"><thead><tr><th scope="col">Category</th><th scope="col">Amount</th><th scope="col">Your %</th><th scope="col">Guideline</th><th scope="col">Difference</th></tr></thead><tbody>' +
      rows + '</tbody><tfoot><tr><td>Total</td><td>' + money.format(r.surplus > 0 ? income : r.total) + '</td><td>' +
      fmtPct(r.shown.total) + '</td><td>100%</td><td></td></tr></tfoot></table></div>';

    out.innerHTML = html;
  }

  function loadDefaults() {
    ['needs', 'wants', 'savings'].forEach(function (g) {
      el('bcRows-' + g).innerHTML = '';
      DEFAULTS[g].forEach(function (d) { addRow(g, d[0], d[1]); });
    });
    el('bcIncome').value = 4000;
    calculate();
  }

  function init() {
    if (!el('bcForm')) return;
    loadDefaults();
    document.querySelectorAll('[data-add-group]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = addRow(b.getAttribute('data-add-group'), '', null);
        row.querySelector('input').focus();
      });
    });
    el('bcForm').addEventListener('input', calculate);
    el('bcForm').addEventListener('submit', function (e) { e.preventDefault(); calculate(); el('bcResults').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el('bcReset').addEventListener('click', loadDefaults);
    window.addEventListener('resize', calculate);
    el('bcClear').addEventListener('click', function () {
      el('bcForm').querySelectorAll('[data-amount]').forEach(function (i) { i.value = ''; });
      el('bcIncome').value = '';
      calculate();
      el('bcIncome').focus();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}(typeof window !== 'undefined' ? window : globalThis));
