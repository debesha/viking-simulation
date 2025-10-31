// Defaults from the case (mirrors the notebook)
const DEFAULTS = {
  units: 100,
  invoice_per_unit: 9500,
  contract_base_per_unit: 7000,
  cash_on_hand: 10000,
  oak_bill: 700000,
  past_due_rent: 10000,
  loan_callable_amount: 200000,
  house_market_value: 800000,
  house_mortgage: 375000,
  house_book_value: 1100000,
  viking_sale_price: 175000,
  // Approximate non-WoodCrafters per-unit costs so that:
  // base economics ≈ 160,000 sale - 7,000 payment to Sandy - 133,000 others = 20,000 margin
  viking_other_costs_per_unit: 133000,

  // negotiated defaults
  payment_per_unit: 7000,
  rent_per_month: 5000,
  loan_recalled: false,
  // uplift already reflected in sale price input
  sell_house_now: false,
  rent_relationship: 'stays',
  loan_interest_rate_percent: 10,
  loan_recovery_rate_percent: 25,
};

function simulate(i) {
  // Sandy's actual unit cost from case (oak already purchased and installed)
  const sandy_unit_cost = 8840; // 7000 lumber + 1340 labor + 500 other
  const sandy_inflow_project = i.units * i.payment_per_unit;
  const sandy_project_cost = i.units * sandy_unit_cost; // display (P&L-style)
  // Labor and other costs already paid before this period - not included in cash flow

  const loan_due_now = i.loan_recalled ? i.loan_callable_amount : 0;
  const immediate_obligations = i.oak_bill + i.past_due_rent + loan_due_now;
  const house_net = Math.max(0, i.house_market_value - i.house_mortgage);
  const house_gross = i.house_market_value;
  // Calculate net cash before house sale
  const sandy_net_before_house = i.cash_on_hand + sandy_inflow_project - immediate_obligations;
  // Force house sale if insolvent (cannot keep house when insolvent)
  const force_house_sale = sandy_net_before_house < 0;
  const house_inflow = (i.sell_house_now || force_house_sale) ? house_net : 0;
  const house_mortgage_payoff = (i.sell_house_now || force_house_sale) ? i.house_mortgage : 0;
  // Net cash after optional/forced house sale
  const sandy_net_cash = sandy_net_before_house + house_inflow;
  const shortfall = sandy_net_cash < 0 ? -sandy_net_cash : 0;
  const projectionMonths = 12;
  const sandy_interest_12m = (!i.loan_recalled && sandy_net_cash >= 0) ? (i.loan_callable_amount * (i.loan_interest_rate_percent / 100)) : 0;
  const sandy_rent_12m = (i.rent_per_month * projectionMonths);
  // Loan principal repayment: if not recalled, it's due at end of period (projected)
  const sandy_loan_principal_12m = (!i.loan_recalled && sandy_net_cash >= 0) ? i.loan_callable_amount : 0;

  const viking_base_payment_total = i.units * i.contract_base_per_unit;
  const viking_actual_payment_total = i.units * i.payment_per_unit;
  const viking_extra_cash_out = viking_actual_payment_total - viking_base_payment_total;

  const avoids_bankruptcy = sandy_net_cash >= 0;
  const viking_loan_loss_avoided = avoids_bankruptcy ? i.loan_callable_amount : 0;

  const viking_sales_revenue = i.units * i.viking_sale_price;
  const viking_other_costs_total = i.units * i.viking_other_costs_per_unit;
  const viking_payment_to_sandy = viking_actual_payment_total;
  const viking_net_cash = viking_sales_revenue - viking_payment_to_sandy - viking_other_costs_total;

  const revenue_uplift_vs_base = 0;
  const viking_delta_score = -viking_extra_cash_out - viking_other_costs_total;

  const viking_rent_receipts_12m = (i.rent_relationship === 'stays' && avoids_bankruptcy) ? (i.rent_per_month * projectionMonths) : 0;
  const viking_repaid_rent_debt = avoids_bankruptcy ? i.past_due_rent : 0;
  const viking_interest_12m = (!i.loan_recalled && avoids_bankruptcy) ? (i.loan_callable_amount * (i.loan_interest_rate_percent / 100)) : 0;
  const viking_loan_principal_repaid_now = avoids_bankruptcy
    ? (i.loan_recalled ? i.loan_callable_amount : 0)
    : (i.loan_callable_amount * (i.loan_recovery_rate_percent / 100));

  // Balance sheet (period end)
  const bs_cash = sandy_net_cash; // using end balance as period-end cash
  // House: book value if not sold (per requirement), else zero
  const bs_house = (house_inflow > 0) ? 0 : i.house_book_value;
  // Loan payable: outstanding if not recalled and Sandy remains solvent; else zero
  const bs_loan_payable = i.loan_recalled ? 0 : (sandy_net_cash >= 0 ? i.loan_callable_amount : 0);
  // Interest payable: accrue 12-month interest when loan not recalled and Sandy solvent
  const bs_interest_payable = (!i.loan_recalled && sandy_net_cash >= 0) ? (i.loan_callable_amount * (i.loan_interest_rate_percent / 100)) : 0;
  // Rent payable: accrue 12-month rent if Sandy solvent (projection horizon = 12)
  const bs_rent_payable = (sandy_net_cash >= 0) ? (i.rent_per_month * projectionMonths) : 0;
  const bs_equity = bs_cash + bs_house - bs_loan_payable - bs_interest_payable - bs_rent_payable;

  return {
    payment_per_unit: i.payment_per_unit,
    rent_per_month: i.rent_per_month,
    loan_recalled: i.loan_recalled,
    // oak always applied
    // uplift toggle removed
    sell_house_now: i.sell_house_now,
    house_sold: house_inflow > 0,
    house_sale_forced: force_house_sale,
    house_book_value: i.house_book_value,

    sandy_inflow_project,
    sandy_project_cost,
    sandy_oak_bill: i.oak_bill,
    sandy_rent_debt: i.past_due_rent,
    sandy_loan_repayment_now: loan_due_now,
    sandy_house_gross: (i.sell_house_now || force_house_sale) ? house_gross : 0,
    sandy_house_mortgage: house_mortgage_payoff,
    sandy_house_proceeds: house_inflow,
    sandy_start_balance: i.cash_on_hand,
    sandy_end_balance: sandy_net_cash,
    sandy_shortfall_if_any: shortfall,
    sandy_rent_12m,
    sandy_interest_12m,
    sandy_loan_principal_12m,

    viking_extra_cash_out_vs_base: viking_extra_cash_out,
    viking_loan_loss_avoided,
    viking_revenue_uplift_vs_base: revenue_uplift_vs_base,
    viking_delta_score,
    viking_sales_revenue,
    viking_payment_to_sandy,
    viking_other_costs_total,
    viking_start_balance: 0,
    viking_end_balance: viking_net_cash + viking_rent_receipts_12m + viking_repaid_rent_debt + viking_interest_12m + viking_loan_principal_repaid_now,
    viking_rent_receipts_12m,
    viking_repaid_rent_debt,
    viking_loan_principal_repaid_now,
    viking_interest_12m,
    viking_total_benefit: viking_net_cash + viking_rent_receipts_12m + viking_repaid_rent_debt + viking_interest_12m + viking_loan_principal_repaid_now,
    sandy_solvent: sandy_net_cash >= 0,
    projection_horizon: projectionMonths,
    // Balance sheet outputs
    sandy_bs_cash: bs_cash,
    sandy_bs_house_book: bs_house,
    sandy_bs_loan_payable: bs_loan_payable,
    sandy_bs_interest_payable: bs_interest_payable,
    sandy_bs_rent_payable: bs_rent_payable,
    sandy_bs_equity: bs_equity,
    viking_bs_cash: viking_net_cash + viking_rent_receipts_12m + viking_repaid_rent_debt + viking_interest_12m + viking_loan_principal_repaid_now,
    viking_bs_loan_receivable: (!i.loan_recalled && avoids_bankruptcy) ? i.loan_callable_amount : 0,
    viking_bs_rent_receivable: (i.rent_relationship === 'stays' && avoids_bankruptcy) ? (i.rent_per_month * projectionMonths) : 0,
    viking_bs_liabilities: 0,
    viking_bs_equity: (viking_net_cash + viking_rent_receipts_12m + viking_repaid_rent_debt + viking_interest_12m + viking_loan_principal_repaid_now)
      + ((!i.loan_recalled && avoids_bankruptcy) ? i.loan_callable_amount : 0)
      + ((i.rent_relationship === 'stays' && avoids_bankruptcy) ? (i.rent_per_month * projectionMonths) : 0),
  };
}

function formatCurrency(n) {
  const isNegative = n < 0;
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return isNegative ? `(${formatted})` : formatted;
}

function getInputsFromDOM() {
  return {
    payment_per_unit: Number(document.getElementById('payment_per_unit').value),
    rent_per_month: Number(document.getElementById('rent_per_month').value),
    loan_recalled: document.getElementById('loan_recalled').checked,
    // oak always applied; no DOM read
    // uplift toggle removed
    sell_house_now: document.getElementById('sell_house_now').checked,
    rent_relationship: (document.querySelector('input[name="rent_relationship"]:checked') || {}).value,

    units: Number(document.getElementById('units').value),
    contract_base_per_unit: Number(document.getElementById('contract_base_per_unit').value),
    invoice_per_unit: Number(document.getElementById('invoice_per_unit').value),
    cash_on_hand: Number(document.getElementById('cash_on_hand').value),
    oak_bill: Number(document.getElementById('oak_bill').value),
    past_due_rent: Number(document.getElementById('past_due_rent').value),
    loan_callable_amount: Number(document.getElementById('loan_callable_amount').value),
    loan_interest_rate_percent: Number(document.getElementById('loan_interest_rate_percent').value),
    loan_recovery_rate_percent: Number(document.getElementById('loan_recovery_rate_percent').value),
    house_market_value: Number(document.getElementById('house_market_value').value),
    house_book_value: Number(document.getElementById('house_book_value').value),
    house_mortgage: Number(document.getElementById('house_mortgage').value),
    viking_sale_price: Number(document.getElementById('viking_sale_price').value),
    viking_other_costs_per_unit: Number(document.getElementById('viking_other_costs_per_unit').value),
  };
}

function setDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = Boolean(value);
    } else {
      el.value = String(value);
    }
  }
}

function render(results) {
  const ids = [
    'sandy_inflow_project',
    'sandy_oak_bill',
    'sandy_rent_debt',
    'sandy_loan_repayment_now',
    'sandy_house_gross',
    'sandy_house_mortgage',
    'sandy_house_proceeds',
    'sandy_rent_12m',
    'sandy_interest_12m',
    'sandy_loan_principal_12m',
    'sandy_start_balance',
    'sandy_end_balance',
    'sandy_shortfall_if_any',
    'projection_horizon',
    'sandy_bs_cash',
    'sandy_bs_house_book',
    'sandy_bs_loan_payable',
    'sandy_bs_interest_payable',
    'sandy_bs_rent_payable',
    'sandy_bs_equity',
    'viking_sales_revenue',
    'viking_rent_receipts_12m',
    'viking_loan_principal_repaid_now',
    'viking_repaid_rent_debt',
    'viking_interest_12m',
    'viking_payment_to_sandy',
    'viking_other_costs_total',
    'viking_start_balance',
    'viking_end_balance',
    'viking_total_benefit',
    'viking_bs_cash',
    'viking_bs_loan_receivable',
    'viking_bs_rent_receivable',
    'viking_bs_liabilities',
    'viking_bs_equity',
  ];
  ids.forEach(id => {
    const v = results[id];
    const el = document.getElementById(id);
    if (!el) return;
    const alwaysShow = new Set([
      'sandy_start_balance',
      'sandy_end_balance',
      'projection_horizon',
      'projection_horizon_viking',
      'viking_start_balance',
      'viking_end_balance',
      'viking_bs_loan_receivable',
      'viking_bs_rent_receivable',
      'viking_bs_cash',
      'viking_bs_liabilities',
      'viking_bs_equity'
    ]);
    const outflowIds = new Set([
      'sandy_oak_bill',
      'sandy_rent_debt',
      'sandy_loan_repayment_now',
      'sandy_rent_12m',
      'sandy_interest_12m',
      'sandy_loan_principal_12m',
      'viking_payment_to_sandy',
      'viking_other_costs_total',
      'sandy_bs_loan_payable',
      'sandy_bs_interest_payable',
      'sandy_bs_rent_payable',
    ]);
    if (id === 'sandy_house_gross') {
      // amount cell
      el.textContent = formatCurrency(v);
      // row visibility and label emoji
      const row = el.parentElement;
      if (row && row.tagName === 'TR') {
        row.style.display = (results.house_sold && v > 0) ? '' : 'none';
        const labelCell = row.querySelector('th');
        if (labelCell) {
          labelCell.textContent = results.house_sold && v > 0 ? 'House sale proceeds (gross) 😢🏠👨‍👩‍👧‍👦' : 'House sale proceeds (gross)';
        }
      }
    } else if (id === 'sandy_house_proceeds') {
      // net inflow row (optional if you want to keep)
      el.textContent = formatCurrency(v);
      const row = el.parentElement;
      if (row && row.tagName === 'TR') {
        row.style.display = (results.house_sold && v > 0) ? '' : 'none';
      }
    } else if (id === 'sandy_bs_cash') {
      el.textContent = formatCurrency(results.sandy_end_balance);
    } else if (id === 'sandy_bs_house_book') {
      const row = el.parentElement;
      const value = results.house_sold ? 0 : results.house_book_value;
      el.textContent = formatCurrency(value);
      if (row && row.tagName === 'TR') row.style.display = (value === 0 ? 'none' : '');
    } else {
      const displayValue = outflowIds.has(id) ? -v : v;
      el.textContent = formatCurrency(displayValue);
      const row = el.parentElement;
      if (row && row.tagName === 'TR' && !alwaysShow.has(id)) {
        row.style.display = (Number(v) === 0 ? 'none' : '');
      }
    }
  });

  const sandyCard = document.getElementById('sandy_card');
  if (sandyCard) {
    sandyCard.classList.remove('solvent', 'insolvent', 'sold-house');
    if (results.house_sold && results.sandy_solvent) {
      sandyCard.classList.add('sold-house');
    } else {
      sandyCard.classList.add(results.sandy_solvent ? 'solvent' : 'insolvent');
    }
  }

  // Reflect enforced house sale in the input checkbox UI
  const sellHouseEl = document.getElementById('sell_house_now');
  if (sellHouseEl) {
    if (results.house_sale_forced) {
      sellHouseEl.checked = true;
      sellHouseEl.disabled = true;
    } else {
      sellHouseEl.disabled = false;
      // do not override user's current checked state when not forced
    }
  }
}

function recalc() {
  const inputs = getInputsFromDOM();
  const results = simulate(inputs);
  render(results);
}

function attachListeners() {
  const all = Array.from(document.querySelectorAll('input'));
  all.forEach(el => {
    const evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, recalc);
  });

  // Scenarios from JSON
  initScenarios();

  const copyBtn = document.getElementById('copy_scenario_btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      // Only negotiated, user-facing inputs
      const paymentPerUnit = Number(document.getElementById('payment_per_unit').value);
      const rentPerMonth = Number(document.getElementById('rent_per_month').value);
      const interestRate = Number(document.getElementById('loan_interest_rate_percent').value);
      // Auto-generate label: "$yyyy per unit, $xxxx rent, x% interest"
      const label = `$${paymentPerUnit.toLocaleString()} per unit, $${rentPerMonth.toLocaleString()} rent, ${interestRate}% interest`;
      const scenario = {
        id: "your_id_here",
        label: label,
        values: {
          payment_per_unit: paymentPerUnit,
          rent_per_month: rentPerMonth,
          loan_recalled: document.getElementById('loan_recalled').checked,
          sell_house_now: document.getElementById('sell_house_now').checked,
          loan_interest_rate_percent: interestRate,
          rent_relationship: (document.querySelector('input[name="rent_relationship"]:checked') || {}).value,
          viking_sale_price: Number(document.getElementById('viking_sale_price').value),
          viking_other_costs_per_unit: Number(document.getElementById('viking_other_costs_per_unit').value),
        },
      };
      const text = JSON.stringify(scenario, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied');
      }
    });
  }

  // Tabs (scope to each card independently)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      const card = btn.closest('.card');
      if (!card) return;
      // deactivate only within this card
      card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      card.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = card.querySelector(`#${CSS.escape(target)}`) || card.querySelector(`[data-tab-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // Run equity test across scenarios.json
  const runBtn = document.getElementById('run_test_btn');
  if (runBtn) {
    runBtn.addEventListener('click', runEquityTest);
  }
}

async function runEquityTest() {
  try {
    const res = await fetch('./scenarios.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load scenarios.json');
    const scenarios = await res.json();
    const rows = scenarios.map(s => {
      const i = { ...DEFAULTS, ...(s.values || {}) };
      const r = simulate(i);
      return {
        id: s.id,
        label: s.label,
        solvent: r.sandy_solvent,
        house_sold: r.house_sold,
        end_balance: r.sandy_end_balance,
        equity: r.sandy_bs_equity,
        viking_end_balance: r.viking_end_balance,
        viking_equity: r.viking_bs_equity,
        total_equity: (r.sandy_bs_equity || 0) + (r.viking_bs_equity || 0),
      };
    });
    // find maximums for highlighting
    const maxSandyEq = Math.max(...rows.map(r => r.equity || 0));
    const maxVikingEq = Math.max(...rows.map(r => r.viking_equity || 0));
    const maxTotalEq = Math.max(...rows.map(r => r.total_equity || 0));
    renderTestResults(rows, { maxSandyEq, maxVikingEq, maxTotalEq });
    console.table(rows);
    showToast('Equity test run');
  } catch (e) {
    showToast('Failed to run test');
  }
}

function renderTestResults(rows, opts = {}) {
  const { maxSandyEq = -Infinity, maxVikingEq = -Infinity, maxTotalEq = -Infinity } = opts;
  let card = document.getElementById('equity_test_card');
  if (!card) {
    card = document.createElement('div');
    card.id = 'equity_test_card';
    card.className = 'card test-results';
    // place the card AFTER the entire results grid so it doesn't affect grid layout
    const resultsSection = document.querySelector('section.grid.results');
    if (resultsSection && resultsSection.parentElement) {
      resultsSection.parentElement.insertBefore(card, resultsSection.nextSibling);
    } else {
      const container = document.querySelector('.container');
      container.appendChild(card);
    }
  }
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const header = document.createElement('tr');
  header.innerHTML = '<th>Scenario</th><th class="center">Solvent</th><th class="center">House sold</th><th class="num">Sandy End Balance</th><th class="num">Sandy Equity</th><th class="num">Viking End Balance</th><th class="num">Viking Equity</th><th class="num">Total Equity</th>';
  tbody.appendChild(header);
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const sandyEqCls = r.equity === maxSandyEq ? 'highlight' : '';
    const vikingEqCls = r.viking_equity === maxVikingEq ? 'highlight' : '';
    const totalEqCls = r.total_equity === maxTotalEq ? 'highlight' : '';
    tr.innerHTML = `<th>${r.label || r.id}</th>`+
      `<td class="center">${r.solvent ? 'Yes' : 'No'}</td>`+
      `<td class="center">${r.house_sold ? 'Yes' : 'No'}</td>`+
      `<td class="num">${formatCurrency(r.end_balance)}</td>`+
      `<td class="num ${sandyEqCls}">${formatCurrency(r.equity)}</td>`+
      `<td class="num">${formatCurrency(r.viking_end_balance || 0)}</td>`+
      `<td class="num ${vikingEqCls}">${formatCurrency(r.viking_equity || 0)}</td>`+
      `<td class="num ${totalEqCls}">${formatCurrency(r.total_equity || 0)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.innerHTML = '<h2>Equity test (period end)</h2>';
  card.appendChild(table);
}

function showToast(message) {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'toast-message';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, 2000);
}

async function initScenarios() {
  const select = document.getElementById('scenario_select');
  if (!select) return;

  function populateOptions(scenarios) {
    scenarios.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const id = select.value;
      const scenario = scenarios.find(s => s.id === id);
      if (!scenario) return;
      const values = scenario.values || {};
      Object.entries(values).forEach(([key, val]) => {
        const el = document.getElementById(String(key));
        if (!el) return;
        if (typeof val === 'boolean' && el.type === 'checkbox') {
          el.checked = val;
        } else if (el.tagName === 'SELECT') {
          el.value = String(val);
        } else if (el.type === 'radio') {
          // handled below
        } else {
          el.value = String(val);
        }
      });
      // handle radios for rent_relationship
      if (values.rent_relationship) {
        const radio = document.querySelector(`input[name="rent_relationship"][value="${values.rent_relationship}"]`);
        if (radio) radio.checked = true;
      }
      recalc();
      // keep the selected label visible in the dropdown
    });
  }

  try {
    const res = await fetch('./scenarios.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load scenarios.json');
    const scenarios = await res.json();
    populateOptions(scenarios);
  } catch (e) {
    // If fetch fails (e.g., opened via file://), leave dropdown empty
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setDefaults();
  attachListeners();
  recalc();
});

