// ===== MOCK DATA GENERATORS =====

function generateMockSalesData() {
  const data = [];
  for (let i = 0; i < 52; i++) {
    data.push({
      week: i + 1,
      sales2022: Math.floor(60000 + Math.random() * 20000),
      sales2023: Math.floor(62000 + Math.random() * 18000),
    });
  }
  return data;
}

function generateMonthlyData() {
  return [
    { month: 'Jan', '2022': 58000, '2023': 62000 },
    { month: 'Feb', '2022': 61000, '2023': 59000 },
    { month: 'Mar', '2022': 65000, '2023': 68000 },
    { month: 'Apr', '2022': 62000, '2023': 64000 },
    { month: 'May', '2022': 67000, '2023': 70000 },
    { month: 'Jun', '2022': 59000, '2023': 61000 },
    { month: 'Jul', '2022': 63000, '2023': 65000 },
    { month: 'Aug', '2022': 62000, '2023': 64000 },
    { month: 'Sep', '2022': 68000, '2023': 71000 },
    { month: 'Oct', '2022': 70000, '2023': 72000 },
    { month: 'Nov', '2022': 73000, '2023': 75000 },
    { month: 'Dec', '2022': 71000, '2023': 74000 },
  ];
}

function generateStoreData() {
  return [
    { store: 'Store 1', sales: 125000, products: 20 },
    { store: 'Store 2', sales: 118000, products: 20 },
    { store: 'Store 3', sales: 132000, products: 20 },
    { store: 'Store 4', sales: 128000, products: 20 },
    { store: 'Store 5', sales: 121000, products: 20 },
  ];
}

function generateProductData() {
  const products = [];
  for (let i = 1; i <= 20; i++) {
    products.push({
      id: `Product ${i}`,
      sales: Math.floor(30000 + Math.random() * 40000),
      price: Math.floor(50 + Math.random() * 200),
      inventory: Math.floor(100 + Math.random() * 300),
    });
  }
  return products;
}

function generateForecastData() {
  const data = [];
  for (let i = 0; i < 52; i++) {
    const trend = 50000 + i * 300;
    const seasonality = 5000 * Math.sin((i / 52) * Math.PI * 2);
    data.push({
      week: i + 1,
      actual: Math.floor(trend + seasonality + (Math.random() - 0.5) * 5000),
      arimaForecast: Math.floor(trend),
      prophetForecast: Math.floor(trend + seasonality),
    });
  }
  return data;
}

function generateComponentData() {
  const data = [];
  for (let i = 0; i < 52; i++) {
    data.push({
      week: i + 1,
      trend: 50000 + i * 300 + (Math.random() - 0.5) * 2000,
      seasonality: 5000 * Math.sin((i / 52) * Math.PI * 2),
      externalFactors: (Math.random() - 0.5) * 3000,
    });
  }
  return data;
}

// ===== CHART INSTANCES =====
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ===== EDA CHARTS =====

function renderSalesTrendChart() {
  const ctx = document.getElementById('chartSalesTrend');
  if (!ctx) return;
  destroyChart('chartSalesTrend');
  const data = generateMockSalesData();
  chartInstances['chartSalesTrend'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week),
      datasets: [
        { label: '2022', data: data.map(d => d.sales2022), borderColor: '#3b82f6', pointRadius: 0, borderWidth: 2, tension: 0.3 },
        { label: '2023', data: data.map(d => d.sales2023), borderColor: '#ef4444', pointRadius: 0, borderWidth: 2, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { title: { display: true, text: 'Week' }, grid: { display: false } },
        y: { title: { display: true, text: 'Units Sold' } }
      }
    }
  });
}

function renderMonthlySalesChart() {
  const ctx = document.getElementById('chartMonthlySales');
  if (!ctx) return;
  destroyChart('chartMonthlySales');
  const data = generateMonthlyData();
  chartInstances['chartMonthlySales'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.month),
      datasets: [
        { label: '2022', data: data.map(d => d['2022']), backgroundColor: '#3b82f6' },
        { label: '2023', data: data.map(d => d['2023']), backgroundColor: '#ef4444' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { grid: { display: false } } }
    }
  });
}

function renderWeeklySalesChart() {
  const ctx = document.getElementById('chartWeeklySales');
  if (!ctx) return;
  destroyChart('chartWeeklySales');
  const data = generateMockSalesData();
  chartInstances['chartWeeklySales'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week),
      datasets: [
        { label: '2022', data: data.map(d => d.sales2022), borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: '2023', data: data.map(d => d.sales2023), borderColor: '#ef4444', borderWidth: 2, pointRadius: 0, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    }
  });
}

