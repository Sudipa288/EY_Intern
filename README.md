# EDA and Forecasting - Data Analysis & Forecasting Platform

An interactive React-based frontend for comprehensive data analysis, exploratory data analysis (EDA), and time series forecasting.

## Features

### 1. **File Upload & Data Import** (`FileUploader.tsx`)
- Upload CSV, Excel, or other data formats
- Drag-and-drop interface
- File preview with data sample
- Support for multiple file types

### 2. **Data Explorer** (`DataExplorer.tsx`)
- View dataset structure and column information
- Change data types for columns
- Preview first rows of data
- Data type management (numeric, categorical, datetime, etc.)

### 3. **Data Preprocessing** (`Preprocessing.tsx`)
- Handle missing values (drop, fill, interpolate)
- Remove duplicates
- Data scaling and normalization
- Outlier detection and handling
- Interactive toggles for different cleaning techniques

### 4. **Exploratory Data Analysis (EDA)** (`EDADashboard.tsx`)
Comprehensive visualization dashboard including:
- **Overall Sales Trends** - Time series visualization of sales data
- **Monthly/Yearly Analysis** - Aggregated views by time periods
- **Weekly Breakdown** - Detailed analysis by day of week with factors
- **Store-wise Analysis** - Performance comparison across stores
- **Product-wise Analysis** - Product category performance
- **Correlation Heatmap** - Feature relationships visualization
- **Interactive Filters** - Filter by store, product, date range
- **Custom Analysis** - Modify analysis parameters on the fly

Charts include:
- Line charts for trends
- Bar charts for comparisons
- Heatmaps for correlations
- Box plots for distributions

### 5. **Forecasting Dashboard** (`ForecastingDashboard.tsx`)
Time series forecasting with multiple models:

**Supported Models:**
- **ARIMA** - Statistical autoregressive model
  - Univariate time series forecasting
  - Automatic parameter tuning
  - RMSE, MAE, MAPE metrics

- **Prophet** - Facebook's forecasting tool
  - Handles seasonality and trends
  - External regressors support
  - Robust to missing data
  - 87% accuracy (based on your analysis)

- **LSTM** - Deep Learning model
  - Neural network-based forecasting
  - Sequence-to-sequence modeling
  - Non-linear pattern capture

**Features:**
- Train/Test split configuration
- Model comparison side-by-side
- Real-time metrics calculation
- Performance visualization
- Forecast results export

### 6. **Results Comparison** (`ResultsComparison.tsx`)
- Compare multiple model results
- View accuracy metrics (RMSE, MAE, MAPE)
- Side-by-side forecast visualization
- Select best performing model
- Export results as CSV/JSON

## Component Architecture

```
App/
├── Navigation.tsx          # Top navigation and step indicator
├── ProgressBar.tsx         # Step progress indicator
├── FileUploader.tsx        # Data import interface
├── DataExplorer.tsx        # Column type management
├── Preprocessing.tsx       # Data cleaning interface
├── EDADashboard.tsx        # Interactive EDA visualizations
├── ForecastingDashboard.tsx # Model training and comparison
└── ResultsComparison.tsx   # Final results view
```

## Tech Stack

- **Framework**: Next.js 14+ with React 19
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts (for interactive visualizations)
- **State Management**: Zustand (lightweight store)
- **Icons**: Lucide React
- **HTTP Client**: Axios (for future API integration)
- **UI Components**: shadcn/ui

## Modern Light Mode Design

The entire application uses a clean light mode with:
- Gradient backgrounds (slate to blue)
- Clear, readable typography
- Accessible color contrast
- Smooth animations and transitions
- Responsive mobile-first layout

## Data Flow

1. **Upload** → User uploads CSV/Excel file
2. **Explore** → View and modify column data types
3. **Preprocess** → Clean data (handle missing values, outliers, etc.)
4. **EDA** → Interactive exploration with visualizations
5. **Forecast** → Train models and compare results
6. **Results** → View final comparison and export

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
pnpm build
pnpm start
```

## State Management (Zustand Store)

The app uses a global Zustand store (`lib/store.ts`) to manage:
- Current workflow step
- Uploaded data and metadata
- Column type mappings
- Preprocessing options
- Selected EDA graphs
- Forecasting model results

## Interactive Features

- **Graph Selection**: Choose which visualizations to display in EDA
- **Dynamic Filtering**: Filter data by dimensions in EDA
- **Model Configuration**: Adjust train/test splits, parameters
- **Real-time Metrics**: Calculate and display accuracy metrics
- **Custom Analysis**: Modify analysis parameters without reloading

## Future Backend Integration

The frontend is designed to integrate with a Python FastAPI backend for:
- Data processing (pandas, numpy)
- EDA graph generation
- Model training (scikit-learn, statsmodels, Prophet, LSTM)
- Forecasting predictions

API endpoints structure is predefined in `lib/api.ts`.

## Notes

- All visualizations are client-side with sample data
- Ready for backend API integration
- Fully responsive design for mobile and desktop
- Accessible UI with proper ARIA labels and semantic HTML
