"""
Restaurant Customer Behavior Analysis - Python Flask Backend for Vercel
========================================================================
All statistical and probabilistic analysis computed natively in Python using
pandas, numpy, and python-docx.
"""

import os
import json
import io
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_file, send_from_directory, render_template_string

# Initialize Flask app
app = Flask(__name__)

# Base directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIPS_JSON_PATH = os.path.join(BASE_DIR, 'tips.json')

EXCHANGE_RATE = 83.00

def load_default_df():
    """Load default dataset from tips.json with robust fallback."""
    if os.path.exists(TIPS_JSON_PATH):
        try:
            with open(TIPS_JSON_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return pd.DataFrame(data)
        except Exception as e:
            print("Failed to load tips.json:", e)

    # Static fallback array if file missing
    return pd.DataFrame([
        {"total_bill": 1410.17, "tip": 83.83, "sex": "Female", "smoker": "No", "day": "Sun", "time": "Dinner", "size": 2}
    ])


# Cache the base DataFrame
BASE_DF = load_default_df()

def compute_all_statistics(df):
    """Compute complete statistical suite in Python using pandas and numpy."""
    n = len(df)
    if n == 0:
        return {"n": 0, "status": "empty"}

    stats = {
        "n": int(n),
        "total_revenue": round(float(df['total_bill'].sum()), 2),
        "numerical": {},
        "day_breakdown": {},
        "correlation": {},
        "outliers": {
            "total_bill": [],
            "tip": []
        },
        "probabilities": {}
    }

    # Numerical variables analysis
    for col in ['total_bill', 'tip', 'size']:
        series = df[col].astype(float)
        mean_val = float(series.mean())
        median_val = float(series.median())
        mode_series = series.mode()
        mode_val = float(mode_series.iloc[0]) if not mode_series.empty else mean_val
        std_val = float(series.std()) if n > 1 else 0.0
        var_val = float(series.var()) if n > 1 else 0.0
        min_val = float(series.min())
        max_val = float(series.max())
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = float(q3 - q1)
        cv = float((std_val / mean_val) * 100) if mean_val != 0 else 0.0
        lower_fence = float(q1 - 1.5 * iqr)
        upper_fence = float(q3 + 1.5 * iqr)

        stats["numerical"][col] = {
            "mean": round(mean_val, 2),
            "median": round(median_val, 2),
            "mode": round(mode_val, 2),
            "std_dev": round(std_val, 2),
            "variance": round(var_val, 2),
            "range": round(max_val - min_val, 2),
            "min": round(min_val, 2),
            "max": round(max_val, 2),
            "q1": round(q1, 2),
            "q3": round(q3, 2),
            "iqr": round(iqr, 2),
            "cv": round(cv, 2),
            "lower_fence": round(lower_fence, 2),
            "upper_fence": round(upper_fence, 2)
        }

        # Outlier detection (Tukey's IQR method)
        if col in ['total_bill', 'tip']:
            outlier_mask = (series < lower_fence) | (series > upper_fence)
            outliers_df = df[outlier_mask]
            stats["outliers"][col] = outliers_df.to_dict(orient='records')

    # Day-wise variability breakdown
    if 'day' in df.columns:
        day_order = ['Thur', 'Fri', 'Sat', 'Sun']
        for d in day_order:
            sub = df[df['day'] == d]
            if len(sub) > 0:
                s_bill = sub['total_bill'].astype(float)
                m = float(s_bill.mean())
                s = float(s_bill.std()) if len(sub) > 1 else 0.0
                q1 = float(s_bill.quantile(0.25))
                q3 = float(s_bill.quantile(0.75))
                iqr = float(q3 - q1)
                cv = (s / m * 100) if m != 0 else 0.0
                stats["day_breakdown"][d] = {
                    "count": int(len(sub)),
                    "mean": round(m, 2),
                    "median": round(float(s_bill.median()), 2),
                    "std_dev": round(s, 2),
                    "q1": round(q1, 2),
                    "q3": round(q3, 2),
                    "iqr": round(iqr, 2),
                    "range": round(float(s_bill.max() - s_bill.min()), 2),
                    "cv": round(cv, 2)
                }

    # Pearson Correlation matrix
    corr_df = df[['total_bill', 'tip', 'size']].corr(method='pearson')
    stats["correlation"] = {
        "bill_tip": round(float(corr_df.loc['total_bill', 'tip']), 4),
        "bill_size": round(float(corr_df.loc['total_bill', 'size']), 4),
        "tip_size": round(float(corr_df.loc['tip', 'size']), 4),
        "matrix": corr_df.round(4).to_dict()
    }

    # Empirical Probabilities
    stats["probabilities"] = {
        "p_saturday": round(float(len(df[df['day'] == 'Sat']) / n * 100), 2) if 'day' in df.columns else 0.0,
        "p_sunday": round(float(len(df[df['day'] == 'Sun']) / n * 100), 2) if 'day' in df.columns else 0.0,
        "p_weekend": round(float(len(df[df['day'].isin(['Sat', 'Sun'])]) / n * 100), 2) if 'day' in df.columns else 0.0,
        "p_dinner": round(float(len(df[df['time'] == 'Dinner']) / n * 100), 2) if 'time' in df.columns else 0.0,
        "p_lunch": round(float(len(df[df['time'] == 'Lunch']) / n * 100), 2) if 'time' in df.columns else 0.0,
        "p_smoker": round(float(len(df[df['smoker'] == 'Yes']) / n * 100), 2) if 'smoker' in df.columns else 0.0
    }

    return stats


# Main web entrypoint
@app.route('/')
def index():
    """Serve the main web dashboard."""
    return send_from_directory(BASE_DIR, 'index.html')



# --------------------------------------------------------------------------
# Python REST API Endpoints
# --------------------------------------------------------------------------
@app.route('/api/health')
def health():
    """Health check verifying Python backend is active."""
    return jsonify({
        "status": "healthy",
        "backend": "Python / Flask",
        "numpy_version": np.__version__,
        "pandas_version": pd.__version__,
        "records_loaded": len(BASE_DF)
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Return complete statistical suite calculated by Python."""
    day = request.args.get('day', 'All')
    time = request.args.get('time', 'All')
    smoker = request.args.get('smoker', 'All')

    df = BASE_DF.copy()
    if day != 'All':
        df = df[df['day'] == day]
    if time != 'All':
        df = df[df['time'] == time]
    if smoker != 'All':
        df = df[df['smoker'] == smoker]

    results = compute_all_statistics(df)
    results["filter_applied"] = {"day": day, "time": time, "smoker": smoker}
    return jsonify(results)

@app.route('/api/data', methods=['GET'])
def get_data():
    """Return raw dataset JSON from Python pandas."""
    return jsonify(BASE_DF.to_dict(orient='records'))

@app.route('/api/filter', methods=['POST'])
def filter_data():
    """Filter dataset in Python and return computed statistics."""
    payload = request.get_json() or {}
    day = payload.get('day', 'All')
    time = payload.get('time', 'All')
    smoker = payload.get('smoker', 'All')

    df = BASE_DF.copy()
    if day != 'All':
        df = df[df['day'] == day]
    if time != 'All':
        df = df[df['time'] == time]
    if smoker != 'All':
        df = df[df['smoker'] == smoker]

    return jsonify(compute_all_statistics(df))

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    """Accept user CSV, parse with pandas, validate, and compute statistics."""
    try:
        if 'file' in request.files:
            file = request.files['file']
            df = pd.read_csv(file)
        elif request.is_json:
            csv_text = request.json.get('csv_text', '')
            df = pd.read_csv(io.StringIO(csv_text))
        else:
            return jsonify({"error": "No file or CSV content provided"}), 400

        # Validate required columns
        required_cols = {'total_bill', 'tip', 'sex', 'smoker', 'day', 'time', 'size'}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            return jsonify({"error": f"Missing required columns: {list(missing)}"}), 400

        stats = compute_all_statistics(df)
        stats["rows_parsed"] = len(df)
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-docx', methods=['GET'])
def export_docx():
    """Dynamically generate and download Word demonstration report."""
    docx_path = os.path.join(BASE_DIR, 'Project_Demonstration.docx')
    if os.path.exists(docx_path):
        return send_file(docx_path, as_attachment=True, download_name="Restaurant_Statistical_Report.docx")
    
    # Generate on the fly using python-docx
    try:
        import docx
        doc = docx.Document()
        doc.add_heading('Restaurant Data Analysis Dashboard - Statistical Report', 0)
        doc.add_paragraph('Generated dynamically via Python backend.')
        
        # Add summary table
        stats = compute_all_statistics(BASE_DF)
        doc.add_heading('Summary Statistics (in INR)', level=1)
        doc.add_paragraph(f"Total Transactions: {stats['n']}")
        doc.add_paragraph(f"Total Revenue: ₹{stats['total_revenue']:,.2f}")
        doc.add_paragraph(f"Mean Total Bill: ₹{stats['numerical']['total_bill']['mean']:,.2f}")
        doc.add_paragraph(f"Mean Tip: ₹{stats['numerical']['tip']['mean']:,.2f}")
        doc.add_paragraph(f"Pearson Correlation (Bill vs Tip): {stats['correlation']['bill_tip']}")

        mem = io.BytesIO()
        doc.save(mem)
        mem.seek(0)
        return send_file(mem, as_attachment=True, download_name="Restaurant_Statistical_Report.docx", mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        return jsonify({"error": f"Failed to generate docx: {str(e)}"}), 500

@app.route('/api/report', methods=['GET', 'POST'])
def generate_report():
    """Generate dynamic AI consultant business report in Python."""
    stats = compute_all_statistics(BASE_DF)
    tb = stats['numerical']['total_bill']
    
    html = f"""
    <h4>1. Customer Behavior & Key Findings (Python Analysis)</h4>
    <p>Based on rigorous Python pandas/numpy analysis of <strong>{stats['n']} dining records</strong> generating <strong>₹{stats['total_revenue']:,.2f}</strong> total turnover:</p>
    <ul>
      <li><strong>Revenue Hub:</strong> Weekend traffic accounts for <strong>{stats['probabilities']['p_weekend']}%</strong> of visits, with Saturday being the peak volume driver.</li>
      <li><strong>Spending Distribution:</strong> Average table spend is <strong>₹{tb['mean']:,.2f}</strong> (Median: ₹{tb['median']:,.2f}), with standard deviation of ₹{tb['std_dev']:,.2f} (CV: {tb['cv']}%).</li>
      <li><strong>Tipping Elasticity:</strong> Strong Pearson correlation of <strong>+{stats['correlation']['bill_tip']}</strong> confirms tipping scales proportionally with order size.</li>
    </ul>
    <h4>2. Actionable Recommendations</h4>
    <ul>
      <li><strong>Labor Scheduling:</strong> Scale kitchen line and front-of-house staff for peak weekend dining windows.</li>
      <li><strong>Midweek Promotions:</strong> Introduce targeted weekday combos to elevate Thursday and Friday revenues.</li>
      <li><strong>Group Bundles:</strong> Party size has a positive correlation (+{stats['correlation']['bill_size']}) with total bill; introduce family and group platters to drive higher ticket averages.</li>
    </ul>
    """
    return jsonify({"html": html, "engine": "Python/Flask"})

# Route aliases for Vercel / local routing
@app.route('/health')
def health_alias():
    return health()

@app.route('/stats', methods=['GET'])
def stats_alias():
    return get_stats()

@app.route('/api/index', methods=['GET', 'POST'])
def handle_vercel_index():
    """Vercel rewrites all /api/* routes to /api/index?route=..."""
    route = request.args.get('route', '').strip().lower()

    if route == 'stats':
        return get_stats()
    if route == 'data':
        return get_data()
    if route in ['export-docx', 'docx']:
        return export_docx()
    if route == 'report':
        return generate_report()
    if route == 'upload':
        return upload_csv()
    if route == 'filter':
        return filter_data()
    if route in ['health', '']:
        return health()

    return jsonify({"error": f"Unknown route '{route}'"}), 404



# Generic static asset handler (registered last so it never shadows /api routes)
@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files if found, otherwise return 404 for missing APIs or index.html."""
    file_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(BASE_DIR, filename)
    if filename.startswith('api/'):
        return jsonify({"error": "API endpoint not found", "endpoint": filename}), 404
    return send_from_directory(BASE_DIR, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

