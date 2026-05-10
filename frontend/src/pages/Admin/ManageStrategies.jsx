import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getHeroes, getItems, getStrategies, createStrategy, updateStrategy, deleteStrategy } from '../../services/api';
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

const ManageStrategies = () => {
    const { user } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [strategies, setStrategies] = useState([]);
    const [viewMode, setViewMode] = useState('personal');
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [viewingStrat, setViewingStrat] = useState(null);

    // 🌟 STATE CHO FORM MODAL
    const [isFormOpen, setIsFormOpen] = useState(false);
    const initialForm = {
        type: 'combo_counter',
        teamA: [null, null],
        teamB: [null, null],
        score: 5,
        note: '',
        counterItems: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    // STATE CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    useEffect(() => {
        if (user) loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            const [hRes, iRes, sRes] = await Promise.all([
                getHeroes(),
                getItems(),
                getStrategies('pro', user?.id)
            ]);
            
            setHeroes(hRes.data.data ? hRes.data.data : hRes.data);
            setItems(iRes.data.data ? iRes.data.data : iRes.data);
            setStrategies(sRes.data.data ? sRes.data.data : sRes.data);
            
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu: ", err);
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

    const filteredStrategies = strategies.filter(strat => {
        if (viewMode === 'personal' && strat.author?._id !== user?.id && strat.author !== user?.id) return false;
        if (viewMode === 'system' && !strat.isSystem) return false;
        if (viewMode === 'community' && strat.isSystem) return false;

        const allHeroIds = [
            ...(strat.teamA || []).map(h => h._id || h),
            ...(strat.teamB || []).map(h => h._id || h)
        ];

        const fullHeroesInStrat = allHeroIds
            .map(id => heroes.find(hero => hero._id === id))
            .filter(Boolean);

        const matchName = searchTerm === '' ||
            strat.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullHeroesInStrat.some(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchRole = roleFilter === '' ||
            fullHeroesInStrat.some(h => h.roles?.some(r => (r.name || r) === roleFilter || r._id === roleFilter));

        const matchLane = laneFilter === '' ||
            fullHeroesInStrat.some(h => h.lane?.includes(laneFilter));

        return matchName && matchRole && matchLane;
    });

    const handleTypeChange = (newType) => {
        if (newType === 'skill_matchup') {
            setFormData({ ...formData, type: newType, teamA: [null], teamB: [null] });
        } else if (newType === 'synergy') {
            setFormData({ ...formData, type: newType, teamA: [null, null], teamB: [] });
        } else if (newType === 'combo_counter') {
            setFormData({ ...formData, type: newType, teamA: [null, null], teamB: [null, null] });
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

    const handleEditClick = (strat) => {
        setFormData({
            type: strat.type,
            teamA: strat.teamA.map(h => h._id || h),
            teamB: strat.teamB ? strat.teamB.map(h => h._id || h) : [],
            score: strat.score || 5,
            note: strat.note,
            counterItems: strat.counterItems ? strat.counterItems.map(i => i._id || i) : []
        });
        setEditingId(strat._id);
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validTeamA = formData.teamA.filter(id => id !== null);
        const validTeamB = formData.teamB.filter(id => id !== null);

        if (validTeamA.length === 0 || (formData.type !== 'synergy' && validTeamB.length === 0)) {
            return toast.warning("⚠️ Vui lòng chọn ít nhất 1 tướng cho mỗi đội!");
        }

        try {
            const payload = {
                type: formData.type,
                teamA: validTeamA,
                teamB: formData.type === 'synergy' ? [] : validTeamB,
                score: formData.score,
                note: formData.note,
                counterItems: formData.counterItems,
                author: user?.id
            };

            if (editingId) {
                await updateStrategy(editingId, payload);
                toast.success("✅ Đã cập nhật chiến thuật vào hệ thống!");
            } else {
                await createStrategy(payload);
                toast.success("✅ Đã ghi danh chiến thuật vào hệ thống!");
            }

            closeFormModal();
            loadData();
        } catch (err) {
            console.error("Lỗi lưu Strategy:", err);
            toast.error(err.response?.data?.message || "Lỗi lưu chiến thuật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận hủy bỏ chiến thuật này?")) return;
        try {
            await deleteStrategy(id);
            loadData();
        } catch (err) {
            toast.error("Lỗi khi xóa");
        }
    };

    const renderTeamSlots = (teamKey, isEnemy) => {
        return (
            <div className="combo-slots-wrapper">
                {formData[teamKey].map((heroId, idx) => {
                    const isBaseSlot = idx < (formData.type === 'skill_matchup' ? 1 : 2);
                    
                    return (
                        <div key={idx} className="combo-slot-item">
                            <HeroSelect
                                heroes={heroes}
                                selectedHeroId={heroId}
                                isEnemy={isEnemy}
                                onChange={(id) => {
                                    const newTeam = [...formData[teamKey]];
                                    newTeam[idx] = id;
                                    setFormData({ ...formData, [teamKey]: newTeam });
                                }}
                            />
                            
                            {(!isBaseSlot || heroId) && (
                                <button 
                                    type="button" 
                                    className="btn-remove-slot" 
                                    onClick={() => {
                                        if (!isBaseSlot) {
                                            const newTeam = formData[teamKey].filter((_, i) => i !== idx);
                                            setFormData({ ...formData, [teamKey]: newTeam });
                                        } else {
                                            const newTeam = [...formData[teamKey]];
                                            newTeam[idx] = null;
                                            setFormData({ ...formData, [teamKey]: newTeam });
                                        }
                                    }}
                                    title={!isBaseSlot ? "Xóa ô này" : "Bỏ chọn tướng"}
                                >
                                    ×
                                </button>
                            )}

                            {idx < formData[teamKey].length - 1 && formData.type !== 'skill_matchup' && (
                                <div className="combo-plus-icon">+</div>
                            )}
                        </div>
                    );
                })}
                {formData[teamKey].length < 5 && formData.type !== 'skill_matchup' && (
                    <button type="button" className="btn-add-combo-slot" onClick={() => {
                        setFormData({ ...formData, [teamKey]: [...formData[teamKey], null] });
                    }} title="Thêm tướng vào combo">
                        <span>+</span><br />THÊM
                    </button>
                )}
            </div>
        );
    };

    const getStrategyTitle = (type) => {
        if (type === 'skill_matchup') return '⚔️ KÈO KỸ NĂNG (50/50)';
        if (type === 'synergy') return '🤝 KẾT HỢP CỰC MẠNH';
        if (type === 'combo_counter') return '🛡️ ĐỘI HÌNH ĐỐI TRỌNG';
        return '';
    };

    return (
        <div className="admin-manage-container fade-in-anim">
            {/* TIÊU ĐỀ VÀ NÚT THÊM MỚI */}
            <div className="flex-row-gap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="admin-page-title m-0-b-5" style={{ marginBottom: 0 }}>🚀 LÒ RÈN CHIẾN THUẬT NÂNG CAO</h2>
                <button 
                    onClick={openAddForm} 
                    className="btn-save" 
                    style={{ background: '#38bdf8', padding: '10px 20px', borderRadius: '8px' }}
                >
                    ➕ THÊM CHIẾN THUẬT
                </button>
            </div>

            <div className="source-toggle-bar" style={{ marginTop: 0 }}>
                <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ CỦA TÔI</button>
                <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 HỆ THỐNG</button>
                {user?.role === 'admin' && (
                    <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 CỘNG ĐỒNG</button>
                )}
            </div>

            <div className="filter-bar filter-bar-strat">
                <input
                    type="text"
                    placeholder="🔍 Tìm tên tướng hoặc ghi chú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input search-input-large"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select select-input-med"
                >
                    <option value="">🛡️ TẤT CẢ VAI TRÒ</option>
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select
                    value={laneFilter}
                    onChange={(e) => setLaneFilter(e.target.value)}
                    className="filter-select select-input-med"
                >
                    <option value="">🗺️ TẤT CẢ ĐƯỜNG</option>
                    {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                </select>
            </div>

            <section className="admin-list-section">
                <div className="strategy-cards-grid">
                    {filteredStrategies.length > 0 ? (
                        filteredStrategies.map(strat => (
                            <div
                                key={strat._id}
                                className={`strategy-card border-${viewMode} cursor-ptr`}
                                onClick={() => setViewingStrat(strat)}
                            >
                                <div className="strat-header">
                                    <div className="strat-header-info">
                                        <span className="strat-type-badge">{getStrategyTitle(strat.type)}</span>
                                        <span className="score-badge">ĐIỂM: {strat.score || 5}</span>
                                    </div>
                                    <div className="strat-header-actions">
                                        <button className="btn-edit-mini btn-transparent-mini" onClick={(e) => { e.stopPropagation(); handleEditClick(strat); }} title="Sửa">✏️</button>
                                        <button className="btn-del-mini" onClick={(e) => { e.stopPropagation(); handleDelete(strat._id); }} title="Xóa">🗑️</button>
                                    </div>
                                </div>

                                <div className="strat-teams">
                                    <div className="team-display ally-team">
                                        {strat.teamA.map((h, i) => (
                                            <div key={i} className="strat-hero-icon-wrap">
                                                <img src={getImgUrl(h?.avatar)} alt={h?.name} title={h?.name} />
                                                <span className="strat-hero-name">{h?.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {strat.type !== 'synergy' && (
                                        <>
                                            <div className="strat-vs-icon">{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                                            <div className="team-display enemy-team">
                                                {strat.teamB.map((h, i) => (
                                                    <div key={i} className="strat-hero-icon-wrap">
                                                        <img src={getImgUrl(h?.avatar)} alt={h?.name} title={h?.name} />
                                                        <span className="strat-hero-name">{h?.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="strat-note">"{strat.note}"</div>

                                <div className="strat-footer">
                                    <span className="strat-author">Nguồn: {strat.isSystem ? 'Hệ thống' : strat.author?.username}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-msg empty-full-span">
                            Không tìm thấy chiến thuật nào phù hợp.
                        </div>
                    )}
                </div>
            </section>

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
            
            {/* ==========================================
                MODAL NHẬP LIỆU (THÊM / SỬA CHIẾN THUẬT)
            ========================================== */}
            {isFormOpen && (
                <div className="card-detail-overlay" onClick={closeFormModal} style={{ zIndex: 10000 }}>
                    <div 
                        className="cyber-panel strat-modal-panel" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            background: '#0f172a', width: '90%', maxWidth: '850px', maxHeight: '90vh', 
                            padding: '30px', borderRadius: '12px', overflowY: 'auto', 
                            border: `2px solid ${editingId ? '#f59e0b' : '#38bdf8'}`,
                            position: 'relative'
                        }}
                    >
                        <button className="close-modal-btn" onClick={closeFormModal}>×</button>
                        <h2 style={{ color: editingId ? '#f59e0b' : '#38bdf8', marginBottom: '25px', fontFamily: 'Oswald', textTransform: 'uppercase' }}>
                            {editingId ? `✏️ CẬP NHẬT CHIẾN THUẬT` : '➕ THÊM CHIẾN THUẬT MỚI'}
                        </h2>

                        <div className="strategy-type-selector">
                            <button type="button" className={`btn-strat-type ${formData.type === 'combo_counter' ? 'active' : ''}`} onClick={() => handleTypeChange('combo_counter')}>
                                🛡️ ĐỘI HÌNH KHẮC CHẾ
                            </button>
                            <button type="button" className={`btn-strat-type ${formData.type === 'synergy' ? 'active' : ''}`} onClick={() => handleTypeChange('synergy')}>
                                🤝 KẾT HỢP ĐỒNG ĐỘI
                            </button>
                            <button type="button" className={`btn-strat-type ${formData.type === 'skill_matchup' ? 'active' : ''}`} onClick={() => handleTypeChange('skill_matchup')}>
                                ⚔️ KÈO KỸ NĂNG 1v1
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="cyber-form-layout mt-25">
                            <div className={`matchup-vs-display strategy-display ${formData.type === 'synergy' ? 'flex-col' : 'flex-row'}`}>
                                {formData.type !== 'synergy' && (
                                    <>
                                        <div className="slot-item flex-1">
                                            <span className="slot-title red">PHE ĐỊCH</span>
                                            {renderTeamSlots('teamB', true)}
                                        </div>
                                        <div className="vs-logo">{formData.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                                    </>
                                )}
                                <div className="slot-item flex-1">
                                    <span className="slot-title blue">PHE TA {formData.type === 'synergy' ? '(COMBO ĐỒNG ĐỘI)' : '(PHÁ GIẢI)'}</span>
                                    {renderTeamSlots('teamA', false)}
                                </div>
                            </div>

                            <div className="score-picker-row score-eval-box">
                                <span className="slot-title yellow">ĐÁNH GIÁ ĐỘ HIỆU QUẢ CỦA CHIẾN THUẬT NÀY (1-5)</span>
                                <div className="cyber-score-bar cyber-score-center">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num} type="button"
                                            className={`score-node ${formData.score === num ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, score: num })}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-bottom-row mt-20">
                                <div className="textarea-wrap flex-2">
                                    <label className="slot-title">PHÂN TÍCH CÁCH VẬN HÀNH:</label>
                                    <textarea value={formData.note} required
                                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        placeholder={formData.type === 'synergy' ? "VD: Zata bay lên trời, Dolia buff chiêu cuối để Zata bay lần 2..." : "VD: Chờ đối phương xả hết khống chế rồi lao vào..."}
                                        className="form-textarea strategy-note-area"
                                    />
                                </div>

                                <div className="items-selector-wrap flex-1">
                                    <label className="slot-title">TRANG BỊ LÕI ({formData.counterItems.length}):</label>
                                    <div className="selected-items-row items-col-layout">
                                        <button type="button" className="btn-open-item-modal btn-full" onClick={() => setIsItemModalOpen(true)}>
                                            ➕ Chọn Trang Bị
                                        </button>
                                        <div className="mini-item-list mini-item-wrap">
                                            {formData.counterItems.map(itemId => {
                                                const it = items.find(i => i._id === itemId);
                                                return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} className="mini-item-img" />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-submit-row">
                                <button type="submit" className={`btn-cyber btn-submit-large ${editingId ? 'bg-amber' : 'bg-emerald'}`} style={{ color: '#000' }}>
                                    {editingId ? '🔄 CẬP NHẬT CHIẾN THUẬT' : (formData.type === 'synergy' ? 'LƯU COMBO ĐỒNG ĐỘI' : 'LƯU CHIẾN THUẬT ĐỐI ĐẦU')}
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

            {/* 🌟 MODAL CHI TIẾT CHIẾN THUẬT (KHI BẤM VÀO CARD ĐỂ XEM) 🌟 */}
            {viewingStrat && (
                <div className="hero-detail-overlay" onClick={() => setViewingStrat(null)}>
                    <div className="hero-detail-modal cyber-panel strat-modal-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewingStrat(null)}>×</button>

                        <div className="modal-header strat-modal-header">
                            <div className="header-info w-full-center">
                                <h2 className="hero-name-large strat-modal-title">{getStrategyTitle(viewingStrat.type)}</h2>
                                <div className="hero-badges strat-modal-badges">
                                    <span className="badge badge-amber">Hiệu quả: {viewingStrat.score}/5 ⭐</span>
                                    <span className="badge badge-slate">{viewingStrat.isSystem ? 'Hệ thống' : `Bởi: ${viewingStrat.author?.username || 'Người chơi'}`}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body-scroll strat-modal-body">
                            <h3 className="section-title border-l-blue">🎮 ĐỘI HÌNH THAM CHIẾU</h3>
                            <div className="strat-teams strat-teams-display">
                                <div className="team-display ally-team">
                                    {viewingStrat.teamA.map((h, i) => (
                                        <div key={i} className="strat-hero-icon-wrap">
                                            <img src={getImgUrl(h?.avatar)} alt={h?.name} className="modal-hero-img" />
                                            <span className="strat-hero-name modal-hero-name">
                                                {h?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {viewingStrat.type !== 'synergy' && (
                                    <>
                                        <div className="strat-vs-icon strat-modal-vs">VS</div>
                                        <div className="team-display enemy-team">
                                            {viewingStrat.teamB.map((h, i) => (
                                                <div key={i} className="strat-hero-icon-wrap">
                                                    <img src={getImgUrl(h?.avatar)} alt={h?.name} className="modal-hero-img" />
                                                    <span className="strat-hero-name modal-hero-name">
                                                        {h?.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <h3 className="section-title border-l-amber">📖 PHÂN TÍCH CHI TIẾT</h3>
                            <div className="strat-modal-note-box">
                                {viewingStrat.note}
                            </div>

                            <h3 className="section-title border-l-emerald">🛡️ TRANG BỊ KHUYÊN DÙNG</h3>
                            <div className="strat-modal-items-grid">
                                {viewingStrat.counterItems?.length > 0 ? viewingStrat.counterItems.map((item, idx) => {
                                    const fullItem = items.find(i => i._id === (item._id || item));
                                    return (
                                        <div key={idx} className="strat-modal-item-card">
                                            <img src={getImgUrl(fullItem?.icon)} alt="icon" className="strat-modal-item-img" />
                                            <div className="strat-modal-item-name">{fullItem?.name}</div>
                                        </div>
                                    );
                                }) : <p className="strat-modal-no-items">Không có trang bị đính kèm.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStrategies;