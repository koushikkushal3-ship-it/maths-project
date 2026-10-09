import re, os

# 1. Update index.html
html_path = 'c:/Users/neela/OneDrive/Desktop/maths project/maths project/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove probability section
html = re.sub(r'<!-- ================= TAB 4: PROBABILITY LAB ================= -->.*?<!-- ================= TAB 5: VISUALIZATIONS GALLERY ================= -->', '<!-- ================= TAB 5: VISUALIZATIONS GALLERY ================= -->', html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated index.html')

# 2. Update app.js
js_path = 'c:/Users/neela/OneDrive/Desktop/maths project/maths project/app.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

report_logic = """
// REPORT GENERATION LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-report-btn');
    if (!generateBtn) return;
    
    generateBtn.addEventListener('click', () => {
        const type = document.getElementById('report-type').value;
        const day = document.getElementById('report-day').value;
        const out = document.getElementById('report-output');
        
        let filteredData = TIPS_DATA;
        let title = 'Monthly-wise (Full) Report';
        if (type === 'daily') {
            filteredData = TIPS_DATA.filter(d => d.day === day);
            title = 'Daily-wise Report for ' + day;
        }
        
        if (filteredData.length === 0) {
            out.innerHTML = '<p>No data available for this selection.</p>';
            out.style.display = 'block';
            return;
        }
        
        const totalBills = filteredData.length;
        const totalRevenue = filteredData.reduce((sum, d) => sum + d.total_bill, 0);
        const avgBill = totalRevenue / totalBills;
        const totalTips = filteredData.reduce((sum, d) => sum + d.tip, 0);
        const avgTip = totalTips / totalBills;
        const maxBill = Math.max(...filteredData.map(d => d.total_bill));
        
        let recommendation = '';
        if (type === 'daily') {
            if (day === 'Sun' || day === 'Sat') {
                recommendation = 'High volume day. Recommendation: Increase staff capacity and prepare inventory for peak hours. Promote premium items as weekend customers tend to spend more.';
            } else {
                recommendation = 'Lower volume weekday. Recommendation: Introduce happy hour discounts or combo meals to attract more footfall. Optimize staff scheduling to save costs.';
            }
        } else {
            recommendation = 'Overall, weekends drive the majority of revenue. Focus marketing on Thursdays and Fridays to balance demand. Ensure high-value tables receive exceptional service to maintain the strong tipping correlation.';
        }
        
        out.innerHTML = `
            <h3 style="color: #fff; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px;">${title}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #94a3b8;">Total Customers / Tables</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #38bdf8;">${totalBills}</div>
                </div>
                <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #94a3b8;">Total Revenue</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #10b981;">₹${totalRevenue.toFixed(2)}</div>
                </div>
                <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #94a3b8;">Avg Bill / Table</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #fbbf24;">₹${avgBill.toFixed(2)}</div>
                </div>
                <div style="background: #1e293b; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; color: #94a3b8;">Highest Bill</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #f43f5e;">₹${maxBill.toFixed(2)}</div>
                </div>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                <h4 style="margin-top: 0; color: #e2e8f0; margin-bottom: 10px;">Strategic Recommendations</h4>
                <p style="color: #cbd5e1; line-height: 1.6; margin: 0;">${recommendation}</p>
            </div>
        `;
        out.style.display = 'block';
    });
    
    // Select report type dropdown to hide/show day selector
    const reportTypeSelect = document.getElementById('report-type');
    if(reportTypeSelect) {
        reportTypeSelect.addEventListener('change', (e) => {
            const daySelect = document.getElementById('report-day');
            if(e.target.value === 'monthly') {
                daySelect.style.display = 'none';
            } else {
                daySelect.style.display = 'inline-block';
            }
        });
    }
});
"""

if 'REPORT GENERATION LOGIC' not in js:
    js += '\n' + report_logic
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print('Updated app.js')
