import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MenuPage from './components/MenuPage';
import OrderPage from './components/OrderPage';
import TrackingPage from './components/TrackingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <i className="fas fa-pizza-slice me-2"></i>
              Galactic Pizza
              <i className="fas fa-rocket ms-2"></i>
            </Link>
            
            <button 
              className="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    <i className="fas fa-list me-1"></i>
                    Menu
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/order">
                    <i className="fas fa-shopping-cart me-1"></i>
                    Order
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/tracking">
                    <i className="fas fa-satellite me-1"></i>
                    Track Order
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container my-4">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-5 py-4 text-center text-white">
          <div className="container">
            <p className="mb-0">
              <i className="fas fa-satellite-dish me-2"></i>
              Galactic Pizza - Delivering across the universe since 2387
              <i className="fas fa-satellite-dish ms-2"></i>
            </p>
            <small className="text-white-50">
              Hyperspace delivery in 30 parsecs or less!
            </small>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
