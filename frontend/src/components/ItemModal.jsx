import React, { useState, useMemo, useEffect } from 'react';
import './ItemModal.css';

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ItemModal = ({ isOpen, onClose, items, selectedItems, onToggle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [detailItem, setDetailItem] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setCategoryFilter('');
            setDetailItem(null);
        }
    }, [isOpen]);

    const categories = useMemo(() => {
        const cats = new Set();
        items.forEach(i => i.category?.name && cats.add(i.category.name));
        return Array.from(cats);
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = categoryFilter ? item.category?.name === categoryFilter : true;
            return matchName && matchCat;
        });
    }, [items, searchTerm, categoryFilter]);

    if (!isOpen) return null;

    return (
        <div className="item-modal-overlay" onClick={onClose}>
            <div className="item-modal-content" onClick={e => e.stopPropagation()}>
                <div className="item-modal-header">
                    <h3>CHỌN TRANG BỊ CHIẾN THUẬT</h3>
                    <button type="button" className="btn-close-modal" onClick={onClose}>&times;</button>
                </div>

                <div className="item-modal-filters">
                    <input type="text" placeholder="🔍 Tìm trang bị..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">TẤT CẢ LOẠI</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="item-modal-grid">
                    {filteredItems.map(item => (
                        <div 
                            key={item._id} 
                            className={`item-selection-card ${selectedItems.includes(item._id) ? 'active' : ''}`}
                            onClick={() => onToggle(item._id)} /* Đã đưa onClick ra ngoài cùng để bấm vào ảnh hay tên đều chọn được */
                        >
                            <div className="item-avatar-wrapper">
                                <img src={getImgUrl(item.icon)} alt="icon" className="item-selection-img" />
                            </div>
                            <span className="item-selection-name">{item.name}</span>
                            
                            <button 
                                type="button" 
                                className="item-info-dot" 
                                onClick={(e) => { 
                                    e.stopPropagation(); // Ngăn sự kiện click chọn trang bị khi đang bấm nút xem chi tiết
                                    setDetailItem(item); 
                                }}
                                title="Xem chi tiết"
                            >
                                i
                            </button>
                        </div>
                    ))}
                </div>

                {detailItem && (
                    <div className="item-mini-detail-pop">
                        <div className="pop-content">
                            <div className="pop-header">
                                <img src={getImgUrl(detailItem.icon)} alt="icon" />
                                <h4>{detailItem.name}</h4>
                                <button type="button" onClick={() => setDetailItem(null)}>&times;</button>
                            </div>
                            <div className="pop-body">
                                <p><strong>Thuộc tính:</strong> {detailItem.stats}</p>
                                <p><strong>Nội tại:</strong> {detailItem.passive}</p>
                                <p><strong>Giá:</strong> <span className="price-text">{detailItem.price} vàng</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemModal;