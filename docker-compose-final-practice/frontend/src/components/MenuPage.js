import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuAPI } from '../services/api';

const MenuPage = () => {
  const [pizzas, setPizzas] = useState([]);
  const [popularPizzas, setPopularPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [menuResponse, popularResponse] = await Promise.allSettled([
        menuAPI.getMenu(),
        menuAPI.getPopular()
      ]);

      if (menuResponse.status === 'fulfilled') {
        setPizzas(menuResponse.value);
      } else {
        console.error('Failed to load menu:', menuResponse.reason);
        setError('Failed to load galactic menu. Our satellite connection may be disrupted.');
        return;
      }

      if (popularResponse.status === 'fulfilled') {
        setPopularPizzas(popularResponse.value);
      } else {
        console.warn('Failed to load popular items:', popularResponse.reason);
      }

    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Unable to connect to galactic menu service. Please check your connection to the mothership.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (pizza) => {
    const existingItem = cart.find(item => item.id === pizza.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === pizza.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...pizza, quantity: 1 }]);
    }
    
    // Store in localStorage for order page
    localStorage.setItem('galacticCart', JSON.stringify([...cart, { ...pizza, quantity: 1 }]));
  };

  const removeFromCart = (pizzaId) => {
    const newCart = cart.filter(item => item.id !== pizzaId);
    setCart(newCart);
    localStorage.setItem('galacticCart', JSON.stringify(newCart));
  };

  const getCartQuantity = (pizzaId) => {
    const item = cart.find(item => item.id === pizzaId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading galactic menu...</span>
        </div>
        <p className="text-white mt-3">
          <i className="fas fa-satellite me-2"></i>
          Connecting to galactic menu database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="fas fa-exclamation-triangle me-2"></i>
        <strong>Connection Error:</strong> {error}
        <button 
          className="btn btn-outline-danger btn-sm ms-3" 
          onClick={loadMenuData}
        >
          <i className="fas fa-redo me-1"></i>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card text-center py-5">
            <div className="card-body">
              <h1 className="display-4 text-white mb-3">
                <i className="fas fa-pizza-slice me-3"></i>
                Galactic Pizza Menu
                <i className="fas fa-rocket ms-3"></i>
              </h1>
              <p className="lead text-white-75 mb-4">
                The finest intergalactic cuisine, delivered fresh from our space kitchen to your sector
              </p>
              {getTotalItems() > 0 && (
                <Link to="/order" className="btn btn-primary btn-lg">
                  <i className="fas fa-shopping-cart me-2"></i>
                  View Cart ({getTotalItems()} items)
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Pizzas Section */}
      {popularPizzas.length > 0 && (
        <div className="row mb-5">
          <div className="col-12">
            <h2 className="text-white mb-4">
              <i className="fas fa-star me-2"></i>
              Popular in the Galaxy
            </h2>
            <div className="row">
              {popularPizzas.map(pizza => (
                <div key={`popular-${pizza.id}`} className="col-md-6 col-lg-4 mb-4">
                  <div className="card pizza-card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title text-white">
                          {pizza.name}
                          <i className="fas fa-fire text-warning ms-2"></i>
                        </h5>
                        <span className="badge bg-warning text-dark">Popular</span>
                      </div>
                      <p className="card-text text-white-75 small mb-3">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {pizza.galaxy}
                      </p>
                      <p className="card-text text-white-50">{pizza.description}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="h5 text-warning mb-0">{pizza.price} ₵</span>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => addToCart(pizza)}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Pizzas Section */}
      <div className="row">
        <div className="col-12">
          <h2 className="text-white mb-4">
            <i className="fas fa-list me-2"></i>
            Complete Galactic Menu
          </h2>
          {pizzas.length === 0 ? (
            <div className="alert alert-info" role="alert">
              <i className="fas fa-info-circle me-2"></i>
              No pizzas available in this sector. Our galactic chefs are preparing new recipes!
            </div>
          ) : (
            <div className="row">
              {pizzas.map(pizza => (
                <div key={pizza.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card pizza-card h-100">
                    <div className="card-body">
                      <h5 className="card-title text-white">{pizza.name}</h5>
                      <p className="card-text text-white-75 small mb-2">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Origin: {pizza.galaxy}
                      </p>
                      <p className="card-text text-white-50">{pizza.description}</p>
                      
                      {pizza.ingredients && (
                        <div className="mb-3">
                          <small className="text-white-50">Ingredients:</small>
                          <div className="mt-1">
                            {pizza.ingredients.map((ingredient, index) => (
                              <span key={index} className="badge bg-secondary me-1 mb-1">
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 text-warning mb-0">{pizza.price} ₵</span>
                        <div>
                          {getCartQuantity(pizza.id) > 0 && (
                            <button 
                              className="btn btn-outline-light btn-sm me-2"
                              onClick={() => removeFromCart(pizza.id)}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                          )}
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => addToCart(pizza)}
                          >
                            <i className="fas fa-plus me-1"></i>
                            {getCartQuantity(pizza.id) > 0 ? `Add More (${getCartQuantity(pizza.id)})` : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
