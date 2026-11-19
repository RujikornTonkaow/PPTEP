# WS2 Prompt Used

## Part A: Instructor's prompt (only the stock/industry placeholder filled in)

```
Objective: Use structured prompting to design, build, and deploy an interactive Stock Radar Financial Analytics Dashboard as a standalone HTML application or on localhost.

Role & Context:
Act as an expert in quantitative financial modeling with extensive experience at a top-tier management consulting firm. Your task is to help me design and build an interactive Stock Radar Analytics Dashboard to identify key influential drivers and evaluate the financial impact of independent variables on PTTEP (PTT Exploration and Production PCL, SET: PTTEP — Thai Energy / Oil & Gas Upstream sector) on a daily basis.

Required Deliverables:

1. Business Problem Statement: Provide a concise strategic rationale explaining why analyzing daily price movements in PTTEP / Thai Energy (Oil & Gas Upstream) is critical for portfolio management, risk mitigation, or alpha generation.
2. Financial Implications: Analyze how shifts in key independent variables translate into tangible financial outcomes (e.g., valuation multiples, margin compression, cost of capital, or intraday volatility).
3. Feature Selection (Daily Drivers): Recommend a structured set of high-frequency independent variables that impact the stock daily—categorized across macroeconomic indicators, sector-specific catalysts, technical momentum, and market sentiment.
4. Interactive Dashboard Prototype: Generate the complete, production-ready code (HTML/CSS/JavaScript or Python/Streamlit) to build and deploy a clean, high-contrast Stock Radar Dashboard locally (localhost or standalone .html) for real-time daily monitoring.
5. Regime Classification ("Bull vs. Bear" Signal): Propose a quantitative methodology to convert continuous model predictions into a binary "Bull" or "Bear" market regime signal. Provide the exact mathematical formula, probability threshold logic (e.g., P(Bear) >= x), and risk-management rationale behind the chosen cutoff.
6. AI Governance, Ethics & Responsible Innovation: Outline key ethical guardrails, model risk management practices (e.g., overfitting, look-ahead bias, data leakage), and interface transparency disclosures required to deploy this financial analytics tool responsibly.
```

## Part B: Added by our team (not in the instructor's prompt)

Added so the dashboard matches our WS3 dataset and can load a refreshed CSV.

```
Context — my dataset from WS3 (PTTEP_all_Final_Full.csv, daily, 2021–2026) has these columns:
Date, Brent_Close, PTTEP_Close, THBUSD_Close, SP500_Close, SET_Index, Thailand_10Y_Yield_Pct, Thailand_1Y_Yield_Pct, Thailand_1Y_Yield_Pct_Imputed, Thailand_10Y_Yield_Pct_Imputed, FX_THB_per_USD, PTTEP_Classification (Bull if PTTEP_Close >= 50-day SMA, else Bear).
Please align the feature selection and dashboard with these columns, and make the dashboard able to load this CSV file via a file-upload button.
```
