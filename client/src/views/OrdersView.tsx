import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API } from "../services/api";

const OrdersView = () => {
  const context: any = useOutletContext();
  const user = context?.user;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437?')) return;
    setCancelling(orderId);
    try {
      await API.orders.cancel(orderId);
      setOrders(orders.map((o: any) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (e: any) {
      alert(e.message || '\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043C\u0435\u043D\u044B \u0437\u0430\u043A\u0430\u0437\u0430');
    }
    setCancelling(null);
  };

  const startEditing = (order: any) => {
    setEditingOrder(order.id);
    setEditItems((order.OrderItems || []).map((item: any) => ({
      id: item.id,
      name: item.Product?.name || item.productName || '',
      sku: item.Product?.sku || item.productSku || '',
      price: item.price,
      quantity: item.quantity,
      unit: item.Product?.unit || '\u0448\u0442',
    })));
    setEditComment(order.comment || '');
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditItems([]);
    setEditComment('');
  };

  const handleEditQuantity = (itemId: number, qty: number) => {
    setEditItems(editItems.map((i) => i.id === itemId ? { ...i, quantity: Math.max(0, qty) } : i));
  };

  const handleRemoveItem = (itemId: number) => {
    setEditItems(editItems.map((i) => i.id === itemId ? { ...i, quantity: 0 } : i));
  };

  const handleSaveEdit = async (orderId: number) => {
    setSaving(true);
    try {
      await API.orders.edit(orderId, {
        items: editItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        comment: editComment,
      });
      // Reload orders
      const data = await API.orders.getAll();
      setOrders(Array.isArray(data) ? data : data.orders || []);
      setEditingOrder(null);
      setEditItems([]);
    } catch (e: any) {
      alert(e.message || '\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F');
    }
    setSaving(false);
  };

  const editTotal = editItems.reduce((sum, i) => sum + i.price * Math.max(0, i.quantity), 0);

  const statusLabels: any = {
    new: '\u041D\u043E\u0432\u044B\u0439', awaiting_contact: '\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u0441\u0432\u044F\u0437\u0438', confirmed: '\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D',
    processing: '\u0412 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435', shipped: '\u041E\u0442\u0433\u0440\u0443\u0436\u0435\u043D', delivered: '\u0414\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D', cancelled: '\u041E\u0442\u043C\u0435\u043D\u0451\u043D',
  };

  const statusColors: any = {
    new: '#D4A853', awaiting_contact: '#FF9800', confirmed: '#2196F3',
    processing: '#673AB7', shipped: '#9C27B0', delivered: '#4CAF50', cancelled: '#F44336',
  };

  const canEdit = (status: string) => ['new', 'awaiting_contact'].includes(status);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="card auth-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>{'\uD83D\uDD12'}</div>
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
          <div className="empty-state-icon">{'\uD83D\uDCC4'}</div>
          <h3>Заказов пока нет</h3>
          <p>Оформите первый заказ в каталоге</p>
          <Link to="/catalog" className="btn btn-primary">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order: any) => (
            <div className="card order-card" key={order.id}>
              <div className="order-card-header" onClick={() => { setExpandedOrder(expandedOrder === order.id ? null : order.id); if (editingOrder === order.id) cancelEditing(); }}>
                <div className="order-card-info">
                  <div className="order-number">{'\u2116'} {order.orderNumber}</div>
                  <div className="order-date">{new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="order-card-status">
                  <span className="badge" style={{background: statusColors[order.status] || '#666', color: '#fff'}}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="order-card-total">
                  <div className="order-total-amount">{formatPrice(order.totalAmount)} {'\u20BD'}</div>
                  <div className="order-items-count">{order.OrderItems?.length || '\u2014'} позиций</div>
                </div>
                <div className="order-expand-icon">{expandedOrder === order.id ? '\u25B2' : '\u25BC'}</div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-card-details">
                  {/* EDIT MODE */}
                  {editingOrder === order.id ? (
                    <div>
                      <div style={{marginBottom: 16, padding: '12px 16px', background: 'rgba(33,150,243,0.06)', borderRadius: 8}}>
                        <strong style={{color: '#2196F3'}}>{'\u270F\uFE0F'} Режим редактирования</strong>
                        <span style={{fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8}}>Измените количество или удалите позиции</span>
                      </div>
                      <table className="order-items-table">
                        <thead>
                          <tr><th>Товар</th><th>Арт.</th><th>Цена</th><th>Кол-во</th><th>Сумма</th><th></th></tr>
                        </thead>
                        <tbody>
                          {editItems.map((item: any) => (
                            <tr key={item.id} style={{opacity: item.quantity <= 0 ? 0.3 : 1}}>
                              <td>{item.name}</td>
                              <td>{item.sku}</td>
                              <td>{formatPrice(item.price)} {'\u20BD'}</td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.quantity}
                                  onChange={(e) => handleEditQuantity(item.id, parseInt(e.target.value) || 0)}
                                  style={{width: 70, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', textAlign: 'center'}}
                                />
                              </td>
                              <td style={{fontWeight: 600}}>{formatPrice(item.price * Math.max(0, item.quantity))} {'\u20BD'}</td>
                              <td>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  style={{background: 'none', border: 'none', color: '#F44336', cursor: 'pointer', fontSize: 16}}
                                  title="Удалить позицию"
                                >{'\u2716'}</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{marginTop: 12}}>
                        <label style={{fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4}}>Комментарий:</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          placeholder="Комментарий к заказу..."
                          style={{fontSize: 13}}
                        />
                      </div>
                      <div className="order-summary-row">
                        <span>Новый итог:</span>
                        <span style={{fontSize: 18, fontWeight: 700, color: 'var(--accent)'}}>{formatPrice(editTotal)} {'\u20BD'}</span>
                      </div>
                      <div style={{marginTop: 12, display: 'flex', gap: 12}}>
                        <button className="btn btn-primary" onClick={() => handleSaveEdit(order.id)} disabled={saving}>
                          {saving ? 'Сохранение...' : '\u2714 Сохранить изменения'}
                        </button>
                        <button className="btn btn-outline" onClick={cancelEditing}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div>
                      {order.comment && (
                        <div style={{marginBottom: 16, padding: '12px 16px', background: 'var(--bg-main)', borderRadius: 8, fontSize: 14}}>
                          <strong>Комментарий:</strong> {order.comment}
                        </div>
                      )}
                      {order.OrderItems && order.OrderItems.length > 0 ? (
                        <table className="order-items-table">
                          <thead>
                            <tr><th>Товар</th><th>Арт.</th><th>Цена</th><th>Кол-во</th><th>Сумма</th></tr>
                          </thead>
                          <tbody>
                            {order.OrderItems.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td>{item.Product?.name || item.productName || '\u2014'}</td>
                                <td>{item.Product?.sku || item.productSku || '\u2014'}</td>
                                <td>{formatPrice(item.price)} {'\u20BD'}</td>
                                <td>{item.quantity} {item.Product?.unit || '\u0448\u0442'}</td>
                                <td style={{fontWeight: 600}}>{formatPrice(item.price * item.quantity)} {'\u20BD'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{color: 'var(--text-light)', fontSize: 14}}>Детали заказа загружаются...</p>
                      )}
                      <div className="order-summary-row">
                        <span>Итого:</span>
                        <span style={{fontSize: 18, fontWeight: 700, color: 'var(--accent)'}}>{formatPrice(order.totalAmount)} {'\u20BD'}</span>
                      </div>
                      {canEdit(order.status) && (
                        <div style={{marginTop: 16, display: 'flex', gap: 12}}>
                          <button className="btn btn-primary" style={{padding: '8px 20px'}} onClick={(e) => { e.stopPropagation(); startEditing(order); }}>
                            {'\u270F\uFE0F'} Изменить заказ
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{color: '#F44336', borderColor: '#F44336', padding: '8px 20px'}}
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelling === order.id}
                          >
                            {cancelling === order.id ? 'Отмена...' : '\u2716 Отменить заказ'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
