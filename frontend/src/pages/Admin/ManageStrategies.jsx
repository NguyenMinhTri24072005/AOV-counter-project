import React, { useState, useEffect, useContext } from 'react';
import { getHeroes, getItems, getStrategies, createStrategy, deleteStrategy } from '../../services/api';
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

    // Khởi tạo mặc định: Đội hình vs Đội hình (2 slot mỗi bên)
    const [formData, setFormData] = useState({
        type: 'combo_counter',
        teamA: [null, null],
        teamB: [null, null],
        score: 5, // <-- THÊM DÒNG NÀY
        note: '',
        counterItems: []
    });

    useEffect(() => {
        if (user) loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            const [hRes, iRes, sRes] = await Promise.all([
                getHeroes(),
                getItems(),
                getStrategies('pro', user?.id) // Lấy toàn bộ chiến thuật
            ]);
            setHeroes(hRes.data);
            setItems(iRes.data);
            setStrategies(sRes.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu: ", err);
        }
    };

    // Lọc theo Nguồn (Của tôi / Hệ thống / Cộng đồng)
    const filteredStrategies = strategies.filter(strat => {
        if (viewMode === 'personal') return strat.author?._id === user?.id || strat.author === user?.id;
        if (viewMode === 'system') return strat.isSystem;
        if (viewMode === 'community') return !strat.isSystem;
        return true;
    });

    // Hàm chuyển đổi giao diện dựa theo Loại chiến thuật
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Loại bỏ các ô trống (null) trước khi gửi
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
            await createStrategy(payload);
            alert("✅ Đã ghi danh chiến thuật vào hệ thống!");

            // TỐI ƯU HÓA: Reset sạch sẽ toàn bộ Form trong 1 lần duy nhất
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

            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi tạo chiến thuật");
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

    // UI RENDER: Hàm vẽ dãy tướng cho Combo (Hỗ trợ thêm/xóa linh hoạt)
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
                        {/* Nút Xóa Tướng Khỏi Combo (Chỉ hiện khi lớn hơn số lượng tối thiểu) */}
                        {formData[teamKey].length > (formData.type === 'skill_matchup' ? 1 : 2) && (
                            <button type="button" className="btn-remove-slot" onClick={() => {
                                const newTeam = formData[teamKey].filter((_, i) => i !== idx);
                                setFormData({ ...formData, [teamKey]: newTeam });
                            }}>×</button>
                        )}
                        {/* Biểu tượng + gắn kết combo */}
                        {idx < formData[teamKey].length - 1 && formData.type !== 'skill_matchup' && (
                            <div className="combo-plus-icon">+</div>
                        )}
                    </div>
                ))}

                {/* Nút Thêm Tướng (Tối đa 5) */}
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
                {/* THANH CHỌN LOẠI CHIẾN THUẬT */}
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

                <form onSubmit={handleSubmit} className="cyber-form-layout" style={{ marginTop: '25px' }}>
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

                    {/* THANH CHỌN ĐIỂM CHIẾN THUẬT */}
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

                    <div style={{ marginTop: '20px' }}>
                        <button type="submit" className="btn-cyber btn-save-matchup" style={{ width: '100%', height: '50px', fontSize: '18px', background: '#10b981', color: '#000' }}>
                            {formData.type === 'synergy' ? 'LƯU COMBO ĐỒNG ĐỘI' : 'LƯU CHIẾN THUẬT ĐỐI ĐẦU'}
                        </button>
                    </div>
                </form>
            </section>

            {/* DANH SÁCH BÊN DƯỚI */}
            <div className="source-toggle-bar">
                <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ CỦA TÔI</button>
                <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 HỆ THỐNG</button>
                {user?.role === 'admin' && (
                    <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 CỘNG ĐỒNG</button>
                )}
            </div>

            <section className="admin-list-section">
                <div className="strategy-cards-grid">
                    {filteredStrategies.length > 0 ? (
                        filteredStrategies.map(strat => (
                            <div key={strat._id} className={`strategy-card border-${viewMode}`}>
                                <div className="strat-header">
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span className="strat-type-badge">{getStrategyTitle(strat.type)}</span>
                                        <span className="score-badge">ĐIỂM: {strat.score || 5}</span>
                                    </div>
                                    <button className="btn-del-mini" onClick={() => handleDelete(strat._id)}>🗑️</button>
                                </div>

                                <div className="strat-teams">
                                    {/* BÊN TRÁI: ĐỘI TA */}
                                    <div className="team-display ally-team">
                                        {strat.teamA.map((h, i) => (
                                            <div key={i} className="strat-hero-icon-wrap">
                                                <img src={getImgUrl(h.avatar)} alt={h.name} title={h.name} />
                                                <span className="strat-hero-name">{h.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* BÊN PHẢI: ĐỐI THỦ */}
                                    {strat.type !== 'synergy' && (
                                        <>
                                            <div className="strat-vs-icon">{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                                            <div className="team-display enemy-team">
                                                {strat.teamB.map((h, i) => (
                                                    <div key={i} className="strat-hero-icon-wrap">
                                                        <img src={getImgUrl(h.avatar)} alt={h.name} title={h.name} />
                                                        <span className="strat-hero-name">{h.name}</span>
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
                        <div className="empty-state-msg" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Chưa có dữ liệu chiến thuật nào.</div>
                    )}
                </div>
            </section>

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
        </div>
    );
};

export default ManageStrategies;