# EDA and Forecasting - Data Analysis & Forecasting Platform

A comprehensive full-stack application for data analysis, visualization, and time series forecasting.

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Main application page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── FileUploader.tsx         # File upload interface
│   ├── DataExplorer.tsx         # Data exploration and type management
│   ├── Preprocessing.tsx        # Data cleaning and preprocessing
│   ├── EDAVisualization.tsx     # EDA graph selection
│   ├── VisualizationCard.tsx    # Individual visualization cards
│   ├── Forecasting.tsx          # Forecasting model selection
│   ├── ModelSelector.tsx        # Model choice interface
│   ├── ModelResults.tsx         # Results comparison and charts
│   ├── ResultsComparison.tsx    # Final results summary
│   ├── Navigation.tsx           # Top navigation bar
│   ├── ProgressBar.tsx          # Progress indicator
│   ├── GraphSelector.tsx        # EDA graph selector
├── lib/
│   ├── api.ts                   # API client service
│   ├── store.ts                 # Zustand state management
│   └── utils.ts                 # Utility functions
├── backend/                      # Python FastAPI backend
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── services/
│   │   ├── data_handler.py      # Data analysis service
│   │   ├── preprocessor.py      # Data preprocessing
│   │   ├── eda_generator.py     # EDA visualization generation
│   │   └── forecaster.py        # Model training (ARIMA, Prophet, LSTM)
│   └── schemas/
│       └── requests.py          # Pydantic request models
└── public/                       # Static assets
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.9+
- pip or uv (Python package manager)

### Frontend Setup

1. **Install dependencies:**
```bash
cd /path/to/project
pnpm install
```

2. **Set environment variables:**
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Run development server:**
```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Create Python virtual environment:**
```bash
cd backend
python -m venv venv

# Activate venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

Or using uv:
```bash
uv sync
uv run main.py
```

3. **Run the server:**
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Features

### 1. File Upload
- Supports CSV and Excel files
- Automatic data type detection
- File validation (max 50MB)
- Real-time error feedback

### 2. Data Explorer
- View column information
- Edit data types
- Analyze null values and unique counts
- Validate data structure

### 3. Data Preprocessing
- Handle missing values (drop, mean, median, forward fill)
- Feature scaling normalization
- Column selection
- Duplicate removal

### 4. Exploratory Data Analysis (EDA)
- Distribution plots
- Correlation matrices
- Box plots (outlier detection)
- Time series visualization
- Scatter plots
- Heatmaps
- Histograms
- Statistical summaries
- Customizable analysis notes

### 5. Time Series Forecasting
- **ARIMA**: Statistical forecasting with seasonality
- **Prophet**: Facebook's forecasting tool with trend detection
- **LSTM**: Deep learning neural network for complex patterns
- Configurable parameters:
  - Target column selection
  - Train-test split ratio
  - Forecast horizon (steps ahead)
  - Seasonality period

### 6. Results & Export
- Comprehensive metrics (Accuracy, RMSE, MAE, MAPE)
- Model comparison charts
- Forecast predictions visualization
- Export results (CSV, JSON, PDF)

## API Endpoints

### File Upload
- `POST /api/upload` - Upload CSV/Excel file

### Data Processing
- `POST /api/preprocess` - Preprocess data
- `POST /api/eda` - Generate EDA visualizations
- `POST /api/forecast` - Train forecasting models

### Analysis
- `POST /api/eda/analyze` - Update EDA analysis
- `GET /api/export` - Export results

### Health
- `GET /health` - Health check

## Technologies

### Frontend
- **Framework**: Next.js 15+ with TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Charting**: Recharts
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI
- **Data Processing**: Pandas, NumPy
- **ML/Forecasting**: Scikit-learn, StatsModels, Prophet, TensorFlow/LSTM
- **Server**: Uvicorn

## Usage Workflow

1. **Upload Data**: Drag and drop or select CSV/Excel file
2. **Explore Data**: Review columns, data types, and statistics
3. **Preprocess**: Clean data, handle missing values, apply scaling
4. **Analyze**: Select EDA graphs and customize analysis
5. **Forecast**: Choose forecasting model and configure parameters
6. **Review Results**: Compare models, view metrics, export results

## Configuration

### Forecast Parameters
- **Train-Test Split**: 60-95% (default 80%)
- **Forecast Horizon**: 10-365 steps (default 30)
- **Seasonality**: 1-52 (default 12 for monthly data)

### Preprocessing Options
- **Missing Value Strategy**: drop, mean, median, forward_fill
- **Normalization**: MinMax scaling (0-1 range)

## Performance Notes

- **File Size**: Tested up to 50MB
- **Data Rows**: Recommended up to 100,000 rows
- **LSTM Training**: GPU recommended for large datasets
- **API Timeout**: 5 minutes for heavy operations

## Troubleshooting

### Backend Connection Issues
1. Ensure backend is running on `http://localhost:8000`
2. Check CORS settings in `backend/main.py`
3. Verify `NEXT_PUBLIC_API_URL` environment variable

### Missing Dependencies
```bash
# Frontend
pnpm install

# Backend
pip install -r requirements.txt
```

### LSTM Training Errors
- Ensure TensorFlow is properly installed
- For GPU support: install `tensorflow[and-cuda]`
- Reduce dataset size if memory issues occur

## Future Enhancements

- [ ] Real-time data streaming
- [ ] Advanced feature engineering
- [ ] Ensemble model combinations
- [ ] Custom model configuration
- [ ] Model persistence and loading
- [ ] Batch predictions
- [ ] API rate limiting
- [ ] User authentication
- [ ] Data visualization customization
- [ ] Advanced statistics (hypothesis testing)

## License

MIT License - Feel free to use this project for educational and commercial purposes.

## Support

For issues, feature requests, or contributions, please open an issue or contact the development team.
