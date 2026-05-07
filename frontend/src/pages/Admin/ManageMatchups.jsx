import React, { useState, useEffect } from 'react';
import { getHeroes, getItems, getCounters, createMatchup, deleteMatchup } from '../../services/api';
import HeroSelect from '../../components/HeroSelect';
import ItemModal from '../../components/ItemModal';
import './Admin.css';

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=None';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ManageMatchups = () => {
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [matchups, setMatchups] = useState([]);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        enemyHeroId: '',
        heroId: '',
        score: 5,
        note: '',
        counterItems: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [hRes, iRes, mRes] = await Promise.all([
                getHeroes(), getItems(), getCounters([], [], 'pro')
            ]);
            setHeroes(hRes.data);
            setItems(iRes.data);
            setMatchups(mRes.data);
        } catch (err) { console.error(err); }
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
            await createMatchup(formData);
            alert("Đã tạo kèo khắc chế mới!");
            setFormData({ enemyHeroId: '', heroId: '', score: 5, note: '', counterItems: [] });
            loadData();
        } catch (err) { alert(err.response?.data?.message || "Lỗi tạo kèo"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xóa kèo này?")) return;
        try {
            await deleteMatchup(id);
            loadData();
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    return (
        <div className="admin-manage-container">
            <h2 className="admin-page-title">⚔️ QUẢN LÝ CHIẾN THUẬT KHẮC CHẾ</h2>

            <section className="admin-form-section">
                <h3>THÊM KÈO MỚI</h3>
                <form onSubmit={handleSubmit} className="matchup-creation-form">
                    <div className="form-row-grid">
                        <HeroSelect label="TƯỚNG ĐỐI THỦ (ENEMY):" heroes={heroes} 
                            selectedHeroId={formData.enemyHeroId} onChange={id => setFormData({...formData, enemyHeroId: id})} />
                        <HeroSelect label="TƯỚNG KHẮC CHẾ (COUNTER):" heroes={heroes} 
                            selectedHeroId={formData.heroId} onChange={id => setFormData({...formData, heroId: id})} />
                        <div className="input-group">
                            <label>ĐIỂM KHẮC CHẾ (1-10):</label>
                            <input type="number" min="1" max="10" value={formData.score} 
                                onChange={e => setFormData({...formData, score: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <label>GHI CHÚ CHIẾN THUẬT:</label>
                        <textarea value={formData.note} required
                            onChange={e => setFormData({...formData, note: e.target.value})} 
                            placeholder="Mô tả cách khắc chế..." />
                    </div>

                    <div className="item-selection-preview">
                        <label>TRANG BỊ KHẮC CHẾ ({formData.counterItems.length}):</label>
                        <div className="selected-items-list">
                            {formData.counterItems.map(itemId => {
                                const it = items.find(i => i._id === itemId);
                                return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} />;
                            })}
                            <button type="button" className="btn-open-item-modal" onClick={() => setIsItemModalOpen(true)}>
                                + Chọn Trang Bị
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-cyber btn-submit">LƯU CHIẾN THUẬT</button>
                </form>
            </section>

            <section className="admin-list-section">
                <h3>DANH SÁCH CÁC KÈO HIỆN TẠI</h3>
                <div className="matchup-cards-grid">
                    {matchups.map(m => (
                        <div key={m._id} className="matchup-admin-card">
                            <div className="card-top">
                                <div className="vs-icons">
                                    <div className="hero-mini-box">
                                        <img src={getImgUrl(m.enemyHeroId?.avatar)} alt="enemy" />
                                        <span>{m.enemyHeroId?.name}</span>
                                    </div>
                                    <div className="vs-text">VS</div>
                                    <div className="hero-mini-box counter">
                                        <img src={getImgUrl(m.heroId?.avatar)} alt="counter" />
                                        <span>{m.heroId?.name}</span>
                                    </div>
                                </div>
                                <div className="card-score">{m.score}đ</div>
                            </div>
                            <div className="card-mid">
                                <p className="match-note">“{m.note}”</p>
                                <div className="match-items">
                                    {m.counterItems?.map(it => (
                                        <img key={it._id} src={getImgUrl(it.icon)} title={it.name} alt="icon" />
                                    ))}
                                </div>
                            </div>
                            <div className="card-bottom">
                                <span className="author-name">Bởi: {m.author?.username}</span>
                                <button className="btn-del-small" onClick={() => handleDelete(m._id)}>XÓA</button>
                            </div>
                        </div>
                    ))}
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