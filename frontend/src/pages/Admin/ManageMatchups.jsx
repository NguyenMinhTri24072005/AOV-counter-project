import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getHeroes, getItems, getCounters, createMatchup, deleteMatchup } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import HeroSelect from '../../components/HeroSelect';
import ItemModal from '../../components/ItemModal';
import './Admin.css';

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=Hero';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ManageMatchups = () => {
    const { user } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [matchups, setMatchups] = useState([]);
    const [viewMode, setViewMode] = useState('personal'); 
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    // STATE CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    const [formData, setFormData] = useState({
        enemyHeroId: '',
        heroId: '',
        score: 5, // Mặc định là 5 điểm
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
            const [hRes, iRes, mRes] = await Promise.all([
                getHeroes(), getItems(), getCounters([], [], 'pro', user?.id)
            ]);
            setHeroes(hRes.data);
            setItems(iRes.data);
            setMatchups(mRes.data);
        } catch (err) { 
            console.error("Lỗi khi tải dữ liệu: ", err); 
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
            // FIX LỖI 500: Phải đổi "heroId" thành "counterHeroId" để Database hiểu
            const payload = { 
                enemyHeroId: formData.enemyHeroId,
                counterHeroId: formData.heroId, 
                score: formData.score,
                note: formData.note,
                counterItems: formData.counterItems,
                author: user?.id 
            };

            await createMatchup(payload);
            alert("Đã tạo chiến thuật mới thành công!");
            setFormData({ enemyHeroId: '', heroId: '', score: 5, note: '', counterItems: [] });
            loadData();
        } catch (err) { 
            alert(err.response?.data?.message || "Lỗi tạo kèo"); 
        }
    };

    const handleDelete = async (id) => {
        if (!id) return alert("Lỗi: Không tìm thấy ID của kèo này!");
        if (!window.confirm("Xác nhận xóa chiến thuật này?")) return;
        try {
            await deleteMatchup(id);
            loadData();
        } catch (err) { 
            alert("Lỗi khi xóa"); 
        }
    };

    // TRÍCH XUẤT ROLE & LANE TỪ DANH SÁCH TƯỚNG CHO DROPDOWN
    const allRoles = useMemo(() => {
        const roles = new Set();
        heroes.forEach(h => h.roles?.forEach(r => roles.add(r.name || r)));
        return Array.from(roles);
    }, [heroes]);

    const allLanes = useMemo(() => {
        const lanes = new Set();
        heroes.forEach(h => h.lane?.forEach(l => lanes.add(l)));
        return Array.from(lanes);
    }, [heroes]);

    // LOGIC LỌC DỮ LIỆU
    const filteredResults = matchups.map(group => ({
        ...group,
        matchupDetails: group.matchupDetails.filter(d => {
            const authorId = d.authorId || d.author?._id || d.author;
            if (viewMode === 'personal') return authorId === user?.id; 
            if (viewMode === 'system') return d.isSystem;              
            if (viewMode === 'community') return !d.isSystem;          
            return false;
        })
    })).filter(group => {
        if (group.matchupDetails.length === 0) return false;

        const fullHero = heroes.find(h => h._id === group.hero._id);

        const matchName = group.hero.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          group.matchupDetails.some(d => {
                              const enemy = heroes.find(h => h._id === d.enemyId);
                              return enemy?.name.toLowerCase().includes(searchTerm.toLowerCase());
                          });
        
        const matchRole = roleFilter ? fullHero?.roles?.some(r => (r.name || r) === roleFilter || r._id === roleFilter) : true;
        const matchLane = laneFilter ? fullHero?.lane?.includes(laneFilter) : true;

        return matchName && matchRole && matchLane;
    });

    return (
        <div className="admin-manage-container">
            <h2 className="admin-page-title">⚔️ CHIẾN TRƯỜNG MÔ PHỎNG</h2>

            <section className="battlefield-form-box">
                <form onSubmit={handleSubmit} className="cyber-form-layout">
                    
                    <div className="matchup-vs-display">
                        <div className="slot-item">
                            <span className="slot-title red">ĐỐI THỦ (BỊ KHẮC CHẾ)</span>
                            <HeroSelect heroes={heroes} selectedHeroId={formData.enemyHeroId} isEnemy={true} onChange={id => setFormData({...formData, enemyHeroId: id})} />
                        </div>
                        
                        <div className="vs-logo">VS</div>

                        <div className="slot-item">
                            <span className="slot-title blue">TƯỚNG CỦA BẠN (PICK)</span>
                            <HeroSelect heroes={heroes} selectedHeroId={formData.heroId} onChange={id => setFormData({...formData, heroId: id})} />
                        </div>

                        {/* THANH ĐIỂM CHỈ TỪ 1 ĐẾN 5 */}
                        <div className="score-picker-column">
                            <span className="slot-title yellow">ĐIỂM KHẮC CHẾ (1-5)</span>
                            <div className="cyber-score-bar">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button 
                                        key={num} 
                                        type="button" 
                                        className={`score-node ${formData.score === num ? 'active' : ''}`}
                                        onClick={() => setFormData({...formData, score: num})}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-bottom-row">
                        <div className="textarea-wrap" style={{ flex: 2 }}>
                            <label className="slot-title">GHI CHÚ CHIẾN THUẬT:</label>
                            <textarea value={formData.note} required
                                onChange={e => setFormData({...formData, note: e.target.value})} 
                                placeholder="Mô tả chi tiết cách thức khắc chế..." 
                                className="form-textarea"
                                style={{ height: '100px' }}
                            />
                        </div>

                        <div className="items-selector-wrap" style={{ flex: 1 }}>
                            <label className="slot-title">TRANG BỊ ({formData.counterItems.length}):</label>
                            <div className="selected-items-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button type="button" className="btn-open-item-modal" onClick={() => setIsItemModalOpen(true)} style={{ width: '100%' }}>
                                    ➕ Chọn Trang Bị
                                </button>
                                <div className="mini-item-list" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    {formData.counterItems.map(itemId => {
                                        const it = items.find(i => i._id === itemId);
                                        return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #334155', objectFit: 'cover' }} />;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button type="submit" className="btn-cyber btn-save-matchup" style={{ width: '100%', height: '50px', fontSize: '18px', background: '#10b981', color: '#000' }}>
                            XÁC NHẬN LƯU CHIẾN THUẬT
                        </button>
                    </div>
                </form>
            </section>

            <div className="source-toggle-bar">
                <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ KÈO CỦA TÔI</button>
                <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 KÈO HỆ THỐNG</button>
                {user?.role === 'admin' && (
                    <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 KÈO CỘNG ĐỒNG</button>
                )}
            </div>

            <div className="filter-bar" style={{ marginBottom: '25px', display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                <input type="text" placeholder="🔍 Tìm tên tướng (Địch hoặc Ta)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input" style={{ flex: 1 }} />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                    <option value="">🛡️ TẤT CẢ VAI TRÒ</option>
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)} className="filter-select">
                    <option value="">🗺️ TẤT CẢ ĐƯỜNG</option>
                    {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                </select>
            </div>

            <section className="admin-list-section">
                <div className="matchup-cards-grid">
                    {filteredResults.length > 0 ? (
                        filteredResults.map(group => (
                            <div key={group.hero._id} className={`matchup-admin-card ${viewMode === 'personal' ? 'border-personal' : (viewMode === 'system' ? 'border-system' : 'border-community')}`}>
                                <div className="card-top">
                                    <div className="hero-meta">
                                        <img src={getImgUrl(group.hero.avatar)} alt="hero" className="main-hero-img" />
                                        <div className="hero-meta-info">
                                            <h4 style={{ margin: '0 0 5px 0' }}>{group.hero.name}</h4>
                                            <span className="score-label">Trung bình: {group.totalScore}đ</span>
                                        </div>
                                    </div>
                                </div>
                                
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
                                                    <button className="btn-del-mini" onClick={() => handleDelete(d._id)} title="Xóa">🗑️</button>
                                                </div>
                                                <p className="note-text" style={{ fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1', marginTop: '5px', marginBottom: '0' }}>
                                                    "{d.note}"
                                                </p>
                                                {viewMode === 'community' && (
                                                    <span style={{ fontSize: '11px', color: '#10b981', display: 'block', marginTop: '6px', fontWeight: 'bold' }}>
                                                        Bởi: {d.authorName || 'Người chơi'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-msg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <p>Không tìm thấy chiến thuật nào phù hợp với bộ lọc.</p>
                        </div>
                    )}
                </div>
            </section>

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
        </div>
    );
};

export default ManageMatchups;