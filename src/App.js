import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Chart } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,   // for X axis
  LinearScale,    // for Y axis
  PointElement,
  LineElement,
  BarElement,
  BarController ,
  Title,
  LineController



} from 'chart.js';

// Register everything you need
ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController ,
  Title,


);



function App() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyProfit, setDailyProfit] = useState('');
  const [zakatRate, setZakatRate] = useState(2.5);
  const [sadakaAmount, setSadakaAmount] = useState(0);
  const [financialData, setFinancialData] = useState([]);
  const [notification, setNotification] = useState({ message: '', isSuccess: true, show: false });

  const profitChartRef = useRef(null);
  const zakatChartRef = useRef(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      setFinancialData(JSON.parse(savedData));
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update charts when data changes
  useEffect(() => {
    if (financialData.length > 0 && typeof Chart !== 'undefined') {
      renderCharts();
    }
  }, [financialData]);

  // Show notification
  const showNotification = (message, isSuccess = true) => {
    setNotification({ message, isSuccess, show: true });
    setTimeout(() => {
      setNotification({ message: '', isSuccess: true, show: false });
    }, 3000);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date for storage
  const formatDateForStorage = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate financial summary
  const financialSummary = () => {
    const totalProfit = financialData.reduce((sum, item) => sum + item.profit, 0);
    const totalZakat = financialData.reduce((sum, item) => sum + item.zakat, 0);
    const totalSadaka = financialData.reduce((sum, item) => sum + item.sadaka, 0);
    const netProfit = totalProfit - totalZakat - totalSadaka;

    return { totalProfit, totalZakat, totalSadaka, netProfit };
  };

  const { totalProfit, totalZakat, totalSadaka, netProfit } = financialSummary();

  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isToday = cellDate.toDateString() === today.toDateString();
      const hasData = financialData.some(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === cellDate.toDateString();
      });
      const isSelected = cellDate.toDateString() === selectedDate.toDateString();

      const dayClasses = ['day-cell'];
      if (isToday) dayClasses.push('today');
      if (hasData) dayClasses.push('has-data');
      if (isSelected) dayClasses.push('selected');

      days.push(
        <div
          key={`day-${day}`}
          className={dayClasses.join(' ')}
          onClick={() => selectDate(cellDate)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Select date
  const selectDate = (date) => {
    setSelectedDate(date);

    // Load data for selected date if exists
    const dateString = formatDateForStorage(date);
    const existingData = financialData.find(item => item.date === dateString);

    if (existingData) {
      setDailyProfit(existingData.profit.toString());
      setZakatRate(existingData.zakatRate);
      setSadakaAmount(existingData.sadaka);
    } else {
      setDailyProfit('');
      setSadakaAmount(0);
      setZakatRate(2.5);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Save data
  const saveData = () => {
    const profit = parseFloat(dailyProfit) || 0;
    const zakat = profit * (zakatRate / 100);
    const sadaka = parseFloat(sadakaAmount) || 0;

    if (profit <= 0) {
      showNotification('Please enter a valid profit amount', false);
      return;
    }

    const dateString = formatDateForStorage(selectedDate);
    const newData = {
      date: dateString,
      profit,
      zakatRate,
      zakat,
      sadaka,
      net: profit - zakat - sadaka
    };

    // Check if data already exists for this date
    const existingIndex = financialData.findIndex(item => item.date === dateString);

    let updatedData;
    if (existingIndex !== -1) {
      // Update existing data
      updatedData = [...financialData];
      updatedData[existingIndex] = newData;
    } else {
      // Add new data
      updatedData = [...financialData, newData];
    }

    setFinancialData(updatedData);
    localStorage.setItem('financialData', JSON.stringify(updatedData));

    showNotification('Data saved successfully!');
  };

  // Reset form
  const resetForm = () => {
    setDailyProfit('');
    setZakatRate(2.5);
    setSadakaAmount(0);
  };

  // Export data
  const exportData = () => {
    const headers = ['Date', 'Profit (₹)', 'Zakat Rate (%)', 'Zakat (₹)', 'Sadaka (₹)', 'Net Profit (₹)'];
    const csvData = financialData.map(item => [
      item.date,
      item.profit,
      item.zakatRate,
      item.zakat,
      item.sadaka,
      item.net
    ]);

    csvData.unshift(headers);
    const csvContent = csvData.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `profit-zakat-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data exported successfully!');
  };

  // Edit data
  const editData = (dateString) => {
    const data = financialData.find(item => item.date === dateString);
    if (data) {
      const date = new Date(dateString);
      setCurrentDate(new Date(date));
      setSelectedDate(new Date(date));
      setDailyProfit(data.profit.toString());
      setZakatRate(data.zakatRate);
      setSadakaAmount(data.sadaka);
    }
  };

  // Delete data
  const deleteData = (dateString) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const updatedData = financialData.filter(item => item.date !== dateString);
      setFinancialData(updatedData);
      localStorage.setItem('financialData', JSON.stringify(updatedData));
      showNotification('Record deleted successfully!');
    }
  };

  // Setup sharing
  const setupSharing = () => {
    const currentUrl = window.location.href;
    const message = "Check out this Profit & Zakat Tracker app!";

    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + currentUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(message)}`,
      copyLink: () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
          showNotification('Link copied to clipboard!');
        }, () => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showNotification('Link copied to clipboard!');
        });
      }
    };
  };

  const sharing = setupSharing();

  // Prepare chart data
  const prepareChartData = () => {
    const sortedData = [...financialData].sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const profitData = sortedData.map(item => item.profit);
    const zakatData = sortedData.map(item => item.zakat);
    const sadakaData = sortedData.map(item => item.sadaka);

    // Cumulative data
    const cumulativeProfit = [];
    const cumulativeZakat = [];
    const cumulativeSadaka = [];

    let profitSum = 0;
    let zakatSum = 0;
    let sadakaSum = 0;

    for (const item of sortedData) {
      profitSum += item.profit;
      zakatSum += item.zakat;
      sadakaSum += item.sadaka;

      cumulativeProfit.push(profitSum);
      cumulativeZakat.push(zakatSum);
      cumulativeSadaka.push(sadakaSum);
    }

    return {
      labels,
      profitData,
      zakatData,
      sadakaData,
      cumulativeProfit,
      cumulativeZakat,
      cumulativeSadaka
    };
  };

  // Render charts
  const renderCharts = () => {
    if (typeof Chart === 'undefined') return;

    // Destroy existing charts
    if (profitChartRef.current) {
      profitChartRef.current.destroy();
    }
    if (zakatChartRef.current) {
      zakatChartRef.current.destroy();
    }

    const chartData = prepareChartData();

    // Create Profit Chart
    const profitCanvas = document.getElementById('profitChart');
    if (profitCanvas) {
      profitChartRef.current = new Chart(profitCanvas, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Daily Profit (₹)',
              data: chartData.profitData,
              backgroundColor: 'rgba(52, 152, 219, 0.7)',
              borderColor: 'rgba(52, 152, 219, 1)',
              borderWidth: 1
            },
            {
              label: 'Cumulative Profit (₹)',
              data: chartData.cumulativeProfit,
              type: 'line',
              fill: false,
              borderColor: 'rgba(46, 204, 113, 1)',
              tension: 0.1,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount (₹)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Daily and Cumulative Profit'
            }
          }
        }
      });
    }

    // Create Zakat & Sadaka Chart
    const zakatCanvas = document.getElementById('zakatChart');
    if (zakatCanvas) {
      zakatChartRef.current = new Chart(zakatCanvas, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Zakat (₹)',
              data: chartData.zakatData,
              backgroundColor: 'rgba(39, 174, 96, 0.7)',
              borderColor: 'rgba(39, 174, 96, 1)',
              borderWidth: 1
            },
            {
              label: 'Sadaka (₹)',
              data: chartData.sadakaData,
              backgroundColor: 'rgba(155, 89, 182, 0.7)',
              borderColor: 'rgba(155, 89, 182, 1)',
              borderWidth: 1
            },
            {
              label: 'Cumulative Zakat & Sadaka (₹)',
              data: chartData.cumulativeZakat.map((val, idx) => val + chartData.cumulativeSadaka[idx]),
              type: 'line',
              fill: false,
              borderColor: 'rgba(231, 76, 60, 1)',
              tension: 0.1,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount (₹)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Zakat, Sadaka and Cumulative Contributions'
            }
          }
        }
      });
    }
  };

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <h1><i className="fas fa-calculator"></i> Profit & Zakat Tracker</h1>
          <p className="description">Track your daily profits, zakat, and sadaka with calendar-based data selection and real-time storage</p>
        </div>
        <div id="currentDateTime" style={{fontWeight: 600, color: '#2c3e50'}}>
          {currentDateTime.toLocaleString()}
        </div>
      </header>

      <div className="sharing-section">
        <h2><i className="fas fa-share-alt"></i> Share this App</h2>
        <p>Share this app with your friends and family so they can also track their profits and zakat</p>
        <div className="share-buttons">
          <a href={sharing.whatsapp} className="share-btn whatsapp" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-whatsapp"></i> WhatsApp
          </a>
          <a href={sharing.telegram} className="share-btn telegram" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-telegram"></i> Telegram
          </a>
          <button className="share-btn link" onClick={sharing.copyLink}>
            <i className="fas fa-link"></i> Copy Link
          </button>
        </div>
      </div>

      <div className="instructions">
        <h2><i className="fas fa-info-circle"></i> How to Use</h2>
        <ol>
          <li>Select a date from the calendar</li>
          <li>Enter your daily profit, zakat rate, and any sadaka amount</li>
          <li>Click "Save Data" to store your information</li>
          <li>View your financial summary and charts below</li>
          <li>Use the "Export Data" button to download your records as CSV</li>
          <li>Share this app with others using the share buttons above</li>
        </ol>
        <p><strong>Note:</strong> All data is stored locally in your browser and remains private.</p>
      </div>

      <div className="storage-info">
        <span>Data Storage: <span className="value">Local Storage</span></span>
        <span>Records: <span className="value">{financialData.length}</span></span>
      </div>

      <div className="calendar-section">
        <h2><i className="fas fa-calendar-alt"></i> Select Date</h2>
        <div className="calendar-nav">
          <button onClick={goToPreviousMonth}><i className="fas fa-chevron-left"></i> Previous</button>
          <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={goToNextMonth}>Next <i className="fas fa-chevron-right"></i></button>
        </div>
        <div className="days-grid">
          <div className="day-header">Sun</div>
          <div className="day-header">Mon</div>
          <div className="day-header">Tue</div>
          <div className="day-header">Wed</div>
          <div className="day-header">Thu</div>
          <div className="day-header">Fri</div>
          <div className="day-header">Sat</div>
          {renderCalendar()}
        </div>
      </div>

      <div className="tracker-container">
        <div className="input-section">
          <h2><i className="fas fa-edit"></i> Daily Input</h2>
          <div className="form-group">
            <label htmlFor="selectedDate">Selected Date</label>
            <input
              type="text"
              id="selectedDate"
              value={selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="dailyProfit"><i className="fas fa-rupee-sign"></i> Daily Profit (₹)</label>
            <input
              type="number"
              id="dailyProfit"
              placeholder="Enter daily profit amount"
              value={dailyProfit}
              onChange={(e) => setDailyProfit(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="zakatRate"><i className="fas fa-percentage"></i> Zakat Rate (%)</label>
            <input
              type="number"
              id="zakatRate"
              value={zakatRate}
              step="0.1"
              onChange={(e) => setZakatRate(parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sadakaAmount"><i className="fas fa-hand-holding-heart"></i> Sadaka Amount (₹)</label>
            <input
              type="number"
              id="sadakaAmount"
              placeholder="Enter sadaka amount"
              value={sadakaAmount}
              onChange={(e) => setSadakaAmount(parseFloat(e.target.value))}
            />
          </div>

          <div className="action-buttons">
            <button className="btn-save" onClick={saveData}>
              <i className="fas fa-save"></i> Save Data
            </button>
            <button className="btn-reset" onClick={resetForm}>
              <i className="fas fa-redo"></i> Reset
            </button>
          </div>
        </div>

        <div className="summary-section">
          <h2><i className="fas fa-chart-pie"></i> Financial Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">Total Profit (₹)</div>
              <div className="value">{formatCurrency(totalProfit)}</div>
            </div>
            <div className="summary-item zakat">
              <div className="label">Total Zakat (₹)</div>
              <div className="value">{formatCurrency(totalZakat)}</div>
            </div>
            <div className="summary-item sadaka">
              <div className="label">Total Sadaka (₹)</div>
              <div className="value">{formatCurrency(totalSadaka)}</div>
            </div>
            <div className="summary-item">
              <div className="label">Zakat Rate</div>
              <div className="rate">{zakatRate}%</div>
            </div>
            <div className="summary-item total">
              <div className="label">Net Profit after Zakat & Sadaka (₹)</div>
              <div className="value">{formatCurrency(netProfit)}</div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-export" onClick={exportData}>
              <i className="fas fa-download"></i> Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          {financialData.length > 0 ? (
            <canvas id="profitChart"></canvas>
          ) : (
            <p>No data available for chart</p>
          )}
        </div>
        <div className="chart-container">
          {financialData.length > 0 ? (
            <canvas id="zakatChart"></canvas>
          ) : (
            <p>No data available for chart</p>
          )}
        </div>
      </div>

      <h2><i className="fas fa-table"></i> Monthly Data</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Profit (₹)</th>
              <th>Zakat (₹)</th>
              <th>Sadaka (₹)</th>
              <th>Net Profit (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {financialData
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(item => {
                const date = new Date(item.date);
                return (
                  <tr key={item.date}>
                    <td>{date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>{formatCurrency(item.profit)}</td>
                    <td>{formatCurrency(item.zakat)}</td>
                    <td>{formatCurrency(item.sadaka)}</td>
                    <td>{formatCurrency(item.net)}</td>
                    <td>
                      <button onClick={() => editData(item.date)} style={{padding: '5px 10px', fontSize: '0.8em'}}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => deleteData(item.date)} style={{padding: '5px 10px', fontSize: '0.8em', background: '#e74c3c'}}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <footer>
        <p>© 2023 Profit & Zakat Tracker | Open Source | Data is stored in your browser's local storage</p>
      </footer>

      {notification.show && (
        <div className={`notification ${notification.isSuccess ? '' : 'error'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;