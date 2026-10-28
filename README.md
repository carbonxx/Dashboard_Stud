# Course Lead Analytics Dashboard

A production-ready executive analytics dashboard built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Lucide React**, and **PapaParse** for leadership to review admissions funnel performance, lead quality scoring, and individual CRM lead records.

---

## 1. Key Capabilities

### Four Primary KPIs (Strictly Deduplicated Per Record)
1. **No. of Leads**: Count of CRM records matching the active filter criteria (source rows are preserved verbatim without automatic deduplication by name).
2. **IS Booked**:
   - **Primary**: `IS / MAT Funnel` (or `IS Funnel`) status is `Registered`, `RNA`, `ANS`, or `Scanned`.
   - **Fallback**: `Last Call Sub Disposition` is `IS Booked` when the funnel status does not establish a booking.
3. **IS Attended**: Count of leads whose `IS / MAT Funnel` status is `ANS` or `Scanned`.
4. **MAT Booked**:
   - **Precedence 1**: `IS / MAT Funnel` (or `MAT Funnel`) status is `TS`.
   - **Precedence 2**: `Last Call Sub Disposition` is `MAT Booked`.
   - **Precedence 3 (Fallback)**: `Lead Stage` = `MAT` *only* when booking status (funnel & sub disposition) is missing.
   - **Rates**:
     - `IS Booking Rate = IS Booked / Total Leads × 100`
     - `IS Attendance Rate = IS Attended / IS Booked × 100`
     - `MAT Booking Rate = MAT Booked / Total Leads × 100`

### Official Lead Scoring Rubric
- **Lead Stage Score**:
  - `MAT` = **2**
  - `IS` = **1**
  - `NI` / `Not Interested` = **0**
- **Lead Category Score**:
  - `High` = **3**
  - `Upper Medium` = **2**
  - `Medium` = **1**
- **Total Lead Score** = `Stage Score + Category Score` (e.g., `MAT + High = 5`, `IS + High = 4`, `IS + Medium = 2`, `NI + High = 3`).
- **Missing & Unsupported Values**: Case and whitespace are normalized when matching values while preserving original CRM text. Missing or unsupported values (such as `Lead Stage = "v"` in row 17 of `data.tsv`) are strictly marked **`Unscored`** rather than silently assigned zero.
- **Provisional Priority Bands** (clearly labeled as proposed dashboard classifications, with a one-click UI toggle):
  - `5`: Very High Priority
  - `4`: High Priority
  - `3`: Medium Priority
  - `2`: Low Priority
  - `0–1`: Very Low Priority

### Interactive Filtering, Visualizations & Export
- **Filters**: Global search, Course (auto-shown when present in uploaded CSV), Lead Category, Lead Stage, IS / MAT Funnel, Last Call Sub Disposition, City, Created At date range, Updated At date range, Total Lead Score, and Lead Priority Band.
- **Visualizations**:
  - IS Funnel Breakdown (`NRIS`, `Registered`, `RNA`, `ANS`, `Scanned`)
  - MAT Funnel Breakdown (`TS` and related MAT booking/stage indicators)
  - Lead Category Distribution
  - Lead Score & Priority Distribution
  - Lead Stage Distribution
- **Client-Side CSV / TSV Import & Export**: Upload any CRM export (`CSV` or `TSV`) directly in the browser without sending personal data to external servers, or export currently filtered records with calculated scores to CSV.

---

## 2. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Run TypeScript check and production build
npm run build

# 4. Preview production build locally
npm run preview
```

---

## 3. Deploying to Vercel via GitHub

1. **Initialize Git and push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: production-ready Course Lead Analytics Dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Open [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
   - **Framework Preset**: `Vite` (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: None required (100% client-side CSV/TSV architecture).
   - Click **Deploy**.

