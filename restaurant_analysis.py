"""
Statistical and Probabilistic Analysis of Restaurant Customer Behavior
======================================================================
Domain: Probability & Statistics / Data Visualization / Data Analysis
Dataset: Seaborn 'tips' dataset (Converted to Indian Rupees: 1 USD = 83 INR)
Currency: Indian Rupees (INR, ₹)
"""

import os
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# Configuration & Plotting Aesthetics
# ---------------------------------------------------------
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'DejaVu Sans' # Robust across OS platforms
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 11

OUTPUT_DIR = "visualizations"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# Step 1: Load Dataset & Convert to Indian Rupees (INR)
# ---------------------------------------------------------
print("=" * 80)
print("STATISTICAL & PROBABILISTIC ANALYSIS OF RESTAURANT CUSTOMER BEHAVIOR (INR)")
print("=" * 80)

# Load tips dataset and apply conversion to Indian Rupees
tips = sns.load_dataset('tips')
EXCHANGE_RATE = 83.00  # 1 USD = ₹83.00 INR
tips['total_bill'] = (tips['total_bill'] * EXCHANGE_RATE).round(2)
tips['tip'] = (tips['tip'] * EXCHANGE_RATE).round(2)

print("\n--- 1. DATASET OVERVIEW & DATA TYPES ---")
print(f"Total Observations (n): {len(tips)}")
print(f"Total Features: {tips.shape[1]}")
print(f"Currency Standard: Indian Rupees (INR, ₹ / Rs, 1 USD = ₹ {EXCHANGE_RATE})")
print("\nFirst 5 Records (in INR):")
print(tips.head())

# Explicit data classification according to statistical theory
data_types = {
    "total_bill": {"Category": "Quantitative", "Sub-type": "Continuous", "Scale": "Ratio", "Description": "Cost of meal in INR (₹)"},
    "tip": {"Category": "Quantitative", "Sub-type": "Continuous", "Scale": "Ratio", "Description": "Tip amount in INR (₹)"},
    "size": {"Category": "Quantitative", "Sub-type": "Discrete", "Scale": "Ratio", "Description": "Number of people dining"},
    "sex": {"Category": "Qualitative", "Sub-type": "Nominal", "Scale": "Nominal", "Description": "Gender of bill payer (Male/Female)"},
    "smoker": {"Category": "Qualitative", "Sub-type": "Nominal", "Scale": "Nominal", "Description": "Presence of smokers in party (Yes/No)"},
    "day": {"Category": "Qualitative", "Sub-type": "Nominal", "Scale": "Nominal", "Description": "Day of the week (Thur/Fri/Sat/Sun)"},
    "time": {"Category": "Qualitative", "Sub-type": "Nominal", "Scale": "Nominal", "Description": "Meal time (Lunch/Dinner)"}
}

data_types_df = pd.DataFrame.from_dict(data_types, orient='index')
print("\nClassification Matrix:")
print(data_types_df.to_string())

# ---------------------------------------------------------
# Step 2: Measures of Central Tendency (in INR)
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 2. MEASURES OF CENTRAL TENDENCY (INR) ---")
print("=" * 80)
print("Formulae:")
print("  Mean:   x_bar = (sum(x_i)) / n")
print("  Median: Middle value (50th percentile) when ordered")
print("  Mode:   Most frequently occurring value(s)")

numerical_cols = ['total_bill', 'tip', 'size']
central_tendency = {}

for col in numerical_cols:
    mean_val = tips[col].mean()
    median_val = tips[col].median()
    mode_val = tips[col].mode().values[0]
    central_tendency[col] = {
        "Mean": round(mean_val, 2),
        "Median": round(median_val, 2),
        "Mode": round(mode_val, 2)
    }

ct_df = pd.DataFrame(central_tendency).T
print("\nCentral Tendency Summary Table:")
print(ct_df)