function renderStoreSalesChart() {
  const ctx = document.getElementById('chartStoreSales');
  if (!ctx) return;
  destroyChart('chartStoreSales');
  const data = generateStoreData();
  chartInstances['chartStoreSales'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.store),
      datasets: [
        { label: 'Total Sales', data: data.map(d => d.sales), backgroundColor: '#3b82f6', yAxisID: 'y' },
        { label: 'Products', data: data.map(d => d.products), backgroundColor: '#10b981', yAxisID: 'y1' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { type: 'linear', position: 'left', title: { display: true, text: 'Total Sales' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: 'Products' }, grid: { drawOnChartArea: false } },
      }
    }
  });
}

function renderProductSalesChart() {
  const ctx = document.getElementById('chartProductSales');
  if (!ctx) return;
  destroyChart('chartProductSales');
  const data = generateProductData();
  chartInstances['chartProductSales'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.id),
      datasets: [
        { label: 'Total Sales', data: data.map(d => d.sales), backgroundColor: '#3b82f6' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { position: 'bottom' } },
    }
  });
}

// ===== FORECASTING CHARTS =====

function renderARIMAChart() {
  const ctx = document.getElementById('chartArima');
  if (!ctx) return;
  destroyChart('chartArima');
  const data = generateForecastData();
  chartInstances['chartArima'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week),
      datasets: [
        { label: 'Actual', data: data.map(d => d.actual), borderColor: '#000', borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'ARIMA Forecast', data: data.map(d => d.arimaForecast), borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    }
  });
}

function renderProphetChart() {
  const ctx = document.getElementById('chartProphet');
  if (!ctx) return;
  destroyChart('chartProphet');
  const data = generateForecastData();
  chartInstances['chartProphet'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week),
      datasets: [
        { label: 'Actual', data: data.map(d => d.actual), borderColor: '#000', borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'Prophet Forecast', data: data.map(d => d.prophetForecast), borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    }
  });
}

function renderComponentCharts() {
  const compData = generateComponentData();

  // Trend
  const ctx1 = document.getElementById('chartTrend');
  if (ctx1) {
    destroyChart('chartTrend');
    chartInstances['chartTrend'] = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: compData.map(d => d.week),
        datasets: [{ label: 'Trend', data: compData.map(d => d.trend), borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  // Seasonality
  const ctx2 = document.getElementById('chartSeasonality');
  if (ctx2) {
    destroyChart('chartSeasonality');
    chartInstances['chartSeasonality'] = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: compData.map(d => d.week),
        datasets: [{ label: 'Seasonality', data: compData.map(d => d.seasonality), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  // External Factors
  const ctx3 = document.getElementById('chartExternal');
  if (ctx3) {
    destroyChart('chartExternal');
    chartInstances['chartExternal'] = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: compData.map(d => d.week),
        datasets: [{ label: 'External Factors', data: compData.map(d => d.externalFactors), backgroundColor: '#8b5cf6' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}

function renderComparisonChart() {
  const ctx = document.getElementById('chartComparison');
  if (!ctx) return;
  destroyChart('chartComparison');
  const data = generateForecastData();
  chartInstances['chartComparison'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.week),
      datasets: [
        { label: 'Actual Data', data: data.map(d => d.actual), borderColor: '#000', borderWidth: 2.5, pointRadius: 0, tension: 0.3 },
        { label: 'ARIMA', data: data.map(d => d.arimaForecast), borderColor: '#ef4444', borderDash: [5, 5], borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'Prophet', data: data.map(d => d.prophetForecast), borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    }
  });
}

// ===== RENDER ALL CHARTS FOR A TAB =====

function renderEDACharts(tabId) {
  setTimeout(() => {
    if (tabId === 'eda-trends') {
      renderSalesTrendChart();
      renderMonthlySalesChart();
      renderWeeklySalesChart();
    } else if (tabId === 'eda-stores') {
      renderStoreSalesChart();
    } else if (tabId === 'eda-products') {
      renderProductSalesChart();
    }
  }, 50);
}

function renderForecastCharts(tabId) {
  setTimeout(() => {
    if (tabId === 'fc-arima') {
      renderARIMAChart();
    } else if (tabId === 'fc-prophet') {
      renderProphetChart();
      renderComponentCharts();
    } else if (tabId === 'fc-comparison') {
      renderComparisonChart();
    }
  }, 50);
}
