import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API } from "../services/api";

const CartView = () => {
  const context: any = useOutletContext();
  const [cart, setCart] = useState<any>({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await API.cart.get();
      setCart(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadCart(); }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  const handleUpdateQuantity = async (id: number, qty: number) => {
    if (qty < 1) return;
    try {
      await API.cart.update(id, qty);
      await loadCart();
    } catch (e) {}
  };

  const handleRemove = async (id: number) => {
    try {
      await API.cart.remove(id);
      await loadCart();
      if (context?.setCartCount) context.setCartCount((p: number) => Math.max(0, p - 1));
    } catch (e) {}
  };

  const handleSubmitOrder = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await API.orders.create({ comment });
      setOrderSuccess(result.order);
      if (context?.setCartCount) context.setCartCount(0);
    } catch (e: any) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  if (!context?.user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="card auth-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>&#128274;</div>
            <h2 style={{marginBottom: 12}}>Войдите в систему</h2>
            <p className="text-muted" style={{marginBottom: 24}}>Для работы с корзиной необходима авторизация</p>
            <Link to="/login" className="btn btn-primary">Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="order-success">
        <div className="order-success-icon">&#9989;</div>
        <h1>Заказ оформлен!</h1>
        <div className="order-number">&#8470; {orderSuccess.orderNumber}</div>
        <p>Ваш заказ принят в обработку. Менеджер свяжется с вами в ближайшее время по телефону для подтверждения деталей и оформления оплаты.</p>
        <p style={{marginTop: 16, fontWeight: 600, color: 'var(--primary-dark)'}}>Ожидайте звонка от нашего менеджера</p>
        <p style={{fontSize: 14, color: 'var(--text-light)', marginTop: 8}}>Рабочее время: Пн-Пт 8:00 — 18:00</p>
        <div style={{marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center'}}>
          <Link to="/orders" className="btn btn-primary">Мои заказы</Link>
          <Link to="/catalog" className="btn btn-outline">Продолжить покупки</Link>
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
        <span>Корзина</span>
      </div>

      <div className="cart-page">
        <h1 className="page-title" style={{marginBottom: 24}}>Корзина</h1>

        {cart.items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#128722;</div>
            <h3>Корзина пуста</h3>
            <p>Добавьте товары из каталога для оформления заказа</p>
            <Link to="/catalog" className="btn btn-primary">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              <div className="card">
                {cart.items.map((item: any) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-image">&#128230;</div>
                    <div className="cart-item-info">
                      <h4><Link to={`/product/${item.Product?.id}`}>{item.Product?.name}</Link></h4>
                      <p>Арт: {item.Product?.sku} | {formatPrice(item.unitPrice)} &#8381; / {item.Product?.unit}</p>
                    </div>
                    <div className="quantity-control">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                      <input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)} />
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                      <div className="cart-item-price">{formatPrice(item.totalPrice)} &#8381;</div>
                      <button className="btn btn-icon btn-outline" onClick={() => handleRemove(item.id)} title="Удалить">&#10005;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-summary">
              <div className="card">
                <h3>Итого по заказу</h3>
                <div className="cart-summary-row">
                  <span>Товаров:</span>
                  <span>{cart.count} шт.</span>
                </div>
                <div className="cart-summary-total">
                  <span>Итого:</span>
                  <span>{formatPrice(cart.total)} &#8381;</span>
                </div>

                {cart.total < 50000 && (
                  <div className="cart-min-order-warning">
                    &#9888; Минимальная сумма заказа 50 000 &#8381;. Добавьте товаров ещё на {formatPrice(50000 - cart.total)} &#8381;.
                  </div>
                )}

                <div className="form-group" style={{marginTop: 20}}>
                  <label className="form-label">Комментарий к заказу</label>
                  <textarea className="form-input" rows={3} placeholder="Укажите дополнительные пожелания..." value={comment} onChange={(e) => setComment(e.target.value)} style={{resize: 'vertical'}} />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <button
                  className="btn btn-primary btn-lg"
                  style={{width: '100%', marginTop: 8}}
                  onClick={handleSubmitOrder}
                  disabled={cart.total < 50000 || submitting}
                >
                  {submitting ? 'Оформление...' : 'Подтвердить заказ'}
                </button>

                <p style={{fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 12, lineHeight: 1.6}}>
                  После подтверждения менеджер свяжется с вами по телефону для согласования деталей и оформления оплаты
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartView;