print(f"\nInterpretations:")
print(f"  - Average Restaurant Bill: ₹ {ct_df.loc['total_bill', 'Mean']:,.2f}")
print(f"  - Median Restaurant Bill:  ₹ {ct_df.loc['total_bill', 'Median']:,.2f}")
print(f"  - Skewness: Mean > Median -> Positively Skewed (pulled upward by high-spending diners)")
print(f"  - Average Tip Amount:      ₹ {ct_df.loc['tip', 'Mean']:,.2f}")
print(f"  - Median Tip Amount:       ₹ {ct_df.loc['tip', 'Median']:,.2f}")

# ---------------------------------------------------------
# Step 3: Measures of Dispersion (in INR)
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 3. MEASURES OF DISPERSION (INR) ---")
print("=" * 80)
print("Formulae:")
print("  Range = Maximum - Minimum")
print("  Quartiles: Q1 = 25th percentile, Q2 = 50th percentile (Median), Q3 = 75th percentile")
print("  Interquartile Range (IQR) = Q3 - Q1")

dispersion = {}
for col in numerical_cols:
    c_min = tips[col].min()
    c_max = tips[col].max()
    c_range = c_max - c_min
    p10 = tips[col].quantile(0.10)
    q1 = tips[col].quantile(0.25)
    q2 = tips[col].quantile(0.50)
    q3 = tips[col].quantile(0.75)
    p90 = tips[col].quantile(0.90)
    iqr = q3 - q1
    std_dev = tips[col].std()
    variance = tips[col].var()
    cv = (std_dev / tips[col].mean()) * 100 # Coefficient of Variation (%)
    
    dispersion[col] = {
        "Min": round(c_min, 2),
        "Max": round(c_max, 2),
        "Range": round(c_range, 2),
        "10th Pct": round(p10, 2),
        "Q1 (25th)": round(q1, 2),
        "Q2 (Median)": round(q2, 2),
        "Q3 (75th)": round(q3, 2),
        "90th Pct": round(p90, 2),
        "IQR": round(iqr, 2),
        "Std Dev": round(std_dev, 2),
        "Variance": round(variance, 2),
        "CV (%)": round(cv, 2)
    }

disp_df = pd.DataFrame(dispersion).T
print("\nDispersion Measures Table:")
print(disp_df[['Min', 'Max', 'Range', 'Q1 (25th)', 'Q2 (Median)', 'Q3 (75th)', 'IQR', 'Std Dev', 'CV (%)']])

# ---------------------------------------------------------
# Step 4: Data Distribution & Spending Variability Across Days (in INR)
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 4. DATA DISTRIBUTION & VARIABILITY BY DAY (INR) ---")
print("=" * 80)

day_stats = tips.groupby('day', observed=True)['total_bill'].agg(
    Visits='count',
    Mean='mean',
    Median='median',
    Std='std',
    Min='min',
    Max='max',
    Q1=lambda x: x.quantile(0.25),
    Q3=lambda x: x.quantile(0.75)
)
day_stats['Range'] = day_stats['Max'] - day_stats['Min']
day_stats['IQR'] = day_stats['Q3'] - day_stats['Q1']
day_stats['CV (%)'] = (day_stats['Std'] / day_stats['Mean']) * 100

print(day_stats.round(2))

highest_var_day = day_stats['CV (%)'].idxmax()
lowest_var_day = day_stats['CV (%)'].idxmin()
print(f"\nVariability Insights:")
print(f"  - Highest spending variability: {highest_var_day} (CV = {day_stats.loc[highest_var_day, 'CV (%)']:.2f}%)")
print(f"  - Lowest spending variability (most consistent): {lowest_var_day} (CV = {day_stats.loc[lowest_var_day, 'CV (%)']:.2f}%)")
print(f"  - Highest spending average: {day_stats['Mean'].idxmax()} (Mean = ₹ {day_stats['Mean'].max():,.2f})")
print(f"  - Day with most visits: {day_stats['Visits'].idxmax()} ({day_stats['Visits'].max()} visits)")

