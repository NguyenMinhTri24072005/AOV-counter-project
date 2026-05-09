import React, { useState, useEffect, useMemo } from 'react';
import { getItems } from '../services/api';
import './Admin/Admin.css'; 

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ItemsPage = () => {
    const [items, setItems] = useState([]);
    
    // 🌟 STATES CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTier, setSelectedTier] = useState('');
    
    // STATE CHO MODAL CHI TIẾT
    const [viewingItem, setViewingItem] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await getItems();
                setItems(res.data);
            } catch (err) {
                console.error("Lỗi khi tải trang bị:", err);
            }
        };
        fetchItems();
    }, []);

    // 🌟 TRÍCH XUẤT HỆ VÀ CẤP ĐỘ TỪ DỮ LIỆU BẰNG USEMEMO
    const allCategories = useMemo(() => {
        const categories = new Set();
        items.forEach(i => {
            if (i.category) {
                // Hỗ trợ cả trường hợp category là object (đã populate) hoặc string
                categories.add(i.category.name || i.category); 
            }
        });
        return Array.from(categories);
    }, [items]);

    const allTiers = useMemo(() => {
        const tiers = new Set();
        items.forEach(i => {
            if (i.tier) tiers.add(i.tier);
        });
        // Sắp xếp cấp độ tăng dần (1, 2, 3)
        return Array.from(tiers).sort((a, b) => a - b);
    }, [items]);

    // 🌟 LOGIC LỌC ĐA ĐIỀU KIỆN
    const filteredItems = items.filter(i => {
        const matchName = i.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const itemCatName = i.category?.name || i.category;
        const matchCategory = selectedCategory ? itemCatName === selectedCategory : true;
        
        const matchTier = selectedTier ? i.tier?.toString() === selectedTier.toString() : true;

        return matchName && matchCategory && matchTier;
    });

    return (
        <div className="admin-manage-container" style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '50px' }}>
            <h2 className="admin-page-title">⚔️ TỪ ĐIỂN TRANG BỊ ({filteredItems.length})</h2>
            
            {/* 🌟 THANH BỘ LỌC */}
            <div className="filter-bar" style={{ marginBottom: '30px', display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.7)', padding: '15px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Nhập tên trang bị..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="filter-input" 
                    style={{ flex: '2', minWidth: '250px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px' }}
                />
                
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    style={{ flex: '1', minWidth: '150px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }}
                >
                    <option value="">🔮 TẤT CẢ HỆ</option>
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select 
                    value={selectedTier} 
                    onChange={(e) => setSelectedTier(e.target.value)} 
                    style={{ flex: '1', minWidth: '150px', padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }}
                >
                    <option value="">⭐ TẤT CẢ CẤP ĐỘ</option>
                    {allTiers.map(tier => <option key={tier} value={tier}>Cấp {tier}</option>)}
                </select>
            </div>

            {/* LƯỚI TRANG BỊ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div 
                            key={item._id} 
                            onClick={() => setViewingItem(item)} 
                            className="hero-card-clickable"
                            style={{ display: 'flex', gap: '15px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '15px', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                        >
                            <img 
                                src={getImgUrl(item.icon)} 
                                alt={item.name} 
                                style={{ width: '65px', height: '65px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #64748b' }} 
                            />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#f59e0b', fontSize: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {item.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'center' }}>
                                    <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
                                        💰 {item.price}
                                    </span>
                                    {/* 🌟 HIỆN BADGE HỆ VÀ CẤP ĐỘ BÊN CẠNH GIÁ */}
                                    <span style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                        {item.category?.name || item.category || 'Chưa phân hệ'}
                                    </span>
                                    <span style={{ background: '#334155', color: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                        Cấp {item.tier || '?'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                                    {item.passive || 'Không có mô tả'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '16px' }}>
                        Không tìm thấy trang bị nào phù hợp với điều kiện lọc!
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT TRANG BỊ */}
            {viewingItem && (
                <div className="hero-detail-overlay" onClick={() => setViewingItem(null)}>
                    <div className="hero-detail-modal cyber-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <button className="close-modal-btn" onClick={() => setViewingItem(null)}>×</button>
                        
                        <div className="modal-header" style={{ padding: '25px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <img 
                                src={getImgUrl(viewingItem.icon)} 
                                alt="icon" 
                                className="modal-avatar" 
                                style={{ borderRadius: '16px', borderColor: '#f59e0b', width: '90px', height: '90px' }} 
                            />
                            <div>
                                <h2 className="hero-name-large" style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '8px' }}>{viewingItem.name}</h2>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ background: '#78350f', color: '#fcd34d', fontSize: '12px' }}>
                                        💰 {viewingItem.price} Vàng
                                    </span>
                                    <span className="badge" style={{ background: '#1e3a8a', color: '#93c5fd', fontSize: '12px' }}>
                                        🔮 {viewingItem.category?.name || viewingItem.category || 'Khác'}
                                    </span>
                                    <span className="badge" style={{ background: '#475569', color: '#f8fafc', fontSize: '12px' }}>
                                        ⭐ Cấp {viewingItem.tier || '?'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body-scroll" style={{ padding: '25px' }}>
                            <h3 className="section-title" style={{ borderColor: '#f59e0b', color: '#cbd5e1' }}>✨ THUỘC TÍNH & NỘI TẠI</h3>
                            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                                <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-line', margin: 0 }}>
                                    {viewingItem.passive || 'Trang bị này không có mô tả chi tiết.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemsPage;