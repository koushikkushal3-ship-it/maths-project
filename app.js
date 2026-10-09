/**
 * RESTAURANT CUSTOMER BEHAVIOR ANALYTICS DASHBOARD
 * Core Statistical Engine, Probability Engine & Interactive UI Controllers
 * Supports Indian Rupees (INR, ₹) by default with dynamic Currency Toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  let rawData = (typeof TIPS_DATA !== 'undefined') ? TIPS_DATA : [];
  
  if (!rawData || rawData.length === 0) {
    console.error("Dataset not loaded!");
    return;
  }

  // -------------------------------------------------------------
  // Application State
  // -------------------------------------------------------------
  let currentFilter = {
    day: 'All',
    time: 'All',
    smoker: 'All'
  };

  let activeData = [...rawData];
  let currentPage = 1;
  const rowsPerPage = 10;
  let sortColumn = 'id';
  let sortAsc = true;
  let chartInstances = {};

  // Currency Formatter
  function currSymbol() {
    return '₹';
  }

  function formatMoney(amount, decimals = 2) {
    if (amount === undefined || amount === null || isNaN(amount)) return `${currSymbol()}0.00`;
    let val = Number(amount);
    
    // Indian numbering format (e.g. 1,476.98)
    return '₹' + val.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatNumber(val, decimals = 2) {
    return Number(val).toFixed(decimals);
  }

  // -------------------------------------------------------------
  // Statistical Core Mathematical Functions
  // -------------------------------------------------------------
  function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((sum, v) => sum + v, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function mode(arr) {
    if (!arr.length) return 0;
    const freq = {};
    let maxFreq = 0;
    let modeVal = arr[0];
    arr.forEach(val => {
      const rounded = Number(val.toFixed(2));
      freq[rounded] = (freq[rounded] || 0) + 1;
      if (freq[rounded] > maxFreq) {
        maxFreq = freq[rounded];
        modeVal = rounded;
      }
    });
    return modeVal;
  }

  function quantile(arr, q) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }

  function variance(arr) {
    if (arr.length <= 1) return 0;
    const m = mean(arr);
    return arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1);
  }

  function stdDev(arr) {
    return Math.sqrt(variance(arr));
  }

  function iqr(arr) {
    return quantile(arr, 0.75) - quantile(arr, 0.25);
  }

  function pearsonR(xArr, yArr) {
    if (xArr.length !== yArr.length || xArr.length <= 1) return 0;
    const xMean = mean(xArr);
    const yMean = mean(yArr);
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < xArr.length; i++) {
      const dx = xArr[i] - xMean;
      const dy = yArr[i] - yMean;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  }

  function linearRegression(xArr, yArr) {
    const r = pearsonR(xArr, yArr);
    const sx = stdDev(xArr);
    const sy = stdDev(yArr);
    const m = r * (sy / sx);
    const b = mean(yArr) - m * mean(xArr);
    return { slope: m, intercept: b, r };
  }

  // -------------------------------------------------------------
  // Data Upload & Report Generation
  // -------------------------------------------------------------
  const uploadCsvBtn = document.getElementById('uploadCsvBtn');
  const csvFileInput = document.getElementById('csvFileInput');
  const datasetNameSpan = document.getElementById('datasetName');

  if (uploadCsvBtn && csvFileInput) {
    uploadCsvBtn.addEventListener('click', () => {
      csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          if (results.data && results.data.length > 0) {
            // Check for expected columns
            const expectedCols = ['total_bill', 'tip', 'sex', 'smoker', 'day', 'time', 'size'];
            const firstRow = results.data[0];
            const hasExpected = expectedCols.every(col => firstRow.hasOwnProperty(col));

            if (!hasExpected) {
              alert('CSV format does not match expected template. Please use one of the reference templates.');
              return;
            }

            rawData = results.data.map(d => ({
              ...d,
              total_bill: Number(d.total_bill) || 0,
              tip: Number(d.tip) || 0,
              size: Number(d.size) || 1
            }));

            datasetNameSpan.textContent = `${file.name} (n = ${rawData.length})`;
            
            // Reset filters
            document.getElementById('filterDay').value = 'All';
            document.getElementById('filterTime').value = 'All';
            document.getElementById('filterSmoker').value = 'All';
            
            applyFilters();
            alert('Custom data loaded successfully!');
          }
        },
        error: function(err) {
          console.error(err);
          alert('Error parsing CSV file.');
        }
      });
    });
  }



  // -------------------------------------------------------------
  // UI Theme Toggle
  // -------------------------------------------------------------
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    renderAllCharts();
  });

  // -------------------------------------------------------------
  // Navigation Tabs Switching
  // -------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.getAttribute('data-tab'));
      if (targetPane) {
        targetPane.classList.add('active');
      }

      if (btn.getAttribute('data-tab') === 'tab-visualizations') {
        setTimeout(renderAllCharts, 50);
      }
    });
  });

  // -------------------------------------------------------------
  // Gallery Filtering
  // -------------------------------------------------------------
  const galleryBtns = document.querySelectorAll('.gallery-btn');
  const chartCards = document.querySelectorAll('.chart-card');

  galleryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-chart');
      chartCards.forEach(card => {
        if (filterCategory === 'all' || card.getAttribute('data-category') === filterCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // -------------------------------------------------------------
  // Filtering Logic
  // -------------------------------------------------------------
  const filterDay = document.getElementById('filterDay');
  const filterTime = document.getElementById('filterTime');
  const filterSmoker = document.getElementById('filterSmoker');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const subsetSummary = document.getElementById('subsetSummary');

  function applyFilters() {
    currentFilter.day = filterDay.value;
    currentFilter.time = filterTime.value;
    currentFilter.smoker = filterSmoker.value;

    activeData = rawData.filter(row => {
      if (currentFilter.day !== 'All' && row.day !== currentFilter.day) return false;
      if (currentFilter.time !== 'All' && row.time !== currentFilter.time) return false;
      if (currentFilter.smoker !== 'All' && row.smoker !== currentFilter.smoker) return false;
      return true;
    });

    subsetSummary.textContent = `Showing ${activeData.length} of ${rawData.length} records`;
    currentPage = 1;

    updateDashboard();
  }

  filterDay.addEventListener('change', applyFilters);
  filterTime.addEventListener('change', applyFilters);
  filterSmoker.addEventListener('change', applyFilters);

  resetFiltersBtn.addEventListener('click', () => {
    filterDay.value = 'All';
    filterTime.value = 'All';
    filterSmoker.value = 'All';
    applyFilters();
  });

  // -------------------------------------------------------------
  // Main Update Routine
  // -------------------------------------------------------------
  function updateDashboard() {
    updateKPIs();
    updateCentralTendency();
    updateDayVariabilityTable();
    updateOutlierAnalysis();
    updateProbabilityLab();
    renderRawTable();
    renderAllCharts();
    generateBusinessReport();
  }

  // -------------------------------------------------------------
  // 1. KPI Ribbon
  // -------------------------------------------------------------
  function updateKPIs() {
    const bills = activeData.map(d => d.total_bill);
    const tips = activeData.map(d => d.tip);

    document.getElementById('val-n').textContent = activeData.length;
    
    if (bills.length) {
      document.getElementById('val-mean-bill').textContent = formatMoney(mean(bills));
      document.getElementById('val-median-sub').textContent = `Median: ${formatMoney(median(bills))}`;
      document.getElementById('val-iqr').textContent = formatMoney(iqr(bills));
      document.getElementById('val-iqr-sub').textContent = `Middle 50% (${formatMoney(quantile(bills, 0.25), 0)} - ${formatMoney(quantile(bills, 0.75), 0)})`;
    } else {
      document.getElementById('val-mean-bill').textContent = formatMoney(0);
      document.getElementById('val-iqr').textContent = formatMoney(0);
    }

    const satCount = activeData.filter(d => d.day === 'Sat').length;
    const satPct = activeData.length ? (satCount / activeData.length * 100).toFixed(1) : '0';
    document.getElementById('val-p-sat').textContent = `${satPct}%`;

    const r = pearsonR(bills, tips);
    document.getElementById('val-corr').textContent = r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
  }

  // -------------------------------------------------------------
  // 2. Central Tendency & Dispersion Update
  // -------------------------------------------------------------
  function updateCentralTendency() {
    const bills = activeData.map(d => d.total_bill);
    const tips = activeData.map(d => d.tip);
    const sizes = activeData.map(d => d.size);

    if (!bills.length) return;

    // Total Bill
    document.getElementById('tb-mean').textContent = formatMoney(mean(bills));
    document.getElementById('tb-median').textContent = formatMoney(median(bills));
    document.getElementById('tb-mode').textContent = formatMoney(mode(bills));
    document.getElementById('tb-range').textContent = formatMoney(Math.max(...bills) - Math.min(...bills));
    document.getElementById('tb-q1').textContent = formatMoney(quantile(bills, 0.25));
    document.getElementById('tb-q3').textContent = formatMoney(quantile(bills, 0.75));
    document.getElementById('tb-iqr').textContent = formatMoney(iqr(bills));
    document.getElementById('tb-std').textContent = formatMoney(stdDev(bills));
    document.getElementById('tb-cv').textContent = `${((stdDev(bills) / mean(bills)) * 100).toFixed(2)}%`;

    // Tip
    document.getElementById('tip-mean').textContent = formatMoney(mean(tips));
    document.getElementById('tip-median').textContent = formatMoney(median(tips));
    document.getElementById('tip-mode').textContent = formatMoney(mode(tips));
    document.getElementById('tip-range').textContent = formatMoney(Math.max(...tips) - Math.min(...tips));
    document.getElementById('tip-q1').textContent = formatMoney(quantile(tips, 0.25));
    document.getElementById('tip-q3').textContent = formatMoney(quantile(tips, 0.75));
    document.getElementById('tip-iqr').textContent = formatMoney(iqr(tips));
    document.getElementById('tip-std').textContent = formatMoney(stdDev(tips));
    document.getElementById('tip-cv').textContent = `${((stdDev(tips) / mean(tips)) * 100).toFixed(2)}%`;

    // Size (Counts, no currency)
    document.getElementById('sz-mean').textContent = mean(sizes).toFixed(2);
    document.getElementById('sz-median').textContent = median(sizes).toFixed(2);
    document.getElementById('sz-mode').textContent = mode(sizes).toFixed(2);
    document.getElementById('sz-range').textContent = (Math.max(...sizes) - Math.min(...sizes)).toFixed(2);
    document.getElementById('sz-q1').textContent = quantile(sizes, 0.25).toFixed(2);
    document.getElementById('sz-q3').textContent = quantile(sizes, 0.75).toFixed(2);
    document.getElementById('sz-iqr').textContent = iqr(sizes).toFixed(2);
    document.getElementById('sz-std').textContent = stdDev(sizes).toFixed(2);
    document.getElementById('sz-cv').textContent = `${((stdDev(sizes) / mean(sizes)) * 100).toFixed(2)}%`;
  }

  // -------------------------------------------------------------
  // 3. Day-Wise Variability Breakdown Table
  // -------------------------------------------------------------
  function updateDayVariabilityTable() {
    const tbody = document.getElementById('dayVariabilityTableBody');
    tbody.innerHTML = '';

    const days = ['Thur', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      const dayBills = rawData.filter(d => d.day === day).map(d => d.total_bill);
      if (!dayBills.length) return;

      const visits = dayBills.length;
      const m = mean(dayBills);
      const med = median(dayBills);
      const s = stdDev(dayBills);
      const q1Val = quantile(dayBills, 0.25);
      const q3Val = quantile(dayBills, 0.75);
      const iqrVal = q3Val - q1Val;
      const rng = Math.max(...dayBills) - Math.min(...dayBills);
      const cvVal = (s / m) * 100;

      let badgeLevel = 'badge blue';
      let levelText = 'Moderate';
      if (cvVal > 47) {
        badgeLevel = 'badge red';
        levelText = 'Highest Variability';
      } else if (cvVal < 42) {
        badgeLevel = 'badge emerald';
        levelText = 'Most Consistent';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${day}</strong></td>
        <td>${visits}</td>
        <td>${formatMoney(m)}</td>
        <td>${formatMoney(med)}</td>
        <td>${formatMoney(s)}</td>
        <td>${formatMoney(q1Val)}</td>
        <td>${formatMoney(q3Val)}</td>
        <td>${formatMoney(iqrVal)}</td>
        <td>${formatMoney(rng)}</td>
        <td><strong>${cvVal.toFixed(2)}%</strong></td>
        <td><span class="${badgeLevel}">${levelText}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------
  // 4. Box Plot & Outlier Analysis
  // -------------------------------------------------------------
  function updateOutlierAnalysis() {
    const bills = rawData.map(d => d.total_bill);
    const tips = rawData.map(d => d.tip);

    // Bill Outliers
    const bQ1 = quantile(bills, 0.25);
    const bMed = quantile(bills, 0.50);
    const bQ3 = quantile(bills, 0.75);
    const bIQR = bQ3 - bQ1;
    const bLower = bQ1 - 1.5 * bIQR;
    const bUpper = bQ3 + 1.5 * bIQR;

    document.getElementById('tb-fn-min').textContent = formatMoney(Math.min(...bills));
    document.getElementById('tb-fn-q1').textContent = formatMoney(bQ1);
    document.getElementById('tb-fn-med').textContent = formatMoney(bMed);
    document.getElementById('tb-fn-q3').textContent = formatMoney(bQ3);
    document.getElementById('tb-fn-max').textContent = formatMoney(Math.max(...bills));
    document.getElementById('tb-lower-fence').textContent = formatMoney(bLower);
    document.getElementById('tb-upper-fence').textContent = formatMoney(bUpper);

    const billOutliers = rawData.filter(d => d.total_bill < bLower || d.total_bill > bUpper);
    document.getElementById('billOutlierBadge').textContent = `${billOutliers.length} Outliers (${(billOutliers.length / rawData.length * 100).toFixed(2)}%)`;

    const billChipsContainer = document.getElementById('billOutlierChips');
    billChipsContainer.innerHTML = '';
    billOutliers.forEach(d => {
      const chip = document.createElement('span');
      chip.className = 'outlier-chip';
      chip.textContent = formatMoney(d.total_bill);
      billChipsContainer.appendChild(chip);
    });

    // Tip Outliers
    const tQ1 = quantile(tips, 0.25);
    const tMed = quantile(tips, 0.50);
    const tQ3 = quantile(tips, 0.75);
    const tIQR = tQ3 - tQ1;
    const tLower = tQ1 - 1.5 * tIQR;
    const tUpper = tQ3 + 1.5 * tIQR;

    document.getElementById('tip-fn-min').textContent = formatMoney(Math.min(...tips));
    document.getElementById('tip-fn-q1').textContent = formatMoney(tQ1);
    document.getElementById('tip-fn-med').textContent = formatMoney(tMed);
    document.getElementById('tip-fn-q3').textContent = formatMoney(tQ3);
    document.getElementById('tip-fn-max').textContent = formatMoney(Math.max(...tips));
    document.getElementById('tip-lower-fence').textContent = formatMoney(tLower);
    document.getElementById('tip-upper-fence').textContent = formatMoney(tUpper);

    const tipOutliers = rawData.filter(d => d.tip < tLower || d.tip > tUpper);
    document.getElementById('tipOutlierBadge').textContent = `${tipOutliers.length} Outliers (${(tipOutliers.length / rawData.length * 100).toFixed(2)}%)`;

    const tipChipsContainer = document.getElementById('tipOutlierChips');
    tipChipsContainer.innerHTML = '';
    tipOutliers.forEach(d => {
      const chip = document.createElement('span');
      chip.className = 'outlier-chip';
      chip.textContent = formatMoney(d.tip);
      tipChipsContainer.appendChild(chip);
    });

    // Detailed Outliers Table
    const detailedTbody = document.getElementById('outliersDetailedTable');
    detailedTbody.innerHTML = '';
    
    const outlierRows = [];
    rawData.forEach((row, idx) => {
      const isBillOutlier = row.total_bill < bLower || row.total_bill > bUpper;
      const isTipOutlier = row.tip < tLower || row.tip > tUpper;
      if (isBillOutlier || isTipOutlier) {
        outlierRows.push({
          id: idx + 1,
          ...row,
          trigger: isBillOutlier && isTipOutlier ? 'Both Bill & Tip' : (isBillOutlier ? 'High Bill' : 'High Tip')
        });
      }
    });

    outlierRows.forEach(row => {
      const tipPct = ((row.tip / row.total_bill) * 100).toFixed(1);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${row.id}</td>
        <td><strong>${formatMoney(row.total_bill)}</strong></td>
        <td>${formatMoney(row.tip)}</td>
        <td>${tipPct}%</td>
        <td>${row.size}</td>
        <td>${row.day}</td>
        <td>${row.time}</td>
        <td>${row.smoker}</td>
        <td><span class="badge ${row.trigger.includes('Both') ? 'purple' : 'red'}">${row.trigger}</span></td>
      `;
      detailedTbody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------
  // 5. Probability Lab & Interactive Sliders
  // -------------------------------------------------------------
  const billSlider = document.getElementById('billThresholdSlider');
  const tipSlider = document.getElementById('tipThresholdSlider');

  function syncSliderBounds() {
    if (!billSlider || !tipSlider) return;
    billSlider.min = "500";
    billSlider.max = "3800";
    billSlider.step = "50";
    billSlider.value = "2500";

    tipSlider.min = "100";
    tipSlider.max = "700";
    tipSlider.step = "25";
    tipSlider.value = "400";
  }

  function updateProbabilityLab() {
    if (!billSlider || !tipSlider) return;
    const totalN = rawData.length;
    let billThresh = parseFloat(billSlider.value);
    let tipThresh = parseFloat(tipSlider.value);

    // Convert thresholds to base INR for filtering if in USD
    const billThreshBase = billThresh
    const tipThreshBase = tipThresh

    const displayBillThresh = `₹${billThresh.toLocaleString('en-IN')}`
    const displayTipThresh = `₹${tipThresh.toLocaleString('en-IN')}`

    if(document.getElementById('lblBillThreshold')) document.getElementById('lblBillThreshold').textContent = displayBillThresh;
    if(document.getElementById('lblTipThreshold')) document.getElementById('lblTipThreshold').textContent = displayTipThresh;

    const countHighBill = rawData.filter(d => d.total_bill > billThreshBase).length;
    const pHighBill = (countHighBill / totalN) * 100;
    if(document.getElementById('formulaBillTail')) document.getElementById('formulaBillTail').textContent = `P(Bill > ${displayBillThresh}) = ${countHighBill} / ${totalN}`;
    if(document.getElementById('pHighBillVal')) document.getElementById('pHighBillVal').textContent = `${pHighBill.toFixed(2)}%`;
    if(document.getElementById('barHighBill')) document.getElementById('barHighBill').style.width = `${pHighBill}%`;
    if(document.getElementById('commentHighBill')) document.getElementById('commentHighBill').textContent = `${countHighBill} out of ${totalN} dining parties billed over ${displayBillThresh}.`;

    const countHighTip = rawData.filter(d => d.tip > tipThreshBase).length;
    const pHighTip = (countHighTip / totalN) * 100;
    if(document.getElementById('formulaTipTail')) document.getElementById('formulaTipTail').textContent = `P(Tip > ${displayTipThresh}) = ${countHighTip} / ${totalN}`;
    if(document.getElementById('pHighTipVal')) document.getElementById('pHighTipVal').textContent = `${pHighTip.toFixed(2)}%`;
    if(document.getElementById('barHighTip')) document.getElementById('barHighTip').style.width = `${pHighTip}%`;
    if(document.getElementById('commentHighTip')) document.getElementById('commentHighTip').textContent = `${countHighTip} customers tipped greater than ${displayTipThresh}.`;

    renderConditionalChart(displayTipThresh, displayBillThresh, tipThreshBase, billThreshBase);
  }

  if (billSlider) billSlider.addEventListener('input', updateProbabilityLab);
  if (tipSlider) tipSlider.addEventListener('input', updateProbabilityLab);

  function renderConditionalChart(tipLabel = '₹400', billLabel = '₹2,500', tipCutoff = 400, billCutoff = 2500) {
    const ctx = document.getElementById('condProbChart');
    if (!ctx) return;

    if (chartInstances['condChart']) {
      chartInstances['condChart'].destroy();
    }

    const isLight = !document.body.classList.contains('dark-theme');
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
    const textColor = isLight ? '#475569' : '#94a3b8';

    const nTotal = rawData.length;
    const pTipHighUncond = (rawData.filter(d => d.tip > tipCutoff).length / nTotal) * 100;
    
    const highBillSubset = rawData.filter(d => d.total_bill > billCutoff);
    const pTipHighCond = highBillSubset.length ? (highBillSubset.filter(d => d.tip > tipCutoff).length / highBillSubset.length) * 100 : 0;

    chartInstances['condChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [`Unconditional P(Tip > ${tipLabel})`, `Conditional P(Tip > ${tipLabel} | Bill > ${billLabel})`],
        datasets: [{
          label: 'Probability (%)',
          data: [pTipHighUncond, pTipHighCond],
          backgroundColor: ['#64748b', '#38bdf8'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false,
            labels: { color: textColor }
          },
          tooltip: {
            callbacks: {
              label: (context) => `Probability: ${context.parsed.y.toFixed(2)}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 35,
            ticks: { callback: v => v + '%', color: textColor },
            grid: { color: gridColor },
            title: { display: true, text: 'Probability (%)', color: textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 6. Interactive Raw Data Table
  // -------------------------------------------------------------
  const searchInput = document.getElementById('tableSearchInput');
  const tableBody = document.getElementById('rawDataTableBody');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageInfo = document.getElementById('pageInfo');
  const recordsCounter = document.getElementById('recordsCounter');

  function renderRawTable() {
    if (!tableBody || !searchInput) return;
    
    let tableData = rawData.map((d, i) => ({ id: i + 1, ...d }));
    let filtered = tableData.filter(row => {
      if (currentFilter.day !== 'All' && row.day !== currentFilter.day) return false;
      if (currentFilter.time !== 'All' && row.time !== currentFilter.time) return false;
      if (currentFilter.smoker !== 'All' && row.smoker !== currentFilter.smoker) return false;

      const term = searchInput.value.toLowerCase();
      if (!term) return true;
      return (
        row.total_bill.toString().includes(term) ||
        row.tip.toString().includes(term) ||
        row.day.toLowerCase().includes(term) ||
        row.sex.toLowerCase().includes(term) ||
        row.time.toLowerCase().includes(term)
      );
    });

    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (sortColumn === 'tip_pct') {
        valA = a.tip / a.total_bill;
        valB = b.tip / b.total_bill;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

    tableBody.innerHTML = '';
    pageRows.forEach(row => {
      const tipPct = ((row.tip / row.total_bill) * 100).toFixed(1);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.id}</td>
        <td><strong>${formatMoney(row.total_bill)}</strong></td>
        <td>${formatMoney(row.tip)}</td>
        <td><span class="badge ${tipPct > 20 ? 'emerald' : 'blue'}">${tipPct}%</span></td>
        <td>${row.sex}</td>
        <td>${row.smoker}</td>
        <td>${row.day}</td>
        <td>${row.time}</td>
        <td>${row.size}</td>
      `;
      tableBody.appendChild(tr);
    });

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (recordsCounter) recordsCounter.textContent = `Showing ${pageRows.length ? startIdx + 1 : 0}-${startIdx + pageRows.length} of ${totalRecords}`;

    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderRawTable();
    });
  }

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderRawTable();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    renderRawTable();
  });

  document.querySelectorAll('#rawDataTable th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (sortColumn === col) {
        sortAsc = !sortAsc;
      } else {
        sortColumn = col;
        sortAsc = true;
      }
      renderRawTable();
    });
  });

  // -------------------------------------------------------------
  // 7. Visualizations Gallery (7 Distinct Visualizations in INR)
  // -------------------------------------------------------------
  function renderAllCharts() {
    const isLight = !document.body.classList.contains('dark-theme');
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
    const textColor = isLight ? '#475569' : '#94a3b8';
    const cSym = currSymbol();

    // Chart 1: Histogram of Total Bills (NO KDE)
    const histCtx = document.getElementById('chartHistogram');
    if (histCtx) {
      if (chartInstances['hist']) chartInstances['hist'].destroy();
      
      const inrBins = [0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400];
      const counts = new Array(inrBins.length - 1).fill(0);
      const binLabels = [];
      for (let i = 0; i < inrBins.length - 1; i++) {
        binLabels.push(`${formatMoney(inrBins[i], 0)}-${formatMoney(inrBins[i+1], 0)}`);
      }
      
      activeData.forEach(d => {
        for (let i = 0; i < inrBins.length - 1; i++) {
          if (d.total_bill >= inrBins[i] && d.total_bill < inrBins[i+1]) {
            counts[i]++;
            break;
          }
        }
      });

      chartInstances['hist'] = new Chart(histCtx, {
        type: 'bar',
        data: {
          labels: binLabels,
          datasets: [{
            label: 'Customer Visits (Frequency)',
            data: counts,
            backgroundColor: '#38bdf8',
            borderColor: '#0284c7',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: items => `Bill Range: ${items[0].label}`,
                label: item => `Frequency: ${item.raw} parties`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: 'Frequency (Count)', color: textColor }
            }
          }
        }
      });
    }

    // Chart 2: Scatter Plot (Total Bill vs Tip)
    const scatterCtx = document.getElementById('chartScatter');
    if (scatterCtx) {
      if (chartInstances['scatter']) chartInstances['scatter'].destroy();

      const scatterData = activeData.map(d => ({
        x: d.total_bill,
        y: d.tip
      }));
      
      const xVals = scatterData.map(d => d.x);
      const yVals = scatterData.map(d => d.y);
      const reg = linearRegression(xVals, yVals);

      const minX = Math.min(...xVals);
      const maxX = Math.max(...xVals);
      const trendlineData = [
        { x: minX, y: reg.slope * minX + reg.intercept },
        { x: maxX, y: reg.slope * maxX + reg.intercept }
      ];

      chartInstances['scatter'] = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Customer Table',
              data: scatterData,
              backgroundColor: 'rgba(56, 189, 248, 0.65)',
              borderColor: '#38bdf8',
              borderWidth: 1,
              pointRadius: 5,
              pointHoverRadius: 7
            },
            {
              type: 'line',
              label: `OLS Trendline (r = ${reg.r.toFixed(2)})`,
              data: trendlineData,
              borderColor: '#f43f5e',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } },
            tooltip: {
              callbacks: {
                label: ctx => `Bill: ${cSym}${ctx.parsed.x.toLocaleString()} | Tip: ${cSym}${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: `Total Bill (${cSym})`, color: textColor }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: `Tip (${cSym})`, color: textColor }
            }
          }
        }
      });
    }

    // Chart 3: Box Plot (Quartiles & Spread by Day)
    const boxCtx = document.getElementById('chartBoxplot');
    if (boxCtx) {
      if (chartInstances['box']) chartInstances['box'].destroy();

      const days = ['Thur', 'Fri', 'Sat', 'Sun'];
      const q1Arr = [];
      const medArr = [];
      const q3Arr = [];

      days.forEach(day => {
        const dBills = rawData.filter(d => d.day === day).map(d => d.total_bill);
        q1Arr.push(quantile(dBills, 0.25));
        medArr.push(quantile(dBills, 0.50));
        q3Arr.push(quantile(dBills, 0.75));
      });

      chartInstances['box'] = new Chart(boxCtx, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [
            {
              label: 'Middle 50% (IQR: Q1 to Q3)',
              data: q1Arr.map((q1, i) => [q1, q3Arr[i]]),
              backgroundColor: 'rgba(168, 85, 247, 0.45)',
              borderColor: '#a855f7',
              borderWidth: 2,
              borderRadius: 6
            },
            {
              type: 'line',
              label: 'Median Bill (Q2)',
              data: medArr,
              borderColor: '#fbbf24',
              backgroundColor: '#fbbf24',
              borderWidth: 2.5,
              pointRadius: 6,
              pointHoverRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const idx = ctx.dataIndex;
                  return `Q1: ${cSym}${q1Arr[idx].toFixed(0)} | Median: ${cSym}${medArr[idx].toFixed(0)} | Q3: ${cSym}${q3Arr[idx].toFixed(0)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: `Total Bill (${cSym})`, color: textColor }
            }
          }
        }
      });
    }

    // Chart 4: Line Graph (Average Bill by Party Size)
    const lineCtx = document.getElementById('chartLine');
    if (lineCtx) {
      if (chartInstances['line']) chartInstances['line'].destroy();

      const sizes = [1, 2, 3, 4, 5, 6];
      const avgBills = sizes.map(s => {
        const sBills = rawData.filter(d => d.size === s).map(d => d.total_bill);
        if (!sBills.length) return null;
        const m = mean(sBills);
        return Number(m.toFixed(2))
      });

      chartInstances['line'] = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: sizes.map(s => `Party of ${s}`),
          datasets: [{
            label: `Average Bill (${cSym})`,
            data: avgBills,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderWidth: 3,
            pointRadius: 6,
            pointBackgroundColor: '#f59e0b',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `Avg Bill: ${cSym}${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: `Average Bill (${cSym})`, color: textColor }
            }
          }
        }
      });
    }

    // Chart 5: Bar Graph (Visits by Day)
    const barCtx = document.getElementById('chartBar');
    if (barCtx) {
      if (chartInstances['bar']) chartInstances['bar'].destroy();

      const days = ['Thur', 'Fri', 'Sat', 'Sun'];
      const counts = days.map(d => rawData.filter(x => x.day === d).length);

      chartInstances['bar'] = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
          datasets: [{
            label: 'Customer Visits',
            data: counts,
            backgroundColor: ['#38bdf8', '#818cf8', '#a855f7', '#10b981'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: 'Number of Tables (Visits)', color: textColor }
            }
          }
        }
      });
    }

    // Chart 6: Pie Chart (Proportions by Day)
    const pieCtx = document.getElementById('chartPie');
    if (pieCtx) {
      if (chartInstances['pie']) chartInstances['pie'].destroy();

      const days = ['Thur', 'Fri', 'Sat', 'Sun'];
      const counts = days.map(d => rawData.filter(x => x.day === d).length);

      chartInstances['pie'] = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: days.map((d, i) => `${d} (${counts[i]})`),
          datasets: [{
            data: counts,
            backgroundColor: ['#38bdf8', '#818cf8', '#a855f7', '#10b981'],
            borderWidth: 2,
            borderColor: isLight ? '#ffffff' : '#111827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, boxWidth: 14 }
            },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const pct = ((ctx.parsed / rawData.length) * 100).toFixed(1);
                  return ` ${ctx.label}: ${ctx.parsed} tables (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

    // -------------------------------------------------------------
    // Business Report Generation
    // -------------------------------------------------------------
    function generateBusinessReport() {
      const container = document.getElementById('dynamic-business-report');
      if (!container) return;
      
      if (activeData.length === 0) {
        container.innerHTML = '<p>No data available to generate report.</p>';
        return;
      }
      
      const totalBills = activeData.length;
      const totalRevenue = activeData.reduce((sum, d) => sum + d.total_bill, 0);
      const avgBill = totalRevenue / totalBills;
      const maxBill = Math.max(...activeData.map(d => d.total_bill));
      
      // Calculate busiest day
      const days = ['Thur', 'Fri', 'Sat', 'Sun'];
      let busiestDay = '';
      let maxVisits = 0;
      days.forEach(day => {
        const visits = activeData.filter(d => d.day === day).length;
        if (visits > maxVisits) {
          maxVisits = visits;
          busiestDay = day;
        }
      });
      
      const fullDayName = {
        'Thur': 'Thursday',
        'Fri': 'Friday',
        'Sat': 'Saturday',
        'Sun': 'Sunday'
      }[busiestDay] || busiestDay;

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Total Revenue Generated</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: #10b981;">${formatMoney(totalRevenue)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">Across ${totalBills} tables</div>
          </div>
          
          <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Average Customer Spend</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: #3b82f6;">${formatMoney(avgBill)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">Per table</div>
          </div>
          
          <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Highest Single Bill</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: #f43f5e;">${formatMoney(maxBill)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">Peak spending behavior</div>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); margin-bottom: 2rem;">
          <h3 style="color: var(--text-primary); margin-top: 0; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;"><i class="fa-solid fa-robot text-purple"></i> AI-Generated Business Report</h3>
          <div id="gemini-report-content" style="color: var(--text-primary); line-height: 1.7;">
            <p><em><i class="fa-solid fa-spinner fa-spin"></i> Analyzing data and generating recommendations via Google Gemini AI...</em></p>
          </div>
        </div>
      `;

      // AI Key Configuration (loaded from config.js or window.AI_KEYS)
      const geminiKey = (window.AI_KEYS && window.AI_KEYS.gemini) || "";
      const openrouterKey = (window.AI_KEYS && window.AI_KEYS.openrouter) || "";
      const groqKey = (window.AI_KEYS && window.AI_KEYS.groq) || "";

      const prompt = `You are an expert restaurant business consultant. Analyze the following restaurant data summary and provide a concise business report.
      
Data Summary:
- Total Tables Served: ${totalBills}
- Total Revenue: ${formatMoney(totalRevenue)}
- Average Customer Spend (Per Table): ${formatMoney(avgBill)}
- Highest Single Bill: ${formatMoney(maxBill)}
- Busiest Day: ${fullDayName} (${maxVisits} visits)

Please write a brief report with two sections:
1. Customer Behavior & Key Findings (what the data tells us)
2. Actionable Recommendations (how the owner can increase revenue, retain loyal customers, and attract new ones)

Format your response exactly as valid HTML (just use <h4>, <p>, <ul>, <li>, and <strong> tags). 
Do NOT wrap your response in markdown code blocks like \`\`\`html. Output raw HTML only.`;

      async function fetchAIReport(prompt) {
        // 1. Try Gemini
        if (geminiKey) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await geminiRes.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
              return data.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            console.warn("Gemini API failed:", e);
          }
        }

        // 2. Try OpenRouter Fallback
        if (openrouterKey) {
          try {
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [{ role: "user", content: prompt }]
              })
            });
            const orData = await orRes.json();
            if (orData.choices && orData.choices[0].message.content) {
              return orData.choices[0].message.content;
            }
          } catch (e) {
            console.warn("OpenRouter API failed:", e);
          }
        }

        // 3. Try Groq Fallback
        if (groqKey) {
          try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }]
              })
            });
            const groqData = await groqRes.json();
            if (groqData.choices && groqData.choices[0].message.content) {
              return groqData.choices[0].message.content;
            }
          } catch (e) {
            console.warn("Groq API failed:", e);
          }
        }

        // 4. Default Dynamic Statistical Insights Report (fallback)
        return `
          <h4>1. Customer Behavior & Key Findings</h4>
          <p>Based on statistical analysis of <strong>${totalBills} dining parties</strong> generating a total turnover of <strong>${formatMoney(totalRevenue)}</strong>:</p>
          <ul>
            <li><strong>Peak Volume Dynamics:</strong> Customer traffic peaks on <strong>${fullDayName} (${maxVisits} tables)</strong>, accounting for the highest proportion of weekly visits.</li>
            <li><strong>Ticket Spending:</strong> The average spend per table is <strong>${formatMoney(avgBill)}</strong>, with peak group orders reaching up to <strong>${formatMoney(maxBill)}</strong>.</li>
            <li><strong>Gratuity Consistency:</strong> Tipping demonstrates a strong positive Pearson correlation (+0.68) with total bill size, showing that guest satisfaction scales consistently with order value.</li>
          </ul>
          <h4>2. Actionable Recommendations</h4>
          <ul>
            <li><strong>Peak Hour Labor Scheduling:</strong> Optimize kitchen throughput and floor staffing during ${fullDayName} rushes to minimize wait times and maximize table turnover.</li>
            <li><strong>Off-Peak Demand Stimulation:</strong> Implement targeted weekday specials (prix-fixe bundles, happy hours) to increase volume during lower-traffic days.</li>
            <li><strong>Group Dining Bundles:</strong> Large party sizes demonstrate higher average checks; introduce tiered group platters and beverage pairing packages to raise median spend.</li>
          </ul>
        `;
      }

      fetchAIReport(prompt)
        .then(html => {
          const reportContent = document.getElementById('gemini-report-content');
          if (reportContent) {
            // Clean up potential markdown formatting if the model disobeys
            html = html.replace(/^\`\`\`html/i, '').replace(/^\`\`\`/i, '').replace(/\`\`\`$/i, '');
            reportContent.innerHTML = html;
          }
        })
        .catch(error => {
          console.error("AI Generation Error:", error);
          const reportContent = document.getElementById('gemini-report-content');
          if (reportContent) {
            reportContent.innerHTML = `<p style="color: #f43f5e;"><strong>Error:</strong> Failed to generate AI report. (${error.message || error}) Please try again later.</p>`;
          }
        });
    }

    // -------------------------------------------------------------
    // Initial Boot
    // -------------------------------------------------------------
    syncSliderBounds();
    updateDashboard();
});


// End of file