# ---------------------------------------------------------
# Step 5: Box Plot & Outlier Analysis (Tukey's IQR Rule in INR)
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 5. BOX PLOT & OUTLIER ANALYSIS (IQR RULE IN INR) ---")
print("=" * 80)
print("Tukey's Outlier Criterion:")
print("  Lower Bound = Q1 - 1.5 * IQR")
print("  Upper Bound = Q3 + 1.5 * IQR")
print("  Outlier if: x < Lower Bound  OR  x > Upper Bound\n")

for col in ['total_bill', 'tip']:
    q1 = tips[col].quantile(0.25)
    q3 = tips[col].quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    outliers = tips[(tips[col] < lower_bound) | (tips[col] > upper_bound)][col]
    
    print(f"Variable: '{col.upper()}' (in INR)")
    print(f"  Q1: ₹ {q1:,.2f} | Median (Q2): ₹ {tips[col].median():,.2f} | Q3: ₹ {q3:,.2f} | IQR: ₹ {iqr:,.2f}")
    print(f"  Lower Bound: ₹ {lower_bound:,.2f}")
    print(f"  Upper Bound: ₹ {upper_bound:,.2f} (values exceeding this are high outliers)")
    print(f"  Total Outliers Detected: {len(outliers)} ({len(outliers) / len(tips) * 100:.2f}% of data)")
    print(f"  Outlier Values: {[round(v, 2) for v in sorted(outliers.tolist())]}\n")

# ---------------------------------------------------------
# Step 6: Empirical Probability Analysis
# ---------------------------------------------------------
print("=" * 80)
print("--- 6. EMPIRICAL PROBABILITY ANALYSIS ---")
print("=" * 80)
print("Empirical Probability Principle:")
print("  P(E) = n(E) / N  (Relative frequency as probability)")

n_total = len(tips)

p_saturday = (tips['day'] == 'Sat').sum() / n_total

# High bill threshold: ₹ 2,490 (equivalent to ₹30)
high_bill_threshold = 2490.00
p_high_bill = (tips['total_bill'] > high_bill_threshold).sum() / n_total

# High tip threshold: ₹ 415 (equivalent to ₹5)
high_tip_threshold = 415.00
p_high_tip = (tips['tip'] > high_tip_threshold).sum() / n_total

p_smoker = (tips['smoker'] == 'Yes').sum() / n_total
p_non_smoker = (tips['smoker'] == 'No').sum() / n_total

p_high_tip_given_high_bill = (
    ((tips['tip'] > high_tip_threshold) & (tips['total_bill'] > high_bill_threshold)).sum()
    / (tips['total_bill'] > high_bill_threshold).sum()
)

print(f"\n1. Probability of a Saturday visit:")
print(f"   P(Day = 'Sat') = {tips['day'].value_counts()['Sat']} / {n_total} = {p_saturday:.4f} ({p_saturday * 100:.2f}%)")

print(f"\n2. Probability of a high-value bill (total_bill > ₹ {high_bill_threshold:,.2f}):")
print(f"   P(Total Bill > ₹ {high_bill_threshold:,.2f}) = {(tips['total_bill'] > high_bill_threshold).sum()} / {n_total} = {p_high_bill:.4f} ({p_high_bill * 100:.2f}%)")

print(f"\n3. Probability of a high tip (tip > ₹ {high_tip_threshold:,.2f}):")
print(f"   P(Tip > ₹ {high_tip_threshold:,.2f}) = {(tips['tip'] > high_tip_threshold).sum()} / {n_total} = {p_high_tip:.4f} ({p_high_tip * 100:.2f}%)")

print(f"\n4. Probability of Smoker vs. Non-Smoker:")
print(f"   P(Smoker = 'Yes') = {(tips['smoker'] == 'Yes').sum()} / {n_total} = {p_smoker:.4f} ({p_smoker * 100:.2f}%)")
print(f"   P(Smoker = 'No')  = {(tips['smoker'] == 'No').sum()} / {n_total} = {p_non_smoker:.4f} ({p_non_smoker * 100:.2f}%)")
print(f"   Verification: P(Smoker) + P(Non-Smoker) = {p_smoker + p_non_smoker:.4f}")

