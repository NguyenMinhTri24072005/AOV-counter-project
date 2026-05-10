import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getHeroes, getItems, getCounters, createMatchup, deleteMatchup, updateMatchup } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
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
    const [viewingDetail, setViewingDetail] = useState(null);

    const [isLoading, setIsLoading] = useState(false);

    // STATE CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    // 🌟 STATE CHO FORM MODAL
    const [isFormOpen, setIsFormOpen] = useState(false);
    const initialForm = {
        enemyHeroId: '',
        heroId: '',
        score: 5,
        note: '',
        counterItems: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [hRes, iRes, mRes] = await Promise.all([
                getHeroes(),
                getItems(),
                getCounters([], [], 'all')
            ]);

            setHeroes(hRes.data.data ? hRes.data.data : hRes.data);
            setItems(iRes.data.data ? iRes.data.data : iRes.data);
            setMatchups(mRes.data.data ? mRes.data.data : mRes.data);
            
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setIsLoading(false);
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

    const openAddForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (detail, groupHeroId) => {
        setFormData({
            enemyHeroId: detail.enemyId,
            heroId: groupHeroId,
            score: detail.score,
            note: detail.note,
            counterItems: detail.counterItems || []
        });
        setEditingId(detail._id);
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                enemyHeroId: formData.enemyHeroId,
                counterHeroId: formData.heroId,
                score: formData.score,
                note: formData.note,
                counterItems: formData.counterItems,
                author: user?.id || user?._id
            };

            if (editingId) {
                await updateMatchup(editingId, payload);
                toast.success("Đã cập nhật chiến thuật thành công!");
            } else {
                await createMatchup(payload);
                toast.success("Đã tạo chiến thuật mới thành công!");
            }

            closeFormModal();
            loadData();
        } catch (err) {
            console.error("Lỗi Submit Matchup:", err);
            toast.error(err.response?.data?.message || "Lỗi xử lý");
        }
    };

    const handleDelete = async (id) => {
        if (!id) return toast.warning("Lỗi: Không tìm thấy ID của kèo này!");
        if (!window.confirm("Xác nhận xóa chiến thuật này?")) return;
        try {
            await deleteMatchup(id);
            loadData();
        } catch (err) {
            toast.error("Lỗi khi xóa");
        }
    };

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
            {/* TIÊU ĐỀ VÀ NÚT THÊM MỚI */}
            <div className="flex-row-gap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="admin-page-title m-0-b-5" style={{ marginBottom: 0 }}>⚔️ CHIẾN TRƯỜNG MÔ PHỎNG (1V1)</h2>
                <button 
                    onClick={openAddForm} 
                    className="btn-save" 
                    style={{ background: '#38bdf8', padding: '10px 20px', borderRadius: '8px' }}
                >
                    ➕ THÊM BÍ KÍP 1V1
                </button>
            </div>

            <div className="source-toggle-bar" style={{ marginTop: 0 }}>
                <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ KÈO CỦA TÔI</button>
                <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 KÈO HỆ THỐNG</button>
                {user?.role === 'admin' && (
                    <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 KÈO CỘNG ĐỒNG</button>
                )}
            </div>

            <div className="filter-bar filter-bar-strat">
                <input type="text" placeholder="🔍 Tìm tên tướng (Địch hoặc Ta)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input flex-1" />
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
                {isLoading ? (
                    <div className="cyber-scanning-mini"><div className="scan-line"></div>ĐANG TRUY XUẤT DỮ LIỆU...</div>
                ) : (
                    <div className="matchup-cards-grid">
                        {filteredResults.length > 0 ? (
                            filteredResults.map(group => (
                                <div key={group.hero._id} className={`matchup-admin-card ${viewMode === 'personal' ? 'border-personal' : (viewMode === 'system' ? 'border-system' : 'border-community')}`}>
                                    <div className="card-top border-b-glass">
                                        <div className="hero-meta">
                                            <img src={getImgUrl(group.hero.avatar)} alt="hero" className="main-hero-img" />
                                            <div className="hero-meta-info">
                                                <h4 className="m-0-b-5">{group.hero.name}</h4>
                                                <span className="score-label">Trung bình: {group.totalScore}đ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-details">
                                        {group.matchupDetails.map((d, idx) => {
                                            const enemyHero = heroes.find(h => h._id === d.enemyId);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="detail-item-box matchup-clickable-card"
                                                    onClick={() => setViewingDetail({ ...d, mainHero: group.hero })}
                                                >
                                                    <div className="detail-item-header flex-between">
                                                        <div className="enemy-info-mini flex-align-center gap-8">
                                                            <span className="txt-13 text-slate">Khắc chế:</span>
                                                            <img src={getImgUrl(enemyHero?.avatar)} alt="enemy" className="enemy-avatar-mini" />
                                                            <strong className="text-red">{enemyHero?.name}</strong>
                                                        </div>
                                                        <div className="strat-header-actions">
                                                            <button className="btn-edit-mini btn-transparent-mini" onClick={(e) => { e.stopPropagation(); handleEditClick(d, group.hero._id); }} title="Sửa">✏️</button>
                                                            <button className="btn-del-mini" onClick={(e) => { e.stopPropagation(); handleDelete(d._id); }} title="Xóa">🗑️</button>
                                                        </div>
                                                    </div>
                                                    <p className="note-text matchup-note-txt">
                                                        "{d.note}"
                                                    </p>
                                                    {viewMode === 'community' && (
                                                        <span className="matchup-author-txt">
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
                            <div className="empty-state-msg empty-full-span p-40">
                                <p>Không tìm thấy chiến thuật nào phù hợp với bộ lọc.</p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />

            {/* ==========================================
                MODAL NHẬP LIỆU (THÊM / SỬA KÈO 1V1)
            ========================================== */}
            {isFormOpen && (
                <div className="card-detail-overlay" onClick={closeFormModal} style={{ zIndex: 10000 }}>
                    <div 
                        className="cyber-panel strat-modal-panel" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            background: '#0f172a', width: '90%', maxWidth: '800px', maxHeight: '90vh', 
                            padding: '30px', borderRadius: '12px', overflowY: 'auto', 
                            border: `2px solid ${editingId ? '#f59e0b' : '#38bdf8'}`,
                            position: 'relative'
                        }}
                    >
                        <button className="close-modal-btn" onClick={closeFormModal}>×</button>
                        <h2 style={{ color: editingId ? '#f59e0b' : '#38bdf8', marginBottom: '25px', fontFamily: 'Oswald', textTransform: 'uppercase' }}>
                            {editingId ? `✏️ CẬP NHẬT BÍ KÍP 1V1` : '➕ THÊM BÍ KÍP 1V1 MỚI'}
                        </h2>

                        <form onSubmit={handleSubmit} className="cyber-form-layout">
                            <div className="matchup-vs-display">
                                <div className="slot-item">
                                    <span className="slot-title red">ĐỐI THỦ (BỊ KHẮC CHẾ)</span>
                                    <HeroSelect heroes={heroes} selectedHeroId={formData.enemyHeroId} isEnemy={true} onChange={id => setFormData({ ...formData, enemyHeroId: id })} />
                                </div>

                                <div className="vs-logo">VS</div>

                                <div className="slot-item">
                                    <span className="slot-title blue">TƯỚNG CỦA BẠN (PICK)</span>
                                    <HeroSelect heroes={heroes} selectedHeroId={formData.heroId} onChange={id => setFormData({ ...formData, heroId: id })} />
                                </div>

                                <div className="score-picker-column">
                                    <span className="slot-title yellow">ĐIỂM KHẮC CHẾ (1-5)</span>
                                    <div className="cyber-score-bar">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                className={`score-node ${formData.score === num ? 'active' : ''}`}
                                                onClick={() => setFormData({ ...formData, score: num })}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-bottom-row mt-20">
                                <div className="textarea-wrap flex-2">
                                    <label className="slot-title">GHI CHÚ CHIẾN THUẬT:</label>
                                    <textarea value={formData.note} required
                                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        placeholder="Mô tả chi tiết cách thức khắc chế..."
                                        className="form-textarea matchup-textarea"
                                    />
                                </div>

                                <div className="items-selector-wrap flex-1">
                                    <label className="slot-title">TRANG BỊ ({formData.counterItems.length}):</label>
                                    <div className="selected-items-row items-col-layout">
                                        <button type="button" className="btn-open-item-modal btn-full" onClick={() => setIsItemModalOpen(true)}>
                                            ➕ Chọn Trang Bị
                                        </button>
                                        <div className="mini-item-list mini-item-wrap">
                                            {formData.counterItems.map(itemId => {
                                                const it = items.find(i => i._id === itemId);
                                                return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} className="match-item-icon" />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-submit-row">
                                <button type="submit" className={`btn-cyber btn-submit-large ${editingId ? 'bg-amber' : 'bg-emerald'}`} style={{ color: '#000' }}>
                                    {editingId ? '🔄 CẬP NHẬT CHIẾN THUẬT' : 'XÁC NHẬN LƯU CHIẾN THUẬT'}
                                </button>
                                {editingId && (
                                    <button type="button" className="btn-cyber btn-cancel btn-submit-large" onClick={closeFormModal}>
                                        ❌ HỦY CHỈNH SỬA
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🌟 MODAL CHI TIẾT KÈO KHẮC CHẾ (KHI BẤM VÀO CARD ĐỂ XEM) 🌟 */}
            {viewingDetail && (
                <div className="hero-detail-overlay" onClick={() => setViewingDetail(null)}>
                    <div className="hero-detail-modal cyber-panel matchup-modal-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewingDetail(null)}>×</button>

                        <div className="modal-header matchup-modal-header">
                            <div className="header-info w-full-center">
                                <div className="matchup-modal-vs-box">
                                    <img src={getImgUrl(viewingDetail.mainHero?.avatar)} alt="main" className="matchup-modal-img border-blue" />
                                    <span className="matchup-modal-vs-txt">VS</span>
                                    <img src={getImgUrl(heroes.find(h => h._id === viewingDetail.enemyId)?.avatar)} alt="enemy" className="matchup-modal-img border-red" />
                                </div>
                                <h2 className="hero-name-large matchup-modal-title">
                                    {viewingDetail.mainHero?.name} KHẮC CHẾ {heroes.find(h => h._id === viewingDetail.enemyId)?.name}
                                </h2>
                            </div>
                        </div>

                        <div className="modal-body-scroll p-25">
                            <h3 className="section-title border-l-amber">💡 PHƯƠNG PHÁP KHẮC CHẾ</h3>
                            <div className="matchup-modal-note-box">
                                {viewingDetail.note}
                            </div>

                            <h3 className="section-title border-l-emerald">⚔️ TRANG BỊ KHUYÊN DÙNG</h3>
                            <div className="matchup-modal-items-grid">
                                {viewingDetail.counterItems?.length > 0 ? viewingDetail.counterItems.map((itemId, idx) => {
                                    const it = items.find(i => i._id === (itemId._id || itemId));
                                    return (
                                        <div key={idx} className="matchup-modal-item-card">
                                            <img src={getImgUrl(it?.icon)} alt="item" className="matchup-modal-item-img" />
                                            <span className="matchup-modal-item-name">{it?.name}</span>
                                        </div>
                                    );
                                }) : <p className="matchup-modal-no-items">Không có trang bị cụ thể.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMatchups;