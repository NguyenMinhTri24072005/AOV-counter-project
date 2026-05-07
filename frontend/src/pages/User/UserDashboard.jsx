import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getHeroes, getItems, createMatchup, deleteMatchup, getCounters, uploadImage } from '../../services/api';
import HeroSelect from '../../components/HeroSelect';
import ItemModal from '../../components/ItemModal';
import ManageStrategies from '../Admin/ManageStrategies'; // IMPORT TAB CHIẾN THUẬT NÂNG CAO
import './UserDashboard.css';
import '../Admin/Admin.css';

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=None';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [myMatchups, setMyMatchups] = useState([]);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // STATE CHO TAB NAVIGATION
    const [activeTab, setActiveTab] = useState('matchups'); // 'matchups' hoặc 'strategies'

    // STATE CHO BỘ LỌC
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    // STATE CHO PROFILE (Đổi mật khẩu & Avatar)
    const [showPwdForm, setShowPwdForm] = useState(false);
    const [pwdData, setPwdData] = useState({ oldPwd: '', newPwd: '' });
    const [userAvatar, setUserAvatar] = useState(user?.avatar || ''); // Chờ backend có trường avatar

    const [formData, setFormData] = useState({
        enemyHeroId: '',
        heroId: '',
        score: 5,
        note: '',
        counterItems: []
    });

    useEffect(() => {
        if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [hRes, iRes, mRes] = await Promise.all([
                getHeroes(), 
                getItems(), 
                getCounters([], [], 'custom', user?.id)
            ]);
            setHeroes(hRes.data);
            setItems(iRes.data);
            setMyMatchups(mRes.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu cá nhân:", err);
        } finally {
            setLoading(false);
        }
    };

    // LOGIC TRÍCH XUẤT ROLE & LANE TỪ DANH SÁCH TƯỚNG CHO DROPDOWN
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

    // LOGIC LỌC DỮ LIỆU BÍ KÍP CÁ NHÂN
    const filteredResults = myMatchups.filter(group => {
        if (group.matchupDetails.length === 0) return false;
        
        const fullHero = heroes.find(h => h._id === group.hero._id);
        const matchName = group.hero.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          group.matchupDetails.some(d => heroes.find(h => h._id === d.enemyId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchRole = roleFilter ? fullHero?.roles?.some(r => (r.name || r) === roleFilter || r._id === roleFilter) : true;
        const matchLane = laneFilter ? fullHero?.lane?.includes(laneFilter) : true;

        return matchName && matchRole && matchLane;
    });

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
            const payload = { 
                enemyHeroId: formData.enemyHeroId,
                counterHeroId: formData.heroId, 
                score: formData.score,
                note: formData.note,
                counterItems: formData.counterItems,
                author: user?.id 
            };
            await createMatchup(payload);
            alert("Đã thêm bí kíp mới!");
            setFormData({ enemyHeroId: '', heroId: '', score: 5, note: '', counterItems: [] });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu bí kíp");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn muốn xóa bí kíp này?")) return;
        try {
            await deleteMatchup(id);
            loadData();
        } catch (err) {
            alert("Lỗi khi xóa");
        }
    };

    // XỬ LÝ ẢNH ĐẠI DIỆN VÀ MẬT KHẨU (UI)
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);
            const upRes = await uploadImage(uploadData);
            setUserAvatar(upRes.data.url);
            alert("Đã tải ảnh lên thành công! (Cần cập nhật Backend để lưu vĩnh viễn)");
        } catch (error) {
            alert("Lỗi tải ảnh lên.");
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (pwdData.oldPwd === pwdData.newPwd) {
            return alert("Mật khẩu mới phải khác mật khẩu cũ!");
        }
        alert("Gửi yêu cầu đổi mật khẩu thành công! (Cần cập nhật Backend để hoạt động thực tế)");
        setPwdData({ oldPwd: '', newPwd: '' });
        setShowPwdForm(false);
    };

    return (
        <div className="user-dashboard-container">
            {/* PHẦN 1: THÔNG TIN COMMANDER */}
            <header className="user-profile-header">
                <div className="profile-card">
                    {/* Bọc Avatar trong label để click tải ảnh */}
                    <div className="profile-avatar-wrapper">
                        <label htmlFor="avatar-upload" className="avatar-upload-label" title="Đổi ảnh đại diện">
                            {userAvatar ? (
                                <img src={getImgUrl(userAvatar)} alt="avatar" className="user-avatar-img" />
                            ) : (
                                <div className="profile-avatar-text">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="avatar-overlay">📷</div>
                        </label>
                        <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>

                    <div className="profile-info">
                        <h2>COACH: <span className="highlight-text">{user?.username}</span></h2>
                        <div className="profile-meta">
                            <span className="rank-tag">RANK: BẬC THẦY CHIẾN THUẬT</span>
                            <span className="date-tag">GIA NHẬP: {new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-actions-wrapper">
                    <div className="stat-box">
                        <span className="stat-value">{myMatchups.reduce((acc, curr) => acc + curr.matchupDetails.length, 0)}</span>
                        <span className="stat-label">BÍ KÍP 1V1 ĐÃ LƯU</span>
                    </div>
                    <button className="btn-cyber btn-pwd-toggle" onClick={() => setShowPwdForm(!showPwdForm)}>
                        {showPwdForm ? 'ĐÓNG FORM' : '🔑 ĐỔI MẬT KHẨU'}
                    </button>
                </div>
            </header>

            {/* FORM ĐỔI MẬT KHẨU */}
            {showPwdForm && (
                <div className="password-change-box">
                    <h4>CẬP NHẬT MẬT KHẨU</h4>
                    <form onSubmit={handlePasswordChange} className="pwd-form">
                        <input type="password" placeholder="Nhập mật khẩu hiện tại..." required 
                            value={pwdData.oldPwd} onChange={e => setPwdData({...pwdData, oldPwd: e.target.value})} />
                        <input type="password" placeholder="Nhập mật khẩu mới..." required 
                            value={pwdData.newPwd} onChange={e => setPwdData({...pwdData, newPwd: e.target.value})} />
                        <button type="submit" className="btn-cyber btn-save-pwd">CẬP NHẬT</button>
                    </form>
                </div>
            )}

            {/* ĐIỀU HƯỚNG TAB */}
            <div className="user-tabs" style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <button 
                    className="btn-cyber"
                    onClick={() => setActiveTab('matchups')}
                    style={{ 
                        flex: 1, padding: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                        background: activeTab === 'matchups' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        border: `2px solid ${activeTab === 'matchups' ? '#38bdf8' : '#334155'}`,
                        color: activeTab === 'matchups' ? '#38bdf8' : '#94a3b8'
                    }}
                >
                    🔥 BÍ KÍP KHẮC CHẾ 1V1
                </button>
                <button 
                    className="btn-cyber"
                    onClick={() => setActiveTab('strategies')}
                    style={{ 
                        flex: 1, padding: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                        background: activeTab === 'strategies' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        border: `2px solid ${activeTab === 'strategies' ? '#10b981' : '#334155'}`,
                        color: activeTab === 'strategies' ? '#10b981' : '#94a3b8'
                    }}
                >
                    🧠 CHIẾN THUẬT NÂNG CAO (COMBO)
                </button>
            </div>

            {/* NỘI DUNG HIỂN THỊ TÙY THEO TAB */}
            {activeTab === 'matchups' && (
                <>
                    {/* PHẦN 2: CHIẾN TRƯỜNG MÔ PHỎNG (FORM TẠO KÈO 1V1) */}
                    <section className="battlefield-form-box">
                        <h3 className="section-title">➕ THÊM BÍ KÍP KHẮC CHẾ 1V1 MỚI</h3>
                        <form onSubmit={handleSubmit} className="cyber-form-layout">
                            <div className="matchup-vs-display">
                                <div className="slot-item">
                                    <span className="slot-title red">ĐỐI THỦ</span>
                                    <HeroSelect heroes={heroes} selectedHeroId={formData.enemyHeroId} isEnemy={true} onChange={id => setFormData({...formData, enemyHeroId: id})} />
                                </div>
                                <div className="vs-logo">VS</div>
                                <div className="slot-item">
                                    <span className="slot-title blue">TƯỚNG BẠN CHỌN</span>
                                    <HeroSelect heroes={heroes} selectedHeroId={formData.heroId} onChange={id => setFormData({...formData, heroId: id})} />
                                </div>
                                <div className="score-picker-column">
                                    <span className="slot-title yellow">HIỆU QUẢ (1-5)</span>
                                    <div className="cyber-score-bar">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button 
                                                key={num} type="button" 
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
                                    <label className="slot-title">MẸO KHẮC CHẾ:</label>
                                    <textarea value={formData.note} required onChange={e => setFormData({...formData, note: e.target.value})} placeholder="VD: Florentino rất sợ bị khống chế cứng, hãy giữ chiêu..." className="form-textarea" style={{ height: '100px', width: "70%"}} />
                                </div>
                                <div className="items-selector-wrap" style={{ flex: 1 }}>
                                    <label className="slot-title">TRANG BỊ ({formData.counterItems.length}):</label>
                                    <div className="selected-items-row">
                                        <button type="button" className="btn-open-item-modal" onClick={() => setIsItemModalOpen(true)} style={{ width: '100%' }}>➕ Chọn Trang Bị</button>
                                        <div className="mini-item-list" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {formData.counterItems.map(itemId => {
                                                const it = items.find(i => i._id === itemId);
                                                return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} className="match-item-icon" style={{ width: '38px', height: '38px', borderRadius: '6px' }} />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-cyber btn-save-matchup" style={{ width: '100%', height: '50px', fontSize: '18px', background: '#10b981', color: '#000' }}>XÁC NHẬN LƯU VÀO BÍ KÍP 1V1</button>
                        </form>
                    </section>

                    {/* BỘ LỌC TÌM KIẾM CHO BÍ KÍP CÁ NHÂN */}
                    <div className="filter-bar" style={{ marginBottom: '25px', display: 'flex', gap: '15px', background: 'rgba(30, 41, 59, 0.8)', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <input type="text" placeholder="🔍 Tìm kiếm bí kíp (Địch hoặc Ta)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input" style={{ flex: 1 }} />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                            <option value="">🛡️ TẤT CẢ VAI TRÒ</option>
                            {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)} className="filter-select">
                            <option value="">🗺️ TẤT CẢ ĐƯỜNG</option>
                            {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                        </select>
                    </div>

                    {/* PHẦN 3: DANH SÁCH BÍ KÍP CÁ NHÂN */}
                    <section className="personal-matchups-section">
                        <h3 className="section-title">📔 KHO BÍ KÍP 1V1 CỦA TÔI ({filteredResults.length})</h3>
                        {loading ? (
                            <div className="cyber-scanning-mini"><div className="scan-line"></div>ĐANG TRUY XUẤT DỮ LIỆU...</div>
                        ) : (
                            <div className="matchup-cards-grid">
                                {filteredResults.length > 0 ? (
                                    filteredResults.map(group => (
                                        <div key={group.hero._id} className="matchup-admin-card border-personal">
                                            <div className="card-top">
                                                <div className="hero-meta">
                                                    <img src={getImgUrl(group.hero.avatar)} alt="hero" className="main-hero-img" />
                                                    <div className="hero-meta-info">
                                                        <h4>{group.hero.name}</h4>
                                                        <span className="score-label">TRUNG BÌNH: {group.totalScore}đ</span>
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
                                                                <button className="btn-del-mini" onClick={() => handleDelete(d._id)}>🗑️</button>
                                                            </div>
                                                            <p className="note-text" style={{ fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1', marginTop: '5px' }}>"{d.note}"</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state-msg" style={{ gridColumn: '1 / -1' }}>
                                        Không tìm thấy bí kíp nào khớp với bộ lọc của bạn.
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* TAB CHIẾN THUẬT NÂNG CAO */}
            {activeTab === 'strategies' && (
                <ManageStrategies />
            )}

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
        </div>
    );
};

export default UserDashboard;