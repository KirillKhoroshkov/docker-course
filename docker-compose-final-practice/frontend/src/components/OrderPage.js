import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

const OrderPage = () => {
  const [cart, setCart] = useState([]);
  const [orderForm, setOrderForm] = useState({
    userId: '',
    deliveryAddress: {
      galaxy: '',
      sector: '',
      station: ''
    },
    contactInfo: {
      name: '',
      communication: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('galacticCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  const updateQuantity = (pizzaId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(pizzaId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === pizzaId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('galacticCart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (pizzaId) => {
    const updatedCart = cart.filter(item => item.id !== pizzaId);
    setCart(updatedCart);
    localStorage.setItem('galacticCart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = calculateDeliveryFee();
    return subtotal + deliveryFee;
  };

  const calculateDeliveryFee = () => {
    const { galaxy } = orderForm.deliveryAddress;
    const deliveryFees = {
      'Milky Way': 50,
      'Andromeda': 150,
      'Triangulum': 200,
      'Large Magellanic Cloud': 100,
      'Small Magellanic Cloud': 120,
      'Whirlpool': 180,
      'Sombrero': 220,
      'Pinwheel': 160
    };
    return deliveryFees[galaxy] || 100;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('deliveryAddress.')) {
      const field = name.split('.')[1];
      setOrderForm(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [field]: value
        }
      }));
    } else if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setOrderForm(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setOrderForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setError('Your cart is empty. Please add some galactic pizzas first!');
      return;
    }

    if (!orderForm.deliveryAddress.galaxy || !orderForm.deliveryAddress.sector || !orderForm.deliveryAddress.station) {
      setError('Please provide complete delivery coordinates.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const orderData = {
        userId: orderForm.userId || `guest_${Date.now()}`,
        items: cart.map(item => ({
          pizzaId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress: orderForm.deliveryAddress,
        contactInfo: orderForm.contactInfo,
        totalAmount: calculateTotal()
      };

      const result = await orderAPI.createOrder(orderData);
      setOrderResult(result);
      
      // Clear cart after successful order
      setCart([]);
      localStorage.removeItem('galacticCart');
      
    } catch (err) {
      console.error('Order submission failed:', err);
      setError('Failed to submit order. The galactic network might be experiencing solar storms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <i className="fas fa-check-circle text-success" style={{fontSize: '4rem'}}></i>
              </div>
              <h2 className="text-white mb-3">Order Confirmed!</h2>
              <p className="text-white-75 mb-4">
                Your galactic pizza order has been received and is being prepared in our space kitchen.
              </p>
              
              <div className="alert alert-success" role="alert">
                <strong>Order ID:</strong> {orderResult.id}<br/>
                <strong>Status:</strong> {orderResult.status}<br/>
                <strong>Estimated Delivery:</strong> {orderResult.estimatedDelivery || '30-45 parsecs'}
              </div>
              
              <div className="mt-4">
                <a href="/tracking" className="btn btn-primary btn-lg me-3">
                  <i className="fas fa-satellite me-2"></i>
                  Track Your Order
                </a>
                <a href="/" className="btn btn-outline-light">
                  <i className="fas fa-list me-2"></i>
                  Order More Pizza
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card mb-4">
          <div className="card-header">
            <h4 className="text-white mb-0">
              <i className="fas fa-shopping-cart me-2"></i>
              Your Galactic Cart
            </h4>
          </div>
          <div className="card-body">
            {cart.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-shopping-cart text-white-50" style={{fontSize: '3rem'}}></i>
                <p className="text-white-50 mt-3">Your cart is empty</p>
                <a href="/" className="btn btn-primary">
                  <i className="fas fa-list me-2"></i>
                  Browse Menu
                </a>
              </div>
            ) : (
              <div>
                {cart.map(item => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                    <div className="flex-grow-1">
                      <h6 className="text-white mb-1">{item.name}</h6>
                      <small className="text-white-50">{item.galaxy}</small>
                      <div className="text-warning mt-1">{item.price} ₵ each</div>
                    </div>
                    <div className="d-flex align-items-center">
                      <button 
                        className="btn btn-outline-light btn-sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <span className="mx-3 text-white">{item.quantity}</span>
                      <button 
                        className="btn btn-outline-light btn-sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm ms-3"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Form */}
        {cart.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h4 className="text-white mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                Delivery Information
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmitOrder}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-white">Contact Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="contactInfo.name"
                      value={orderForm.contactInfo.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Captain Kirk"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-white">Communication Channel</label>
                    <input
                      type="text"
                      className="form-control"
                      name="contactInfo.communication"
                      value={orderForm.contactInfo.communication}
                      onChange={handleInputChange}
                      required
                      placeholder="subspace@enterprise.starfleet"
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label text-white">Galaxy</label>
                    <select
                      className="form-select"
                      name="deliveryAddress.galaxy"
                      value={orderForm.deliveryAddress.galaxy}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Galaxy</option>
                      <option value="Milky Way">Milky Way</option>
                      <option value="Andromeda">Andromeda</option>
                      <option value="Triangulum">Triangulum</option>
                      <option value="Large Magellanic Cloud">Large Magellanic Cloud</option>
                      <option value="Small Magellanic Cloud">Small Magellanic Cloud</option>
                      <option value="Whirlpool">Whirlpool</option>
                      <option value="Sombrero">Sombrero</option>
                      <option value="Pinwheel">Pinwheel</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white">Sector</label>
                    <input
                      type="text"
                      className="form-control"
                      name="deliveryAddress.sector"
                      value={orderForm.deliveryAddress.sector}
                      onChange={handleInputChange}
                      required
                      placeholder="Alpha-7"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white">Space Station</label>
                    <input
                      type="text"
                      className="form-control"
                      name="deliveryAddress.station"
                      value={orderForm.deliveryAddress.station}
                      onChange={handleInputChange}
                      required
                      placeholder="Deep Space 9"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Transmitting Order...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket me-2"></i>
                      Launch Order to Space Kitchen
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="col-lg-4">
        <div className="card position-sticky" style={{top: '100px'}}>
          <div className="card-header">
            <h5 className="text-white mb-0">
              <i className="fas fa-receipt me-2"></i>
              Order Summary
            </h5>
          </div>
          <div className="card-body">
            {cart.length === 0 ? (
              <p className="text-white-50">No items in cart</p>
            ) : (
              <div>
                {cart.map(item => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span className="text-white-75">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-warning">{item.price * item.quantity} ₵</span>
                  </div>
                ))}
                
                <hr className="border-secondary" />
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-75">Subtotal:</span>
                  <span className="text-warning">
                    {cart.reduce((total, item) => total + (item.price * item.quantity), 0)} ₵
                  </span>
                </div>
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-75">
                    Hyperspace Delivery:
                    {orderForm.deliveryAddress.galaxy && (
                      <small className="d-block text-white-50">
                        to {orderForm.deliveryAddress.galaxy}
                      </small>
                    )}
                  </span>
                  <span className="text-warning">{calculateDeliveryFee()} ₵</span>
                </div>
                
                <hr className="border-secondary" />
                
                <div className="d-flex justify-content-between">
                  <strong className="text-white">Total:</strong>
                  <strong className="text-warning h5">{calculateTotal()} ₵</strong>
                </div>
                
                <small className="text-white-50 mt-2 d-block">
                  <i className="fas fa-info-circle me-1"></i>
                  Estimated delivery: 30-45 parsecs
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
