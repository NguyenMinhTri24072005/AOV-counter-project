import React, { useState, useMemo, useEffect } from 'react';
import './HeroModal.css'; // Tận dụng style của HeroModal

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ItemModal = ({ isOpen, onClose, items, selectedItems, onToggle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [detailItem, setDetailItem] = useState(null);

    // Lấy danh sách các loại trang bị duy nhất
    const allCategories = useMemo(() => {
        const cats = new Set();
        items.forEach(i => {
            if (i.category?.name) cats.add(i.category.name);
        });
        return Array.from(cats);
    }, [items]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setCategoryFilter('');
            setDetailItem(null);
        }
    }, [isOpen]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = categoryFilter ? item.category?.name === categoryFilter : true;
            return matchName && matchCat;
        });
    }, [items, searchTerm, categoryFilter]);

    if (!isOpen) return null;

    return (
        <div className="hero-modal-overlay" onClick={onClose}>
            <div className="hero-modal-content" onClick={e => e.stopPropagation()}>
                <div className="hero-modal-header">
                    <h3>KHO TRANG BỊ CHIẾN THUẬT</h3>
                    <button className="btn-close-modal" onClick={onClose}>&times;</button>
                </div>

                <div className="hero-modal-filters">
                    <input 
                        type="text" 
                        placeholder="🔍 Tìm trang bị..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">TẤT CẢ LOẠI</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="hero-modal-grid">
                    {filteredItems.map(item => (
                        <div 
                            key={item._id} 
                            className={`hero-selection-card ${selectedItems.includes(item._id) ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <div className="avatar-wrapper" onClick={() => onToggle(item._id)}>
                                <img src={getImgUrl(item.icon)} alt={item.name} className="hero-selection-img" />
                            </div>
                            <span className="hero-selection-name">{item.name}</span>
                            <button 
                                className="item-detail-info-btn"
                                onClick={() => setDetailItem(item)}
                                title="Xem chi tiết"
                            >i</button>
                        </div>
                    ))}
                </div>

                {/* Sub-modal hiển thị chi tiết trang bị */}
                {detailItem && (
                    <div className="item-detail-popup">
                        <div className="detail-content-box">
                            <div className="detail-header-pop">
                                <img src={getImgUrl(detailItem.icon)} alt="icon" />
                                <div>
                                    <h4>{detailItem.name}</h4>
                                    <span className="cat-tag">{detailItem.category?.name}</span>
                                </div>
                                <button onClick={() => setDetailItem(null)}>&times;</button>
                            </div>
                            <div className="detail-body-pop">
                                <p><strong>Chỉ số:</strong> {detailItem.stats}</p>
                                <p><strong>Nội tại:</strong> {detailItem.passive}</p>
                                {detailItem.price && <p><strong>Giá:</strong> <span style={{color: '#fbbf24'}}>{detailItem.price} vàng</span></p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemModal;