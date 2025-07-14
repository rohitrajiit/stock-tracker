import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, RefreshCw, Database, AlertCircle } from 'lucide-react';

const IndianStockTracker = () => {
  const [stocks, setStocks] = useState([
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2845.50, change: 23.75, changePercent: 0.84, quantity: 10, avgPrice: 2800, prevClose: 2821.75 },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3654.20, change: -45.30, changePercent: -1.22, quantity: 5, avgPrice: 3700, prevClose: 3699.50 },
    { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1789.80, change: 12.45, changePercent: 0.70, quantity: 15, avgPrice: 1750, prevClose: 1777.35 },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', price: 1645.30, change: -8.70, changePercent: -0.53, quantity: 8, avgPrice: 1650, prevClose: 1654.00 },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', price: 1234.65, change: 18.90, changePercent: 1.55, quantity: 12, avgPrice: 1200, prevClose: 1215.75 }
  ]);

  const [newStock, setNewStock] = useState({ symbol: '', quantity: '', avgPrice: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState('demo'); // 'demo' or 'live'
  const [error, setError] = useState('');

  // Available Indian stock symbols with proper NSE format
  const indianStockSymbols = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'ITC.NS', name: 'ITC' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro' },
    { symbol: 'WIPRO.NS', name: 'Wipro' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints' }
  ];

  // Fetch data from Python backend API
  const fetchStockData = async (symbols) => {
    try {
      setIsLoading(true);
      setError('');

      const url = new URL('http://localhost:5001/api/stocks');
      symbols.forEach(symbol => url.searchParams.append('symbols', symbol));

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();

      if (json.success) {
        setStocks(prevStocks => 
          prevStocks.map(stock => {
            const updatedData = json.data.find(d => d.symbol === stock.symbol);
            return updatedData ? { 
              ...stock, 
              price: updatedData.price, 
              change: updatedData.change, 
              changePercent: updatedData.changePercent, 
              prevClose: updatedData.prevClose 
            } : stock;
          })
        );
        setLastUpdated(new Date());
        setDataSource('live');
      } else {
        throw new Error(json.error || 'Failed to fetch data');
      }
    } catch (error) {
      setError('Failed to fetch live data. Using demo data.');
      console.error('Error fetching stock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Auto-refresh data every 5 minutes during market hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;
      
      // Indian market hours: 9:15 AM to 3:30 PM (IST)
      const marketOpen = 9 * 60 + 15; // 9:15 AM
      const marketClose = 15 * 60 + 30; // 3:30 PM
      
      if (currentTime >= marketOpen && currentTime <= marketClose) {
        const symbols = stocks.map(stock => stock.symbol);
        fetchStockData(symbols);
      }
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [stocks]);

  const addStock = () => {
    if (newStock.symbol && newStock.quantity && newStock.avgPrice) {
      const selectedStock = indianStockSymbols.find(s => s.symbol === newStock.symbol);
      const stockName = selectedStock ? selectedStock.name : newStock.symbol.replace('.NS', '') + ' Limited';
      
      const avgPriceNum = parseFloat(newStock.avgPrice);
      const newStockItem = {
        symbol: newStock.symbol,
        name: stockName,
        price: avgPriceNum,
        change: 0,
        changePercent: 0,
        quantity: parseInt(newStock.quantity),
        avgPrice: avgPriceNum,
        prevClose: avgPriceNum
      };

      const updatedStocks = [...stocks, newStockItem];
      setStocks(updatedStocks);
      setNewStock({ symbol: '', quantity: '', avgPrice: '' });
      setShowAddForm(false);
      fetchStockData(updatedStocks.map(stock => stock.symbol));
    }
  };

  const removeStock = (symbol) => {
    setStocks(stocks.filter(stock => stock.symbol !== symbol));
  };

  const refreshData = () => {
    const symbols = stocks.map(stock => stock.symbol);
    fetchStockData(symbols);
  };

  const calculatePortfolioValue = () => {
    return stocks.reduce((total, stock) => total + (stock.price * stock.quantity), 0);
  };

  const calculatePortfolioGainLoss = () => {
    return stocks.reduce((total, stock) => {
      const invested = stock.avgPrice * stock.quantity;
      const current = stock.price * stock.quantity;
      return total + (current - invested);
    }, 0);
  };

  const portfolioValue = calculatePortfolioValue();
  const portfolioGainLoss = calculatePortfolioGainLoss();
  const portfolioGainLossPercent = portfolioValue > 0 ? (portfolioGainLoss / (portfolioValue - portfolioGainLoss)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Indian Stock Tracker</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Data: {dataSource === 'live' ? 'Live' : 'Demo'}
                </span>
              </div>
              <button 
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-700">Portfolio Value</h3>
              <p className="text-2xl font-bold text-green-800">₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            
            <div className={`bg-gradient-to-r ${portfolioGainLoss >= 0 ? 'from-green-100 to-green-200' : 'from-red-100 to-red-200'} p-4 rounded-lg`}>
              <h3 className={`text-sm font-medium ${portfolioGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total P&L</h3>
              <p className={`text-2xl font-bold ${portfolioGainLoss >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                ₹{Math.abs(portfolioGainLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                <span className="text-sm ml-2">({portfolioGainLossPercent.toFixed(2)}%)</span>
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-700">Last Updated</h3>
              <p className="text-lg font-semibold text-blue-800">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Add Stock Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newStock.symbol}
                onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Stock Symbol</option>
                {indianStockSymbols.map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={newStock.quantity}
                onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Average Price"
                value={newStock.avgPrice}
                onChange={(e) => setNewStock({...newStock, avgPrice: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button 
                  onClick={addStock}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add Stock
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Your Stocks</h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Stock
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock, index) => {
                  const totalValue = stock.price * stock.quantity;
                  const totalInvested = stock.avgPrice * stock.quantity;
                  const pnl = totalValue - totalInvested;
                  const pnlPercent = (pnl / totalInvested) * 100;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{stock.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stock.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{stock.avgPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                          <div className="text-xs">({pnlPercent.toFixed(2)}%)</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => removeStock(stock.symbol)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Gainers</h3>
            {stocks
              .filter(stock => stock.changePercent > 0)
              .sort((a, b) => b.changePercent - a.changePercent)
              .slice(0, 3)
              .map((stock, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{stock.symbol}</span>
                  <span className="text-sm font-medium text-green-600">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Losers</h3>
            {stocks
              .filter(stock => stock.changePercent < 0)
              .sort((a, b) => a.changePercent - b.changePercent)
              .slice(0, 3)
              .map((stock, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{stock.symbol}</span>
                  <span className="text-sm font-medium text-red-600">{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndianStockTracker;