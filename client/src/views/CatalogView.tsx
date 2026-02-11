import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API, BASE_URL } from "../services/api";

const CatalogView = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryId = searchParams.get('categoryId');
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const cats = await API.categories.getAll();
        setCategories(cats);
        const params: any = { limit: 50 };
        if (categoryId) params.categoryId = categoryId;
        if (searchQuery) params.search = searchQuery;
        const result = await API.products.getAll(params);
        setProducts(result.products || []);
        setTotal(result.total || 0);
        setSelectedCategory(categoryId);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [categoryId, searchQuery]);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  const currentCategory = categories.find((c: any) => String(c.id) === selectedCategory);

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Каталог</span>
        {currentCategory && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span>{currentCategory.name}</span>
          </>
        )}
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="card">
            <h3>Категории</h3>
            <div className="catalog-filter-group">
              <Link to="/catalog">
                <div className={`catalog-filter-item ${!selectedCategory ? 'active' : ''}`}>
                  Все категории
                </div>
              </Link>
              {categories.map((cat: any) => (
                <Link to={`/catalog?categoryId=${cat.id}`} key={cat.id}>
                  <div className={`catalog-filter-item ${selectedCategory === String(cat.id) ? 'active' : ''}`}>
                    {cat.image} {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="catalog-content">
          <div className="catalog-header">
            <h1 className="page-title">
              {searchQuery ? `Поиск: "${searchQuery}"` : currentCategory ? currentCategory.name : 'Каталог'}
            </h1>
            <span className="catalog-count">Найдено: {total} товаров</span>
          </div>

          {searchQuery && (
            <div className="b2b-banner" style={{marginBottom: 24}}>
              <div className="b2b-banner-icon">&#128269;</div>
              <div>
                <h4>Результаты поиска по запросу: "{searchQuery}"</h4>
                <p>Найдено {total} товаров. Для уточнения результатов используйте фильтры категорий.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-spinner"></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">&#128270;</div>
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить параметры поиска или выбрать другую категорию</p>
              <Link to="/catalog" className="btn btn-primary">Все товары</Link>
            </div>
          ) : (
            <div className="catalog-grid">
              {products.map((product: any) => (
                <Link to={`/product/${product.id}`} key={product.id}>
                  <div className="card product-card">
                    <div className="product-card-image">
                      {product.stock > 0 ? (
                        <span className="product-card-badge badge badge-success">В наличии</span>
                      ) : (
                        <span className="product-card-badge badge badge-danger">Под заказ</span>
                      )}
                      {product.image ? (
                        <img src={`${BASE_URL}${product.image}`} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      ) : (
                        <span style={{fontSize:48,opacity:0.3}}>{product.Category?.image || '\uD83D\uDCE6'}</span>
                      )}
                    </div>
                    <div className="product-card-body">
                      {product.Category && (
                        <div className="product-card-category">{product.Category.name}</div>
                      )}
                      <div className="product-card-title">{product.name}</div>
                      <div className="product-card-sku">Арт: {product.sku} | Бренд: {product.brand}</div>
                      <div className="product-card-footer">
                        <div className="product-card-price">
                          {product.displayPrice ? (
                            <><span className="product-card-price-from">от </span>{formatPrice(product.displayPrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                          ) : (
                            <><span className="product-card-price-from">от </span>{formatPrice(product.priceFrom || product.basePrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogView;
