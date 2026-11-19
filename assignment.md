Workshop and Project Assignments :
WS1: Run and Submit S1Basic Scripthttps://colab.research.google.com/drive/1KsfSJIcdSUx1MVbDyAGuI8mhoxbizIAx?usp=sharing
WS2: Prompt Engineering for Financial Analytics Dashboards & Local DeploymentUsing Open Gimini,GPT, Claude (Canvas) to build and deploy

GPT Agent Prompts:

Objective: Use structured prompting to design, build, and deploy an interactive Stock Radar Financial Analytics Dashboard as a standalone HTML application or on localhost.

Role & Context:
Act as an expert in quantitative financial modeling with extensive experience at a top-tier management consulting firm. Your task is to help me design and build an interactive Stock Radar Analytics Dashboard to identify key influential drivers and evaluate the financial impact of independent variables on [Insert Target Stock / Industry] on a daily basis.

Required Deliverables:


Business Problem Statement: Provide a concise strategic rationale explaining why analyzing daily price movements in [Insert Target Industry/Stock] is critical for portfolio management, risk mitigation, or alpha generation.
Financial Implications: Analyze how shifts in key independent variables translate into tangible financial outcomes (e.g., valuation multiples, margin compression, cost of capital, or intraday volatility).
Feature Selection (Daily Drivers): Recommend a structured set of high-frequency independent variables that impact the stock daily—categorized across macroeconomic indicators, sector-specific catalysts, technical momentum, and market sentiment.
Interactive Dashboard Prototype: Generate the complete, production-ready code (HTML/CSS/JavaScript or Python/Streamlet) to build and deploy a clean, high-contrast Stock Radar Dashboard locally (localhost or standalone .html) for real-time daily monitoring.
Regime Classification (“Bull vs. Bear” Signal): Propose a quantitative methodology to convert continuous model predictions into a binary “Bull” or “Bear” market regime signal. Provide the exact mathematical formula, probability threshold logic (e.g., P(Bear) >= x, and risk-management rationale behind the chosen cutoff.
AI Governance, Ethics & Responsible Innovation: Outline key ethical guardrails, model risk management practices (e.g., overfitting, look-ahead bias, data leakage), and interface transparency disclosures required to deploy this financial analytics tool responsibly.
WS3: Financial Data Extraction via Google ColabUse Colab to run your team stock

“https://colab.research.google.com/drive/1IlQxJipJPRwt0fWHazfI6kX4OiKafMyz?usp=sharing”
Queries:
3.1 Using the provided Google Colab template (modeled on the BBL sample code), retrieve historical daily price data for your team’s assigned stock with SET or industry benchmarks along with relevant macro/technical features from Yahoo Finance, Investing.com, or other open sources.
3.2 Data Preparation, EDA, Cleaned dataset for downstream modeling and render on Ydata html.
3.3 Combine those Stock price, Features and Classification in csv file
3.4 Export the csv file
3.5 Submit the code
3.6 Discuss about the data, process, and financial concept and preparing the Team presentation and Solo Oral exam.WS4 : Predictive Modeling & Regime Classification in Dataiku (No-Code) from WS #3 csv fileUsing dataiku (dataiku.com/product/get-started)
Queries:
4.1 Use your team cleaned dataset from WS #3 into Dataiku to build, train, and evaluate two distinct machine learning models
4.2 Ru Regression Models (Stock Price or Return Prediction): Forecast continuous daily stock prices or percentage returns.
4.3 Run Classification Model (Bull vs. Bear Regime Prediction): Predict binary market regimes using a custom probability threshold, evaluating performance via the Confusion Matrix, F1-Score, and ROC-AUC.
4.4 Submit your result on image or screen short or Dataiku results.
4.5 Discuss about what you are finding and preparing for Team presentation and Solo Oral Exam.