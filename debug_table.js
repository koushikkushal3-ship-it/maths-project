const fs = require('fs');

const rawDataContent = fs.readFileSync('tips_data.js', 'utf8');
eval(rawDataContent); // creates TIPS_DATA

const rawData = TIPS_DATA;
let tableData = rawData.map((d, i) => ({ id: i + 1, ...d }));

let currentFilter = {
  day: 'All',
  time: 'All',
  smoker: 'All'
};

const rowsPerPage = 10;
let currentPage = 1;
let sortColumn = 'id';
let sortAsc = true;
let searchInput = { value: '' };

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

let outputHtml = '';
pageRows.forEach(row => {
  try {
    const tipPct = ((row.tip / row.total_bill) * 100).toFixed(1);
    outputHtml += `<tr><td>${row.id}</td><td>${row.total_bill}</td></tr>\n`;
  } catch (e) {
    console.error('Error on row:', row, e);
  }
});

console.log("Filtered length:", filtered.length);
console.log("pageRows length:", pageRows.length);
console.log("Generated HTML:", outputHtml);
