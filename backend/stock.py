import yfinance as yf
import pandas as pd
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Available Indian stock symbols
INDIAN_STOCKS = {
    'RELIANCE.NS': 'Reliance Industries',
    'TCS.NS': 'Tata Consultancy Services',
    'HDFCBANK.NS': 'HDFC Bank',
    'INFY.NS': 'Infosys',
    'ICICIBANK.NS': 'ICICI Bank',
    'BHARTIARTL.NS': 'Bharti Airtel',
    'ITC.NS': 'ITC',
    'HINDUNILVR.NS': 'Hindustan Unilever',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank',
    'SBIN.NS': 'State Bank of India',
    'LT.NS': 'Larsen & Toubro',
    'WIPRO.NS': 'Wipro',
    'MARUTI.NS': 'Maruti Suzuki',
    'BAJFINANCE.NS': 'Bajaj Finance',
    'ASIANPAINT.NS': 'Asian Paints'
}

def fetch_stock_data(symbols):
    """Fetch stock data using yfinance"""
    data = []
    for symbol in symbols:
        try:
            stock = yf.Ticker(symbol)
            
            # Get current data
            info = stock.info
            hist = stock.history(period='2d')
            
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
                prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                
                change = current_price - prev_close
                change_percent = (change / prev_close) * 100 if prev_close != 0 else 0
                
                data.append({
                    'symbol': symbol,
                    'name': INDIAN_STOCKS.get(symbol, symbol.replace('.NS', '')),
                    'price': round(current_price, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2),
                    'prevClose': round(prev_close, 2),
                    'volume': int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                    'timestamp': datetime.now().isoformat()
                })
                
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            # Return placeholder data if fetch fails
            data.append({
                'symbol': symbol,
                'name': INDIAN_STOCKS.get(symbol, symbol.replace('.NS', '')),
                'price': 0,
                'change': 0,
                'changePercent': 0,
                'prevClose': 0,
                'volume': 0,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            })
    
    return data

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    """Get stock data for requested symbols"""
    symbols = request.args.getlist('symbols')
    
    if not symbols:
        # Return default stocks if no symbols specified
        symbols = list(INDIAN_STOCKS.keys())[:10]
    
    try:
        stock_data = fetch_stock_data(symbols)
        return jsonify({
            'success': True,
            'data': stock_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    """Search for available Indian stocks"""
    query = request.args.get('query', '').upper()
    
    if not query:
        return jsonify({
            'success': True,
            'data': [{'symbol': k, 'name': v} for k, v in INDIAN_STOCKS.items()]
        })
    
    filtered_stocks = [
        {'symbol': k, 'name': v} 
        for k, v in INDIAN_STOCKS.items() 
        if query in k.upper() or query in v.upper()
    ]
    
    return jsonify({
        'success': True,
        'data': filtered_stocks
    })

@app.route('/api/stocks/daily-save', methods=['POST'])
def save_daily_data():
    """Save daily stock data to CSV (based on original stock.py logic)"""
    try:
        symbols = request.json.get('symbols', list(INDIAN_STOCKS.keys()))
        
        # Fetch data
        data = []
        today = datetime.now().strftime('%Y-%m-%d')
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period='1d')
                if not hist.empty:
                    close = hist['Close'].iloc[-1]
                    data.append({
                        'Date': today, 
                        'Symbol': symbol, 
                        'Close': round(close, 2)
                    })
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        if not df.empty:
            csv_file = 'indian_stocks_daily.csv'
            
            try:
                # Load existing data if file exists
                existing_df = pd.read_csv(csv_file)
                # Append new data and remove duplicates
                combined_df = pd.concat([existing_df, df]).drop_duplicates(
                    subset=['Date', 'Symbol'], keep='last'
                )
                combined_df.to_csv(csv_file, index=False)
            except FileNotFoundError:
                # Create new file if it doesn't exist
                df.to_csv(csv_file, index=False)
            
            return jsonify({
                'success': True,
                'message': f'Daily data saved for {len(data)} stocks',
                'data': data
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No data to save'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Indian Stock Tracker API is running',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Indian Stock Tracker API...")
    print("Available endpoints:")
    print("  GET /api/stocks - Get stock data")
    print("  GET /api/stocks/search - Search stocks")
    print("  POST /api/stocks/daily-save - Save daily data to CSV")
    print("  GET /api/health - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
