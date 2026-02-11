import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API } from "../services/api";

const OrdersView = () => {
  const context: any = useOutletContext();
  const user = context?.user;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await API.orders.getAll();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (e) {}
      setLoading(false);
    };
    if (user) load();
    else setLoading(false);
  }, [user]);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  const statusLabels: any = {
    new: 'Новый', confirmed: 'Подтверждён', processing: 'В обработке',
    shipped: 'Отгружен', delivered: 'Доставлен', cancelled: 'Отменён',
  };

  const statusColors: any = {
    new: '#D4A853', confirmed: '#2196F3', processing: '#FF9800',
    shipped: '#9C27B0', delivered: '#4CAF50', cancelled: '#F44336',
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="card auth-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>&#128274;</div>
            <h2 style={{marginBottom: 12}}>Войдите в систему</h2>
            <p className="text-muted" style={{marginBottom: 24}}>Для просмотра заказов необходима авторизация</p>
            <Link to="/login" className="btn btn-primary">Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Мои заказы</span>
      </div>

      <h1 className="page-title" style={{marginBottom: 24}}>Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#128196;</div>
          <h3>Заказов пока нет</h3>
          <p>Оформите первый заказ в каталоге</p>
          <Link to="/catalog" className="btn btn-primary">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order: any) => (
            <div className="card order-card" key={order.id}>
              <div className="order-card-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <div className="order-card-info">
                  <div className="order-number">&#8470; {order.orderNumber}</div>
                  <div className="order-date">{new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="order-card-status">
                  <span className="badge" style={{background: statusColors[order.status] || '#666', color: '#fff'}}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="order-card-total">
                  <div className="order-total-amount">{formatPrice(order.totalAmount)} &#8381;</div>
                  <div className="order-items-count">{order.itemsCount || '—'} позиций</div>
                </div>
                <div className="order-expand-icon">{expandedOrder === order.id ? '&#9650;' : '&#9660;'}</div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-card-details">
                  {order.comment && (
                    <div style={{marginBottom: 16, padding: '12px 16px', background: 'var(--bg-main)', borderRadius: 8, fontSize: 14}}>
                      <strong>Комментарий:</strong> {order.comment}
                    </div>
                  )}
                  {order.OrderItems && order.OrderItems.length > 0 ? (
                    <table className="order-items-table">
                      <thead>
                        <tr>
                          <th>Товар</th>
                          <th>Арт.</th>
                          <th>Цена</th>
                          <th>Кол-во</th>
                          <th>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.OrderItems.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td>{item.Product?.name || item.productName || '—'}</td>
                            <td>{item.Product?.sku || item.sku || '—'}</td>
                            <td>{formatPrice(item.unitPrice)} &#8381;</td>
                            <td>{item.quantity} {item.Product?.unit || 'шт'}</td>
                            <td style={{fontWeight: 600}}>{formatPrice(item.totalPrice)} &#8381;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{color: 'var(--text-light)', fontSize: 14}}>Детали заказа загружаются...</p>
                  )}
                  <div className="order-summary-row">
                    <span>Итого:</span>
                    <span style={{fontSize: 18, fontWeight: 700, color: 'var(--accent)'}}>{formatPrice(order.totalAmount)} &#8381;</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersView;
