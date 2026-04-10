import React, { useState, useEffect } from 'react';

const ProductBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Product ads using local images from public folder
  const productAds = [
    {
      id: 1,
      title: "Fresh Products",
      description: "Quality items from local sellers",
      image: "/images/banner1.jpg",
      price: "From K25",
      shopName: "TULI Marketplace"
    },
    {
      id: 2,
      title: "Featured Items",
      description: "Discover amazing deals today",
      image: "/images/banner2.jpg",
      price: "From K50",
      shopName: "Top Sellers"
    },
    {
      id: 3,
      title: "Popular Products",
      description: "Best selling items this week",
      image: "/images/banner3.jpg",
      price: "From K80",
      shopName: "Trending Now"
    },
    {
      id: 4,
      title: "Special Offers",
      description: "Limited time deals and discounts",
      image: "/images/banner4.jpg",
      price: "From K30",
      shopName: "Daily Deals"
    },
    {
      id: 5,
      title: "New Arrivals",
      description: "Latest products from our sellers",
      image: "/images/banner5.jpg",
      price: "From K100",
      shopName: "Fresh Stock"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % productAds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [productAds.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % productAds.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + productAds.length) % productAds.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="product-banner">
      {/* Slides Container */}
      <div style={{
        display: 'flex',
        width: `${productAds.length * 100}%`,
        height: '100%',
        transform: `translateX(-${currentSlide * (100 / productAds.length)}%)`,
        transition: 'transform 0.5s ease-in-out'
      }}>
        {productAds.map((product, index) => (
          <div key={product.id} className="product-banner-slide" style={{
            width: `${100 / productAds.length}%`,
            backgroundImage: `url(${product.image})`
          }}>
            {/* Overlay */}
            <div className="product-banner-overlay" />
            
            {/* Content */}
            <div className="product-banner-content">
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  background: '#F39C12',
                  color: '#1B4332',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {product.shopName}
                </span>
              </div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 8px 0',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {product.title}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                margin: '0 0 12px 0',
                opacity: '0.9'
              }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#FFD966'
                }}>
                  {product.price}
                </span>
                <button style={{
                  background: '#F39C12',
                  color: '#1B4332',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '25px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem'
                }}>
                  Shop Now →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button onClick={prevSlide} className="product-banner-nav prev">
        ‹
      </button>

      <button onClick={nextSlide} className="product-banner-nav next">
        ›
      </button>

      {/* Dots Indicator */}
      <div className="product-banner-dots">
        {productAds.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`product-banner-dot ${currentSlide === index ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductBanner;