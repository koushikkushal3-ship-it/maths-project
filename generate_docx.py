import docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = docx.Document()
doc.add_heading('Restaurant Data Analysis Dashboard - Project Documentation', 0)

# 1. Project Overview
doc.add_heading('1. Project Overview', level=1)
doc.add_heading('What is this project?', level=2)
doc.add_paragraph('This project is an interactive, web-based statistical analysis and visualization dashboard built for analyzing restaurant transaction data. It allows users to process datasets containing restaurant bills, tips, party sizes, and demographics.')
doc.add_heading('Why was it built?', level=2)
doc.add_paragraph('The goal is to provide a comprehensive, real-time exploratory data analysis (EDA) tool. It replaces static data analysis with a dynamic frontend that calculates complex statistical measures (Central Tendency, Dispersion, Outliers) and visualizes them on the fly.')
doc.add_heading('How does it work?', level=2)
doc.add_paragraph('The project is built using Vanilla JavaScript, HTML5, and CSS3 for the frontend architecture. It uses PapaParse for parsing CSV data in the browser and Chart.js for rendering canvas-based statistical graphs. The application state is fully reactive; uploading new data instantly recalculates all metrics and redraws all charts.')

# 2. Components & Logic
doc.add_heading('2. Application Components & Logic Breakdown', level=1)

# Tab 1
doc.add_heading('Tab 1: Overview & Data Types', level=2)
doc.add_paragraph('WHAT: Displays the raw data structure and a mathematical classification matrix.\n'
                  'WHY: To understand the types of variables being analyzed before applying statistical tests.\n'
                  'LOGIC: The system iterates through the active dataset, identifying headers and mapping them to their statistical classification (e.g., Continuous Quantitative, Nominal Categorical).')

# Tab 2
doc.add_heading('Tab 2: Measures of Central Tendency & Dispersion', level=2)
doc.add_paragraph('WHAT: Calculates the core statistical metrics for the continuous variables (Total Bill and Tip).\n'
                  'WHY: To understand the center and spread of the restaurant\'s financial data.\n'
                  'FORMULAS & LOGIC:')
p = doc.add_paragraph(style='List Bullet')
p.add_run('Mean (μ): ').bold = True
p.add_run('Σ(x_i) / n. The code iterates through the array of values, sums them using reduce(), and divides by length.')
p = doc.add_paragraph(style='List Bullet')
p.add_run('Median: ').bold = True
p.add_run('The middle value. The code sorts the array. If n is odd, it takes the middle element. If n is even, it averages the two middle elements.')
p = doc.add_paragraph(style='List Bullet')
p.add_run('Standard Deviation (σ): ').bold = True
p.add_run('√( Σ(x_i - μ)² / n ). Measures data spread. The code maps each value to its squared deviation from the mean, averages them, and takes the square root.')

# Tab 3
doc.add_heading('Tab 3: Box Plot & Outlier Analysis', level=2)
doc.add_paragraph('WHAT: Identifies statistical anomalies (extreme bill amounts or tips).\n'
                  'WHY: Outliers can heavily skew the mean and standard deviation. Identifying them is critical for accurate analysis.\n'
                  'FORMULAS & LOGIC (Tukey\'s IQR Method):')
p = doc.add_paragraph(style='List Number')
p.add_run('Q1 (First Quartile): Median of the lower half of the dataset.')
p = doc.add_paragraph(style='List Number')
p.add_run('Q3 (Third Quartile): Median of the upper half of the dataset.')
p = doc.add_paragraph(style='List Number')
p.add_run('IQR (Interquartile Range): Q3 - Q1.')
p = doc.add_paragraph(style='List Number')
p.add_run('Lower Bound: Q1 - (1.5 × IQR).')
p = doc.add_paragraph(style='List Number')
p.add_run('Upper Bound: Q3 + (1.5 × IQR).')
doc.add_paragraph('Any data point falling below the Lower Bound or above the Upper Bound is flagged as an outlier and displayed in the Outlier Detection Table.')

# Tab 4
doc.add_heading('Tab 4: Visualizations Gallery (7 Distinct Plots)', level=2)
doc.add_paragraph('WHAT: Seven mathematical and statistical charts representing the data from different angles.\n'
                  'HOW IT WORKS: Uses the Chart.js library to bind the computed data arrays to canvas elements.\n'
                  'THE 7 PLOTS:')
plots = [
    'Scatter Plot (Bill vs Tip): Shows the linear correlation between bill size and tip amount.',
    'Bar Chart (Average Bill by Day): Aggregates total bills per day and averages them.',
    'Pie Chart (Smoker vs Non-Smoker): Shows the categorical distribution of patrons.',
    'Doughnut Chart (Gender Distribution): Shows the ratio of Male to Female payers.',
    'Line Chart (Tips over time/index): Visualizes the sequence of tips to spot trends.',
    'Polar Area Chart (Visits by Day): Displays the frequency (count) of visits categorized by day.',
    'Radar Chart (Multi-variable average): Compares multivariate averages (Bill, Tip, Size) across a normalized axis.'
]
for plot in plots:
    doc.add_paragraph(plot, style='List Bullet')

# Tab 5
doc.add_heading('Tab 5: Dynamic Business Report (AI Integration)', level=2)
doc.add_paragraph('WHAT: Generates actionable business insights for the restaurant owner based on the statistical data.\n'
                  'WHY: Translates raw math into understandable business strategies (upselling, staffing).\n'
                  'HOW & LOGIC:')
doc.add_paragraph('1. The system computes real-time KPIs: Total Revenue (Σ total_bills), Average Spend (Total Revenue / n), and Busiest Day (Mode of the \'day\' column).\n'
                  '2. It dynamically formats these variables into an AI Prompt.\n'
                  '3. It executes an asynchronous fetch() request to the Google Gemini API (gemini-3.5-flash-lite), passing the statistical summary.\n'
                  '4. It employs an advanced Fallback Mechanism: If Gemini fails (due to CORS or network), the system automatically attempts to fetch from OpenRouter (Llama 3.1 8B), and finally Groq API as a last resort.\n'
                  '5. The AI responds with HTML-formatted insights which are injected directly into the DOM.')

doc.add_heading('3. File Processing & Filtering System', level=1)
doc.add_paragraph('Custom CSV Upload: The user uploads a CSV file. The FileReader API reads the file as text, and PapaParse converts the CSV string into an array of JavaScript objects. The global `activeData` variable is updated, and the `updateDashboard()` orchestrator function is called to recalculate every formula and redraw every chart.')
doc.add_paragraph('Dynamic Filtering: Users can adjust slider inputs (e.g., Min Bill, Max Bill). The `activeData` array is filtered using JavaScript\'s `Array.prototype.filter()` based on the bounds, and the dashboard updates in real-time to reflect the subset of data.')

doc.save('Project_Demonstration.docx')
print('Created Project_Demonstration.docx successfully.')
