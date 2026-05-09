import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getHeroes, getItems, getStrategies, createStrategy, updateStrategy, deleteStrategy } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
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
    // Thêm vào cùng chỗ với các useState khác
    const [viewingStrat, setViewingStrat] = useState(null);

    const [formData, setFormData] = useState({
        type: 'combo_counter',
        teamA: [null, null],
        teamB: [null, null],
        score: 5,
        note: '',
        counterItems: []
    });

    const [editingId, setEditingId] = useState(null);

    // 🌟 STATE CHO BỘ LỌC
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
            setHeroes(hRes.data);
            setItems(iRes.data);
            setStrategies(sRes.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu: ", err);
        }
    };

    // 🌟 TRÍCH XUẤT ROLE & LANE TỪ DANH SÁCH TƯỚNG CHO DROPDOWN
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

    // 🌟 LOGIC LỌC DỮ LIỆU ĐA CHIỀU (Bao gồm cả ViewMode và Form Lọc)
    // 🌟 LOGIC LỌC DỮ LIỆU ĐA CHIỀU (Đã fix lỗi thiếu trường Roles/Lane)
    const filteredStrategies = strategies.filter(strat => {
        // 1. Lọc theo Nguồn (Của tôi, Hệ thống, Cộng đồng)
        if (viewMode === 'personal' && strat.author?._id !== user?.id && strat.author !== user?.id) return false;
        if (viewMode === 'system' && !strat.isSystem) return false;
        if (viewMode === 'community' && strat.isSystem) return false;

        // 2. Lấy danh sách ID của tất cả tướng có trong Chiến thuật này (cả 2 phe)
        const allHeroIds = [
            ...(strat.teamA || []).map(h => h._id || h),
            ...(strat.teamB || []).map(h => h._id || h)
        ];

        // 3. Đối chiếu ID để lấy Full thông tin tướng từ state `heroes`
        const fullHeroesInStrat = allHeroIds
            .map(id => heroes.find(hero => hero._id === id))
            .filter(Boolean); // Lọc bỏ những giá trị undefined nếu có

        // 4. Lọc theo Từ khóa (Tìm Tên tướng hoặc Ghi chú)
        const matchName = searchTerm === '' ||
            strat.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullHeroesInStrat.some(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

        // 5. Lọc theo Vai trò
        const matchRole = roleFilter === '' ||
            fullHeroesInStrat.some(h => h.roles?.some(r => (r.name || r) === roleFilter || r._id === roleFilter));

        // 6. Lọc theo Đường đi
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        const resetTeamA = formData.type === 'skill_matchup' ? [null] : [null, null];
        const resetTeamB = formData.type === 'synergy' ? [] : (formData.type === 'skill_matchup' ? [null] : [null, null]);

        setFormData({
            type: formData.type,
            teamA: resetTeamA,
            teamB: resetTeamB,
            score: 5,
            note: '',
            counterItems: []
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validTeamA = formData.teamA.filter(id => id !== null);
        const validTeamB = formData.teamB.filter(id => id !== null);

        if (validTeamA.length === 0 || (formData.type !== 'synergy' && validTeamB.length === 0)) {
            return alert("⚠️ Vui lòng chọn ít nhất 1 tướng cho mỗi đội!");
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
                alert("✅ Đã cập nhật chiến thuật vào hệ thống!");
            } else {
                await createStrategy(payload);
                alert("✅ Đã ghi danh chiến thuật vào hệ thống!");
            }

            cancelEdit();
            loadData();
        } catch (err) {
            console.error("Lỗi lưu Strategy:", err);
            alert(err.response?.data?.message || "Lỗi lưu chiến thuật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận hủy bỏ chiến thuật này?")) return;
        try {
            await deleteStrategy(id);
            loadData();
        } catch (err) {
            alert("Lỗi khi xóa");
        }
    };

    const renderTeamSlots = (teamKey, isEnemy) => {
        return (
            <div className="combo-slots-wrapper">
                {formData[teamKey].map((heroId, idx) => (
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
                        {formData[teamKey].length > (formData.type === 'skill_matchup' ? 1 : 2) && (
                            <button type="button" className="btn-remove-slot" onClick={() => {
                                const newTeam = formData[teamKey].filter((_, i) => i !== idx);
                                setFormData({ ...formData, [teamKey]: newTeam });
                            }}>×</button>
                        )}
                        {idx < formData[teamKey].length - 1 && formData.type !== 'skill_matchup' && (
                            <div className="combo-plus-icon">+</div>
                        )}
                    </div>
                ))}
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
        <div className="admin-manage-container" style={{ animation: 'fadeIn 0.5s' }}>
            <h2 className="admin-page-title">🚀 LÒ RÈN CHIẾN THUẬT NÂNG CAO</h2>

            <section className="battlefield-form-box">
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

                <form onSubmit={handleSubmit} className={`cyber-form-layout ${editingId ? 'editing' : ''}`} style={{ marginTop: '25px', padding: editingId ? '20px' : '0', borderRadius: '12px', border: editingId ? '2px solid #f59e0b' : 'none', boxShadow: editingId ? '0 0 15px rgba(245,158,11,0.2)' : 'none' }}>
                    {editingId && <h4 className="edit-badge" style={{ color: '#f59e0b', marginBottom: '20px' }}>Đang chỉnh sửa Chiến Thuật...</h4>}

                    <div className="matchup-vs-display strategy-display" style={{ flexDirection: formData.type === 'synergy' ? 'column' : 'row' }}>
                        {formData.type !== 'synergy' && (
                            <>
                                <div className="slot-item" style={{ flex: 1 }}>
                                    <span className="slot-title red">PHE ĐỊCH</span>
                                    {renderTeamSlots('teamB', true)}
                                </div>
                                <div className="vs-logo">{formData.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                            </>
                        )}
                        <div className="slot-item" style={{ flex: 1 }}>
                            <span className="slot-title blue">PHE TA {formData.type === 'synergy' ? '(COMBO ĐỒNG ĐỘI)' : '(PHÁ GIẢI)'}</span>
                            {renderTeamSlots('teamA', false)}
                        </div>
                    </div>

                    <div className="score-picker-row" style={{ marginTop: '25px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <span className="slot-title yellow">ĐÁNH GIÁ ĐỘ HIỆU QUẢ CỦA CHIẾN THUẬT NÀY (1-5)</span>
                        <div className="cyber-score-bar" style={{ justifyContent: 'center', marginTop: '10px' }}>
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

                    <div className="form-bottom-row" style={{ marginTop: '20px' }}>
                        <div className="textarea-wrap" style={{ flex: 2 }}>
                            <label className="slot-title">PHÂN TÍCH CÁCH VẬN HÀNH:</label>
                            <textarea value={formData.note} required
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                placeholder={formData.type === 'synergy' ? "VD: Zata bay lên trời, Dolia buff chiêu cuối để Zata bay lần 2..." : "VD: Chờ đối phương xả hết khống chế rồi lao vào..."}
                                className="form-textarea"
                                style={{ height: '100px', width: '95%' }}
                            />
                        </div>

                        <div className="items-selector-wrap" style={{ flex: 1 }}>
                            <label className="slot-title">TRANG BỊ LÕI ({formData.counterItems.length}):</label>
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

                    <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                        <button type="submit" className={`btn-cyber ${editingId ? 'btn-update' : 'btn-save-matchup'}`} style={{ flex: 1, height: '50px', fontSize: '18px', background: editingId ? '#f59e0b' : '#10b981', color: '#000' }}>
                            {editingId ? '🔄 CẬP NHẬT CHIẾN THUẬT' : (formData.type === 'synergy' ? 'LƯU COMBO ĐỒNG ĐỘI' : 'LƯU CHIẾN THUẬT ĐỐI ĐẦU')}
                        </button>
                        {editingId && (
                            <button type="button" className="btn-cyber btn-cancel" onClick={cancelEdit} style={{ flex: 1, height: '50px', fontSize: '18px' }}>
                                ❌ HỦY CHỈNH SỬA
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <div className="source-toggle-bar">
                <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ CỦA TÔI</button>
                <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 HỆ THỐNG</button>
                {user?.role === 'admin' && (
                    <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 CỘNG ĐỒNG</button>
                )}
            </div>

            {/* 🌟 BỘ LỌC CHIẾN THUẬT 🌟 */}
            <div className="filter-bar" style={{ marginBottom: '25px', display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍 Tìm tên tướng hoặc ghi chú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                    style={{ flex: '2', minWidth: '250px' }}
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                    style={{ flex: '1', minWidth: '150px' }}
                >
                    <option value="">🛡️ TẤT CẢ VAI TRÒ</option>
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select
                    value={laneFilter}
                    onChange={(e) => setLaneFilter(e.target.value)}
                    className="filter-select"
                    style={{ flex: '1', minWidth: '150px' }}
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
                                className={`strategy-card border-${viewMode}`}
                                onClick={() => setViewingStrat(strat)} // 🌟 THÊM DÒNG NÀY
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="strat-header">
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span className="strat-type-badge">{getStrategyTitle(strat.type)}</span>
                                        <span className="score-badge">ĐIỂM: {strat.score || 5}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-edit-mini" onClick={() => handleEditClick(strat)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                                        <button className="btn-del-mini" onClick={() => handleDelete(strat._id)} title="Xóa">🗑️</button>
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
                        <div className="empty-state-msg" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                            Không tìm thấy chiến thuật nào phù hợp.
                        </div>
                    )}
                </div>
            </section>

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
            {/* 🌟 MODAL CHI TIẾT CHIẾN THUẬT NÂNG CẤP 🌟 */}
            {viewingStrat && (
                <div className="hero-detail-overlay" onClick={() => setViewingStrat(null)}>
                    <div className="hero-detail-modal cyber-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', border: '1px solid #f59e0b' }}>
                        <button className="close-modal-btn" onClick={() => setViewingStrat(null)}>×</button>

                        <div className="modal-header" style={{ background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)', borderBottomColor: '#f59e0b', padding: '20px 30px' }}>
                            <div className="header-info" style={{ textAlign: 'center', width: '100%' }}>
                                <h2 className="hero-name-large" style={{ color: '#f59e0b', fontSize: '24px' }}>{getStrategyTitle(viewingStrat.type)}</h2>
                                <div className="hero-badges" style={{ justifyContent: 'center', marginTop: '10px' }}>
                                    <span className="badge" style={{ background: '#78350f', color: '#fcd34d' }}>Hiệu quả: {viewingStrat.score}/5 ⭐</span>
                                    <span className="badge" style={{ background: '#1e293b', color: '#94a3b8' }}>{viewingStrat.isSystem ? 'Hệ thống' : `Bởi: ${viewingStrat.author?.username || 'Người chơi'}`}</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body-scroll" style={{ padding: '25px', overflowY: 'auto', maxHeight: '70vh' }}>

                            {/* 1. HIỂN THỊ LẠI ĐỘI HÌNH TRONG MODAL */}
                            <h3 className="section-title" style={{ borderColor: '#38bdf8' }}>🎮 ĐỘI HÌNH THAM CHIẾU</h3>
                            <div className="strat-teams" style={{ margin: '0 0 25px 0', padding: '20px', borderRadius: '12px' }}>
                                <div className="team-display ally-team">
                                    {viewingStrat.teamA.map((h, i) => (
                                        <div key={i} className="strat-hero-icon-wrap">
                                            <img src={getImgUrl(h?.avatar)} alt={h?.name} style={{ width: '55px', height: '55px' }} />
                                            <span className="strat-hero-name" style={{ opacity: 1, visibility: 'visible', position: 'static', marginTop: '5px', border: 'none', background: 'transparent' }}>
                                                {h?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {viewingStrat.type !== 'synergy' && (
                                    <>
                                        <div className="strat-vs-icon" style={{ margin: '10px 0', fontSize: '16px' }}>VS</div>
                                        <div className="team-display enemy-team">
                                            {viewingStrat.teamB.map((h, i) => (
                                                <div key={i} className="strat-hero-icon-wrap">
                                                    <img src={getImgUrl(h?.avatar)} alt={h?.name} style={{ width: '55px', height: '55px' }} />
                                                    <span className="strat-hero-name" style={{ opacity: 1, visibility: 'visible', position: 'static', marginTop: '5px', border: 'none', background: 'transparent' }}>
                                                        {h?.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 2. HIỂN THỊ GHI CHÚ (FIX LỖI TRÀN CHỮ) */}
                            <h3 className="section-title" style={{ borderColor: '#f59e0b' }}>📖 PHÂN TÍCH CHI TIẾT</h3>
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                padding: '20px',
                                borderRadius: '10px',
                                color: '#e2e8f0',
                                lineHeight: '1.7',
                                fontSize: '15px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',      /* Tự động bẻ từ dài */
                                overflowWrap: 'anywhere',     /* Đảm bảo không tràn khung */
                                marginBottom: '25px',
                                border: '1px solid #334155'
                            }}>
                                {viewingStrat.note}
                            </div>

                            {/* 3. TRANG BỊ ĐÍNH KÈM */}
                            <h3 className="section-title" style={{ borderColor: '#10b981' }}>🛡️ TRANG BỊ KHUYÊN DÙNG</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                                {viewingStrat.counterItems?.length > 0 ? viewingStrat.counterItems.map((item, idx) => {
                                    const fullItem = items.find(i => i._id === (item._id || item));
                                    return (
                                        <div key={idx} style={{ textAlign: 'center', background: '#0b0f19', padding: '12px 8px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                            <img src={getImgUrl(fullItem?.icon)} alt="icon" style={{ width: '40px', height: '40px', borderRadius: '6px', marginBottom: '8px' }} />
                                            <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullItem?.name}</div>
                                        </div>
                                    );
                                }) : <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Không có trang bị đính kèm.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStrategies;