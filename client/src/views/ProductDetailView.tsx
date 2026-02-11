import React, { useEffect, useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { API, BASE_URL } from "../services/api";

const ProductDetailView = () => {
  const { id } = useParams();
  const context: any = useOutletContext();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await API.products.getById(id || '');
        setProduct(p);
        setQuantity(p.minOrder || 1);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!context?.user) {
      setError("Войдите в систему для добавления товаров в корзину");
      return;
    }
    try {
      await API.cart.add(product.id, quantity);
      setAdded(true);
      if (context.setCartCount) {
        context.setCartCount((prev: number) => prev + 1);
      }
      setTimeout(() => setAdded(false), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  let specs: any = {};
  try {
    if (product?.specs) specs = JSON.parse(product.specs);
  } catch (e) {}

  if (loading) return <div className="loading-spinner"></div>;
  if (!product) return <div className="container"><div className="empty-state"><h3>Товар не найден</h3></div></div>;

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/catalog">Каталог</Link>
        {product.Category && (
          <>
            <span className="breadcrumb-sep">/</span>
            <Link to={`/catalog?categoryId=${product.Category.id}`}>{product.Category.name}</Link>
          </>
        )}
        <span className="breadcrumb-sep">/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail">
        <div className="product-detail-grid">
          <div className="product-detail-image">
            {product.image ? (
              <img src={`${BASE_URL}${product.image}`} alt={product.name} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:12}} />
            ) : (
              <span style={{fontSize:80,opacity:0.2}}>{product.Category?.image || '\uD83D\uDCE6'}</span>
            )}
          </div>
          <div className="product-detail-info">
            {product.Category && (
              <div style={{fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8}}>
                {product.Category.name}
              </div>
            )}
            <h1>{product.name}</h1>
            <div className="product-detail-meta">
              <span>Арт: {product.sku}</span>
              {product.brand && <span>Бренд: {product.brand}</span>}
              <span>{product.stock > 0 ? <span className="badge badge-success">В наличии: {product.stock} {product.unit}</span> : <span className="badge badge-danger">Под заказ</span>}</span>
            </div>

            <div className="product-detail-price-block">
              <div className="product-detail-price">
                {product.displayPrice ? (
                  <><span className="price-from">от </span>{formatPrice(product.displayPrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                ) : (
                  <><span className="price-from">от </span>{formatPrice(product.priceFrom || product.basePrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                )}
              </div>
              <div className="product-detail-min-order">
                Минимальный заказ: {product.minOrder} {product.unit}
              </div>
              {!product.displayPrice && (
                <div style={{marginTop: 8, fontSize: 13, color: 'var(--accent)'}}>
                  &#128274; Войдите для просмотра персональных цен
                </div>
              )}
            </div>

            <div className="product-detail-actions">
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}>-</button>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || 1))} />
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                {added ? '\u2713 Добавлено!' : '\uD83D\uDED2 В корзину'}
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {added && <div className="alert alert-success">Товар добавлен в корзину!</div>}

            {product.description && (
              <div style={{marginTop: 24}}>
                <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--primary-dark)'}}>Описание</h3>
                <p style={{fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7}}>{product.description}</p>
              </div>
            )}

            {Object.keys(specs).length > 0 && (
              <div className="product-specs">
                <h3>Технические характеристики</h3>
                <table>
                  <tbody>
                    {Object.entries(specs).map(([key, value]: [string, any]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td style={{fontWeight: 600}}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {product.weight && (
              <div style={{marginTop: 16, fontSize: 13, color: 'var(--text-secondary)'}}>
                Вес: {product.weight} кг
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