print(f"\n5. Conditional Probability - High tip given high bill:")
print(f"   P(Tip > ₹ 415 | Bill > ₹ 2,490) = {p_high_tip_given_high_bill:.4f} ({p_high_tip_given_high_bill * 100:.2f}%)")

# ---------------------------------------------------------
# Step 7: Correlation Analysis
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 7. CORRELATION ANALYSIS ---")
print("=" * 80)
print("Pearson Correlation Coefficient Matrix (r):")
print("  Note: Linear transformation to INR preserves Pearson r identically.")

corr_matrix = tips[['total_bill', 'tip', 'size']].corr()
print("\nCorrelation Matrix:")
print(corr_matrix.round(4))

r_bill_tip = corr_matrix.loc['total_bill', 'tip']
r_bill_size = corr_matrix.loc['total_bill', 'size']
r_tip_size = corr_matrix.loc['tip', 'size']

print("\nInterpretations:")
print(f"  - Total Bill vs Tip: r = {r_bill_tip:.4f} -> Strong positive linear correlation.")
print(f"  - Total Bill vs Party Size: r = {r_bill_size:.4f} -> Moderate-to-strong positive correlation.")
print(f"  - Tip vs Party Size: r = {r_tip_size:.4f} -> Moderate positive correlation.")

# ---------------------------------------------------------
# Step 8: Data Visualizations (7 Distinct Plots in INR)
# ---------------------------------------------------------
print("\n" + "=" * 80)
print("--- 8. GENERATING DATA VISUALIZATIONS (INR) ---")
print("=" * 80)

primary_color = "#1f77b4"
secondary_color = "#ff7f0e"
palette = ["#4C72B0", "#55A868", "#C44E52", "#8172B3"]

# 1. Histogram: Distribution of total bills (in INR, NO KDE)
plt.figure(figsize=(8, 5))
plt.hist(tips['total_bill'], bins=15, color='#2b5c8f', edgecolor='black', alpha=0.85)
plt.axvline(tips['total_bill'].mean(), color='red', linestyle='--', linewidth=2, label=f"Mean: ₹ {tips['total_bill'].mean():,.2f}")
plt.axvline(tips['total_bill'].median(), color='gold', linestyle='-', linewidth=2, label=f"Median: ₹ {tips['total_bill'].median():,.2f}")
plt.title("1. Histogram of Total Bills in INR (Without KDE)", fontsize=13)
plt.xlabel("Total Bill (₹ INR)")
plt.ylabel("Frequency (Count)")
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "1_histogram_total_bill.png"), dpi=300)
plt.close()

# 2. Scatter Plot: Total bill vs tip (in INR)
plt.figure(figsize=(8, 5))
plt.scatter(tips['total_bill'], tips['tip'], c=tips['size'], cmap='viridis', alpha=0.75, edgecolors='black', s=60)
m, b = np.polyfit(tips['total_bill'], tips['tip'], 1)
plt.plot(tips['total_bill'], m * tips['total_bill'] + b, color='red', linestyle='--', label=f"Trendline (r = {r_bill_tip:.2f})")
cbar = plt.colorbar()
cbar.set_label("Party Size")
plt.title("2. Scatter Plot: Total Bill vs Tip Amount (INR)", fontsize=13)
plt.xlabel("Total Bill (₹ INR)")
plt.ylabel("Tip (₹ INR)")
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "2_scatter_bill_vs_tip.png"), dpi=300)
plt.close()

# 3. Box Plot: Quartiles, IQR, spread and outliers across days (in INR)
plt.figure(figsize=(9, 5))
box_data = [tips[tips['day'] == day]['total_bill'].values for day in ['Thur', 'Fri', 'Sat', 'Sun']]
box = plt.boxplot(box_data, tick_labels=['Thur', 'Fri', 'Sat', 'Sun'], patch_artist=True,
                  flierprops=dict(marker='o', markerfacecolor='red', markersize=6, linestyle='none', markeredgecolor='black'))
