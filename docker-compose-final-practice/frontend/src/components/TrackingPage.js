import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

const TrackingPage = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = () => {
    try {
      const recentOrders = localStorage.getItem('recentOrders');
      if (recentOrders) {
        setUserOrders(JSON.parse(recentOrders));
      }
    } catch (err) {
      console.error('Error loading recent orders:', err);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orderData = await orderAPI.getOrder(orderId.trim());
      setOrder(orderData);
      
      // Save to recent orders
      const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
      const updatedOrders = [orderData, ...recentOrders.filter(o => o.id !== orderData.id)].slice(0, 5);
      localStorage.setItem('recentOrders', JSON.stringify(updatedOrders));
      setUserOrders(updatedOrders);
      
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Order not found or connection failed. Please check your order ID and try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'pending': 'fas fa-clock text-warning',
      'preparing': 'fas fa-fire text-orange',
      'ready': 'fas fa-check text-success',
      'in_transit': 'fas fa-rocket text-info',
      'delivered': 'fas fa-check-circle text-success',
      'cancelled': 'fas fa-times-circle text-danger'
    };
    return statusIcons[status] || 'fas fa-question-circle text-secondary';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': 'Order Received',
      'preparing': 'Pizza Being Prepared in Space Kitchen',
      'ready': 'Ready for Hyperspace Launch',
      'in_transit': 'En Route Through Hyperspace',
      'delivered': 'Delivered Successfully',
      'cancelled': 'Order Cancelled'
    };
    return statusTexts[status] || 'Unknown Status';
  };

  const getDeliveryProgress = (status) => {
    const progressMap = {
      'pending': 20,
      'preparing': 40,
      'ready': 60,
      'in_transit': 80,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Track Order Form */}
        <div className="card mb-4">
          <div className="card-header">
            <h4 className="text-white mb-0">
              <i className="fas fa-satellite me-2"></i>
              Track Your Galactic Order
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleTrackOrder}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label text-white">Order ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID (e.g., ORDER_123456789)"
                    required
                  />
                  <small className="text-white-50">
                    You can find your order ID in the confirmation message
                  </small>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Track Order
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Recent Orders */}
        {userOrders.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="text-white mb-0">
                <i className="fas fa-history me-2"></i>
                Recent Orders
              </h5>
            </div>
            <div className="card-body">
              {userOrders.map((recentOrder, index) => (
                <div 
                  key={recentOrder.id || index} 
                  className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary"
                >
                  <div>
                    <span className="text-white">Order #{recentOrder.id}</span>
                    <small className="text-white-50 d-block">
                      {formatDateTime(recentOrder.createdAt)}
                    </small>
                  </div>
                  <div className="text-end">
                    <span className={`badge bg-${recentOrder.status === 'delivered' ? 'success' : 'warning'}`}>
                      {getStatusText(recentOrder.status)}
                    </span>
                    <button 
                      className="btn btn-outline-light btn-sm ms-2"
                      onClick={() => {
                        setOrderId(recentOrder.id);
                        setOrder(recentOrder);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="text-white mb-0">
                  <i className="fas fa-receipt me-2"></i>
                  Order #{order.id}
                </h5>
                <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'} fs-6`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
            <div className="card-body">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-white">Delivery Progress</span>
                  <span className="text-warning">{getDeliveryProgress(order.status)}%</span>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{width: `${getDeliveryProgress(order.status)}%`}}
                  ></div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mb-4">
                <h6 className="text-white mb-3">Status Timeline</h6>
                <div className="row">
                  {['pending', 'preparing', 'ready', 'in_transit', 'delivered'].map((status, index) => (
                    <div key={status} className="col text-center">
                      <div className={`mb-2 ${order.status === status || (['pending', 'preparing', 'ready', 'in_transit'].indexOf(order.status) > index) ? 'text-primary' : 'text-white-50'}`}>
                        <i className={getStatusIcon(status)} style={{fontSize: '1.5rem'}}></i>
                      </div>
                      <small className={order.status === status ? 'text-white' : 'text-white-50'}>
                        {getStatusText(status).split(' ')[0]}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-white mb-3">Order Information</h6>
                  <p className="text-white-75 mb-2">
                    <i className="fas fa-calendar me-2"></i>
                    Order Date: {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-white-75 mb-2">
                    <i className="fas fa-coins me-2"></i>
                    Total Amount: {order.totalAmount || 0} ₵
                  </p>
                  <p className="text-white-75 mb-2">
                    <i className="fas fa-clock me-2"></i>
                    Estimated Delivery: {order.estimatedDelivery || '30-45 parsecs'}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-white mb-3">Delivery Address</h6>
                  {order.deliveryAddress ? (
                    <div>
                      <p className="text-white-75 mb-1">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        {order.deliveryAddress.galaxy}
                      </p>
                      <p className="text-white-50 mb-1">
                        Sector: {order.deliveryAddress.sector}
                      </p>
                      <p className="text-white-50 mb-1">
                        Station: {order.deliveryAddress.station}
                      </p>
                    </div>
                  ) : (
                    <p className="text-white-50">Address information not available</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mt-4">
                  <h6 className="text-white mb-3">Ordered Items</h6>
                  <div className="table-responsive">
                    <table className="table table-dark">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name || `Pizza #${item.pizzaId}`}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price} ₵</td>
                            <td>{(item.price * item.quantity)} ₵</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 text-center">
                {order.status === 'delivered' ? (
                  <div className="alert alert-success" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    Your galactic pizza has been delivered successfully! We hope you enjoyed your meal.
                  </div>
                ) : order.status === 'cancelled' ? (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-times-circle me-2"></i>
                    This order has been cancelled. If you have any questions, please contact our support team.
                  </div>
                ) : (
                  <div className="alert alert-info" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    Your order is being processed. We'll update you as it progresses through our galactic delivery network.
                  </div>
                )}
                
                <button 
                  className="btn btn-primary me-3"
                  onClick={() => handleTrackOrder({preventDefault: () => {}})}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh Status
                </button>
                <a href="/" className="btn btn-outline-light">
                  <i className="fas fa-list me-2"></i>
                  Order More
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!order && !loading && (
          <div className="text-center py-5">
            <i className="fas fa-satellite text-white-50" style={{fontSize: '4rem'}}></i>
            <p className="text-white-75 mt-3 mb-0">
              Enter your order ID above to track your galactic pizza delivery
            </p>
            <small className="text-white-50">
              Real-time tracking across all galaxies
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
