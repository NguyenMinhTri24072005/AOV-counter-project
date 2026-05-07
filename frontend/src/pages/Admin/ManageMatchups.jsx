import React, { useState, useEffect, useContext } from 'react';
import { getHeroes, getItems, getCounters, createMatchup, deleteMatchup } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import HeroSelect from '../../components/HeroSelect';
import ItemModal from '../../components/ItemModal';
import './Admin.css';

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=None';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ManageMatchups = () => {
    const { user } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [matchups, setMatchups] = useState([]);
    const [viewMode, setViewMode] = useState('personal'); // Mặc định hiển thị kèo Cá nhân
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        enemyHeroId: '',
        heroId: '',
        score: 5,
        note: '',
        counterItems: []
    });

    useEffect(() => {
        if (user) {
            loadData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            // Lấy toàn bộ dữ liệu ở chế độ pro
            const [hRes, iRes, mRes] = await Promise.all([
                getHeroes(), getItems(), getCounters([], [], 'pro', user?.id)
            ]);
            setHeroes(hRes.data);
            setItems(iRes.data);
            setMatchups(mRes.data);
        } catch (err) { 
            console.error(err); 
        }
    };

    const handleToggleItem = (itemId) => {
        setFormData(prev => ({
            ...prev,
            counterItems: prev.counterItems.includes(itemId)
                ? prev.counterItems.filter(id => id !== itemId)
                : [...prev.counterItems, itemId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Đính kèm ID của user đang đăng nhập làm author
            const payload = { ...formData, author: user?.id };
            await createMatchup(payload);
            alert("Đã tạo chiến thuật mới!");
            setFormData({ enemyHeroId: '', heroId: '', score: 5, note: '', counterItems: [] });
            loadData();
        } catch (err) { 
            alert(err.response?.data?.message || "Lỗi tạo kèo"); 
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (!window.confirm("Xác nhận xóa chiến thuật này?")) return;
        try {
            await deleteMatchup(id);
            loadData();
        } catch (err) { 
            alert("Lỗi khi xóa"); 
        }
    };

    // LOGIC LỌC DỮ LIỆU DỰA TRÊN NÚT GẠT (View Mode)
    // matchups trả về cấu trúc [{ hero: {...}, matchupDetails: [...] }]
    const filteredResults = matchups.map(group => ({
        ...group,
        matchupDetails: group.matchupDetails.filter(d => {
            const authorId = d.authorId || d.author?._id || d.author;
            // Nếu viewMode là 'personal', so sánh với user đang đăng nhập
            // Nếu viewMode là 'system', lọc dựa trên cờ isSystem
            return viewMode === 'personal' ? authorId === user?.id : d.isSystem;
        })
    })).filter(group => group.matchupDetails.length > 0);

    return (
        <div className="admin-manage-container">
            <h2 className="admin-page-title">⚔️ QUẢN LÝ CHIẾN THUẬT KHẮC CHẾ</h2>

            <section className="admin-form-section">
                <h3>THÊM CHIẾN THUẬT MỚI</h3>
                <form onSubmit={handleSubmit} className="matchup-creation-form admin-form">
                    <div className="form-row-grid">
                        <div className="form-col">
                            <HeroSelect label="TƯỚNG ĐỐI THỦ (BỊ KHẮC CHẾ):" heroes={heroes} 
                                selectedHeroId={formData.enemyHeroId} onChange={id => setFormData({...formData, enemyHeroId: id})} />
                        </div>
                        <div className="form-col">
                            <HeroSelect label="TƯỚNG CỦA BẠN (KHẮC CHẾ):" heroes={heroes} 
                                selectedHeroId={formData.heroId} onChange={id => setFormData({...formData, heroId: id})} />
                        </div>
                        <div className="form-col">
                            <label className="hero-select-label">ĐIỂM KHẮC CHẾ (1-10):</label>
                            <input type="number" min="1" max="10" value={formData.score} 
                                onChange={e => setFormData({...formData, score: e.target.value})} 
                                style={{ width: '100%', padding: '10px' }}
                            />
                        </div>
                    </div>
                    
                    <div className="input-group" style={{ marginTop: '15px' }}>
                        <label>GHI CHÚ CHIẾN THUẬT:</label>
                        <textarea value={formData.note} required
                            onChange={e => setFormData({...formData, note: e.target.value})} 
                            placeholder="Mô tả cách khắc chế..." 
                            className="form-textarea"
                        />
                    </div>

                    <div className="item-selection-preview" style={{ marginTop: '15px' }}>
                        <label>TRANG BỊ KHẮC CHẾ ({formData.counterItems.length}):</label>
                        <div className="selected-items-list" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button type="button" className="btn-open-item-modal" onClick={() => setIsItemModalOpen(true)}>
                                ➕ Chọn Trang Bị
                            </button>
                            <div className="mini-item-list" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {formData.counterItems.map(itemId => {
                                    const it = items.find(i => i._id === itemId);
                                    return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} style={{ width: '35px', height: '35px', borderRadius: '5px', objectFit: 'cover' }} />;
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button type="submit" className="btn-cyber btn-submit">LƯU CHIẾN THUẬT</button>
                    </div>
                </form>
            </section>

            {/* THANH ĐIỀU HƯỚNG CÁ NHÂN / HỆ THỐNG */}
            <div className="source-toggle-bar">
                <button 
                    className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} 
                    onClick={() => setViewMode('personal')}
                >
                    🛡️ KÈO CỦA TÔI
                </button>
                <button 
                    className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} 
                    onClick={() => setViewMode('system')}
                >
                    🤖 KÈO HỆ THỐNG
                </button>
            </div>

            {/* DANH SÁCH HIỂN THỊ DẠNG CARD */}
            <section className="admin-list-section">
                <div className="matchup-cards-grid">
                    {filteredResults.length > 0 ? (
                        filteredResults.map(group => (
                            <div key={group.hero._id} className="matchup-admin-card">
                                {/* Phần Header: Tướng Khắc Chế */}
                                <div className="card-top">
                                    <div className="hero-meta">
                                        <img src={getImgUrl(group.hero.avatar)} alt="hero" className="main-hero-img" />
                                        <div className="hero-meta-info">
                                            <h4 style={{ margin: '0 0 5px 0' }}>{group.hero.name}</h4>
                                            <span className="score-label">Trung bình: {group.totalScore}đ</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Phần Body: Tướng Bị Khắc Chế (Enemy) */}
                                <div className="card-details">
                                    {group.matchupDetails.map((d, idx) => {
                                        const enemyHero = heroes.find(h => h._id === d.enemyId);
                                        return (
                                            <div key={idx} className="detail-item-box">
                                                <div className="detail-item-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div className="enemy-info-mini" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Khắc chế:</span>
                                                        <img src={getImgUrl(enemyHero?.avatar)} alt="enemy" style={{ width: '25px', height: '25px', borderRadius: '50%' }} />
                                                        <strong style={{ color: '#ef4444' }}>{enemyHero?.name}</strong>
                                                    </div>
                                                    {/* Nhờ bạn đã có d._id từ Backend, nút xóa sẽ hoạt động hoàn hảo */}
                                                    <button className="btn-del-mini" onClick={() => handleDelete(d._id)} title="Xóa">
                                                        🗑️
                                                    </button>
                                                </div>
                                                <p className="note-text" style={{ fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1', marginTop: '5px' }}>
                                                    "{d.note}"
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-msg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <p>Chưa có dữ liệu chiến thuật nào trong mục này.</p>
                        </div>
                    )}
                </div>
            </section>

            <ItemModal 
                isOpen={isItemModalOpen} 
                onClose={() => setIsItemModalOpen(false)} 
                items={items} 
                selectedItems={formData.counterItems} 
                onToggle={handleToggleItem} 
            />
        </div>
    );
};

export default ManageMatchups;