# PTTEP Stock Radar

Single-page dashboard (React + Vite + three.js + uPlot) showing what is moving PTTEP:
a 3D ridgeline of six daily drivers, price regime (SMA50), and a logistic Bull/Bear signal 5 trading days ahead.

```bash
npm install
npm run dev      # local dev server
npm run build    # single-file build in dist/index.html
```

Data: `src/data/PTTEP_all_Final_Full.csv` (Yahoo Finance, Investing.com). Not investment advice.