for patch, color in zip(box['boxes'], palette):
    patch.set_facecolor(color)
    patch.set_alpha(0.8)
for median in box['medians']:
    median.set(color='black', linewidth=2)
plt.title("3. Box Plot: Spending Spread & Outliers by Day (INR)", fontsize=13)
plt.xlabel("Day of Week")
plt.ylabel("Total Bill (₹ INR)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "3_boxplot_bill_by_day.png"), dpi=300)
plt.close()

# 4. Line Graph: Average bill by party size (in INR)
plt.figure(figsize=(8, 5))
avg_bill_by_size = tips.groupby('size', observed=True)['total_bill'].mean()
plt.plot(avg_bill_by_size.index, avg_bill_by_size.values, marker='o', linewidth=2.5, markersize=8, color='#d95f02')
for x, y in zip(avg_bill_by_size.index, avg_bill_by_size.values):
    plt.text(x, y + 45, f"₹ {y:,.0f}", ha='center', fontweight='bold', fontsize=9)
plt.title("4. Line Graph: Average Total Bill by Party Size (INR)", fontsize=13)
plt.xlabel("Party Size (Number of Diners)")
plt.ylabel("Average Total Bill (₹ INR)")
plt.xticks(avg_bill_by_size.index)
plt.ylim(0, avg_bill_by_size.max() + 400)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "4_line_avg_bill_by_size.png"), dpi=300)
plt.close()

# 5. Bar Graph: Number of visits by day
plt.figure(figsize=(8, 5))
day_counts = tips['day'].value_counts()[['Thur', 'Fri', 'Sat', 'Sun']]
bars = plt.bar(day_counts.index, day_counts.values, color=palette, edgecolor='black', alpha=0.85)
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width() / 2, yval + 1, f"{int(yval)}", ha='center', va='bottom', fontweight='bold')
plt.title("5. Bar Graph: Customer Visits by Day", fontsize=13)
plt.xlabel("Day of the Week")
plt.ylabel("Number of Customer Visits")
plt.ylim(0, day_counts.max() + 10)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "5_bar_visits_by_day.png"), dpi=300)
plt.close()

# 6. Pie Chart: Customer category proportions (Visits by Day)
plt.figure(figsize=(7, 7))
plt.pie(day_counts.values, labels=day_counts.index, autopct='%1.1f%%', startangle=140,
        colors=palette, explode=[0.03, 0.03, 0.05, 0.03],
        wedgeprops=dict(edgecolor='black', linewidth=1.2))
plt.title("6. Pie Chart: Customer Visit Proportions by Day", fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "6_pie_visit_proportions.png"), dpi=300)
plt.close()

# 7. Heatmap: Correlation between numerical variables
plt.figure(figsize=(7, 5.5))
im = plt.imshow(corr_matrix, cmap='Blues', vmin=0, vmax=1)
plt.colorbar(im, label="Pearson r")
plt.xticks(range(len(corr_matrix)), ['Total Bill', 'Tip', 'Party Size'], fontsize=11)
plt.yticks(range(len(corr_matrix)), ['Total Bill', 'Tip', 'Party Size'], fontsize=11)
for i in range(len(corr_matrix)):
    for j in range(len(corr_matrix)):
        text_color = "white" if corr_matrix.iloc[i, j] > 0.6 else "black"
        plt.text(j, i, f"{corr_matrix.iloc[i, j]:.2f}", ha='center', va='center',
                 color=text_color, fontweight='bold', fontsize=12)
plt.title("7. Heatmap: Correlation Matrix", fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "7_heatmap_correlation.png"), dpi=300)
plt.close()

# Composite 7-panel Dashboard (in INR)
fig = plt.figure(figsize=(18, 12))
gs = fig.add_gridspec(3, 3, hspace=0.35, wspace=0.3)

ax1 = fig.add_subplot(gs[0, 0])
ax1.hist(tips['total_bill'], bins=15, color='#2b5c8f', edgecolor='black', alpha=0.85)
ax1.axvline(tips['total_bill'].mean(), color='red', linestyle='--', label=f"Mean: ₹ {tips['total_bill'].mean():,.0f}")
ax1.axvline(tips['total_bill'].median(), color='gold', linestyle='-', label=f"Median: ₹ {tips['total_bill'].median():,.0f}")
ax1.set_title("1. Distribution of Total Bills (INR)")
ax1.set_xlabel("Total Bill (₹ INR)")
ax1.set_ylabel("Count")
ax1.legend(fontsize=8)

ax2 = fig.add_subplot(gs[0, 1])
sc = ax2.scatter(tips['total_bill'], tips['tip'], c=tips['size'], cmap='viridis', alpha=0.7)
ax2.plot(tips['total_bill'], m * tips['total_bill'] + b, color='red', linestyle='--', label=f"r = {r_bill_tip:.2f}")
ax2.set_title("2. Total Bill vs Tip (INR)")
ax2.set_xlabel("Total Bill (₹ INR)")
ax2.set_ylabel("Tip (₹ INR)")
ax2.legend(fontsize=8)

ax3 = fig.add_subplot(gs[0, 2])
bplot = ax3.boxplot(box_data, tick_labels=['Thur', 'Fri', 'Sat', 'Sun'], patch_artist=True,
                    flierprops=dict(marker='o', markerfacecolor='red', markersize=5))
for patch, color in zip(bplot['boxes'], palette):
    patch.set_facecolor(color)
ax3.set_title("3. Bill Spread by Day (INR)")
ax3.set_xlabel("Day")
ax3.set_ylabel("Total Bill (₹ INR)")

ax4 = fig.add_subplot(gs[1, 0])
ax4.plot(avg_bill_by_size.index, avg_bill_by_size.values, marker='o', color='#d95f02', linewidth=2)
ax4.set_title("4. Average Bill by Party Size (INR)")
ax4.set_xlabel("Party Size")
ax4.set_ylabel("Avg Bill (₹ INR)")
ax4.set_xticks(avg_bill_by_size.index)

ax5 = fig.add_subplot(gs[1, 1])
ax5.bar(day_counts.index, day_counts.values, color=palette, edgecolor='black', alpha=0.85)
ax5.set_title("5. Visits by Day")
ax5.set_xlabel("Day")
ax5.set_ylabel("Visits")

ax6 = fig.add_subplot(gs[1, 2])
ax6.pie(day_counts.values, labels=day_counts.index, autopct='%1.1f%%', colors=palette, startangle=140)
ax6.set_title("6. Visit Proportions by Day")

ax7 = fig.add_subplot(gs[2, 1])
im7 = ax7.imshow(corr_matrix, cmap='Blues', vmin=0, vmax=1)
ax7.set_xticks(range(len(corr_matrix)), ['Bill', 'Tip', 'Size'])
ax7.set_yticks(range(len(corr_matrix)), ['Bill', 'Tip', 'Size'])
for i in range(len(corr_matrix)):
    for j in range(len(corr_matrix)):
        color_val = "white" if corr_matrix.iloc[i, j] > 0.6 else "black"
        ax7.text(j, i, f"{corr_matrix.iloc[i, j]:.2f}", ha='center', va='center', color=color_val, fontweight='bold')
ax7.set_title("7. Correlation Matrix Heatmap")
fig.colorbar(im7, ax=ax7, fraction=0.046, pad=0.04)

fig.suptitle("RESTAURANT CUSTOMER BEHAVIOR: STATISTICAL DASHBOARD (INR)", fontsize=16, fontweight='bold', y=0.98)
dash_path = os.path.join(OUTPUT_DIR, "summary_statistical_dashboard.png")
plt.savefig(dash_path, dpi=300, bbox_inches='tight')
plt.close()

print(f"  Saved Updated Dashboard in INR: {dash_path}")
print("ANALYSIS EXECUTION COMPLETED SUCCESSFULLY IN INR!")
