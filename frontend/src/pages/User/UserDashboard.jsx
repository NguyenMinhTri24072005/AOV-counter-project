import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
// 🌟 ĐÃ BỔ SUNG updateMatchup VÀO ĐÂY
import { getHeroes, getItems, createMatchup, deleteMatchup, updateMatchup, getCounters, uploadImage, getUserProfile, updateUserInfo, changePassword } from '../../services/api';
import HeroSelect from '../../components/HeroSelect';
import ItemModal from '../../components/ItemModal';
import ManageStrategies from '../Admin/ManageStrategies';
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

    const [activeTab, setActiveTab] = useState('matchups'); 
    const [viewMode, setViewMode] = useState('personal');

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    const [profileData, setProfileData] = useState({ username: '', email: '' });
    const [pwdData, setPwdData] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
    const [userAvatar, setUserAvatar] = useState(user?.avatar || '');

    // 🌟 STATE CHO POPUP XEM CHI TIẾT
    const [viewingDetail, setViewingDetail] = useState(null);

    // 🌟 STATE CHO MODAL FORM
    const [isFormOpen, setIsFormOpen] = useState(false);
    const initialForm = {
        enemyHeroId: '',
        counterHeroId: '',
        score: 5,
        note: '',
        counterItems: []
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (user) {
            loadData();
            loadProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [hRes, iRes, mRes] = await Promise.all([
                // 🌟 SỬA THÀNH 'all' ĐỂ LOAD ĐƯỢC CẢ TAB HỆ THỐNG/CỘNG ĐỒNG
                getHeroes(), getItems(), getCounters([], [], 'all') 
            ]);

            setHeroes(hRes.data.data ? hRes.data.data : hRes.data);
            setItems(iRes.data.data ? iRes.data.data : iRes.data);
            setMyMatchups(mRes.data.data ? mRes.data.data : mRes.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu cá nhân:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async () => {
        try {
            const res = await getUserProfile();
            setProfileData({ username: res.data.username, email: res.data.email || '' });
            if (res.data.avatar) setUserAvatar(res.data.avatar);
        } catch (error) {
            console.error("Lỗi tải profile:", error);
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

    // 🌟 LOGIC LỌC DỮ LIỆU ĐA CHIỀU (TƯƠNG TỰ BÊN ADMIN)
    const filteredResults = myMatchups.map(group => ({
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

    const handleToggleItem = (itemId) => {
        setFormData(prev => ({
            ...prev, counterItems: prev.counterItems.includes(itemId)
                ? prev.counterItems.filter(id => id !== itemId) : [...prev.counterItems, itemId]
        }));
    };

    // 🌟 CÁC HÀM XỬ LÝ FORM MODAL
    const openAddForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (detail, groupHeroId) => {
        setFormData({
            enemyHeroId: detail.enemyId,
            counterHeroId: groupHeroId, 
            score: detail.score,
            note: detail.note,
            counterItems: detail.counterItems || []
        });
        setEditingId(detail._id);
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
    };

    const handleSubmitMatchup = async (e) => {
        e.preventDefault();

        if (!formData.enemyHeroId || !formData.counterHeroId) {
            return toast.warning("⚠️ Vui lòng chọn đầy đủ Tướng Địch và Tướng Của Bạn!");
        }

        try {
            const payload = { ...formData, author: user?.id || user?._id };
            
            if (editingId) {
                await updateMatchup(editingId, payload);
                toast.success("Đã cập nhật bí kíp thành công!");
            } else {
                await createMatchup(payload);
                toast.success("Đã thêm bí kíp mới!");
            }

            setFormData(initialForm);
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            console.error("Lỗi khi lưu bí kíp:", err);
            toast.error(err.response?.data?.message || "Lỗi khi lưu bí kíp");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn muốn xóa bí kíp này?")) return;
        try {
            await deleteMatchup(id); 
            toast.success("Đã xóa bí kíp!");
            loadData();
        } catch (err) { toast.error("Lỗi khi xóa"); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateUserInfo(user.id || user._id, { username: profileData.username, email: profileData.email });
            toast.success("Cập nhật thông tin thành công!");
        } catch (error) { toast.error(error.response?.data?.message || "Lỗi cập nhật thông tin"); }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);
            const upRes = await uploadImage(uploadData);
            const newAvatarUrl = upRes.data.url;
            setUserAvatar(newAvatarUrl);
            await updateUserInfo(user.id || user._id, { avatar: newAvatarUrl });
            toast.success("Đã cập nhật Ảnh đại diện vĩnh viễn!");
        } catch (error) { toast.error("Lỗi tải ảnh lên."); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwdData.newPwd !== pwdData.confirmPwd) return toast.warning("Mật khẩu xác nhận không khớp!");
        try {
            await changePassword({ oldPassword: pwdData.oldPwd, newPassword: pwdData.newPwd });
            toast.success("Đổi mật khẩu thành công!");
            setPwdData({ oldPwd: '', newPwd: '', confirmPwd: '' });
        } catch (error) { toast.error(error.response?.data?.message || "Lỗi đổi mật khẩu"); }
    };

    return (
        <div className="user-dashboard-container">
            <header className="user-profile-header">
                <div className="profile-card">
                    <div className="profile-avatar-wrapper">
                        <label htmlFor="avatar-upload" className="avatar-upload-label" title="Đổi ảnh đại diện">
                            {userAvatar ? (
                                <img src={getImgUrl(userAvatar)} alt="avatar" className="user-avatar-img" />
                            ) : (
                                <div className="profile-avatar-text">{user?.username?.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="avatar-overlay">📷</div>
                        </label>
                        <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>

                    <div className="profile-info">
                        <h2>COACH: <span className="highlight-text">{profileData.username || user?.username}</span></h2>
                        <div className="profile-meta">
                            <span className="rank-tag">RANK: BẬC THẦY CHIẾN THUẬT</span>
                            <span className="date-tag">GIA NHẬP: {new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-actions-wrapper">
                    <div className="stat-box">
                        <span className="stat-value">{filteredResults.reduce((acc, curr) => acc + curr.matchupDetails.length, 0)}</span>
                        <span className="stat-label">BÍ KÍP ĐÃ LƯU</span>
                    </div>
                </div>
            </header>

            <div className="user-tabs-container">
                <button className={`tab-btn tab-btn-matchups ${activeTab === 'matchups' ? 'active' : ''}`} onClick={() => setActiveTab('matchups')}>🔥 BÍ KÍP 1V1</button>
                <button className={`tab-btn tab-btn-strategies ${activeTab === 'strategies' ? 'active' : ''}`} onClick={() => setActiveTab('strategies')}>🧠 CHIẾN THUẬT TEAM</button>
                <button className={`tab-btn tab-btn-profile ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>⚙️ QUẢN LÝ TÀI KHOẢN</button>
            </div>

            {activeTab === 'profile' && (
                <section className="battlefield-form-box profile-setting-box">
                    <h3 className="section-title profile-title">🛡️ THIẾT LẬP HỒ SƠ CHỈ HUY</h3>
                    <form onSubmit={handleUpdateProfile} className="profile-form-layout">
                        <div className="form-row">
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">TÊN CHỈ HUY (USERNAME):</label>
                                <input type="text" value={profileData.username} required onChange={e => setProfileData({ ...profileData, username: e.target.value })} className="filter-input input-profile" />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">ĐỊA CHỈ EMAIL:</label>
                                <input type="email" value={profileData.email} required onChange={e => setProfileData({ ...profileData, email: e.target.value })} className="filter-input input-profile" />
                            </div>
                        </div>
                        <button type="submit" className="btn-cyber btn-save-profile">💾 LƯU THÔNG TIN CÁ NHÂN</button>
                    </form>
                    <hr style={{ borderColor: '#334155', margin: '40px 0 30px 0', borderStyle: 'dashed' }} />
                    <h3 className="section-title profile-title" style={{ color: '#38bdf8', borderColor: '#38bdf8' }}>🔑 ĐỔI MẬT KHẨU BẢO MẬT</h3>
                    <form onSubmit={handlePasswordChange} className="profile-form-layout pwd-update-box">
                        <div className="form-row">
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">MẬT KHẨU CŨ:</label>
                                <input type="password" required value={pwdData.oldPwd} onChange={e => setPwdData({ ...pwdData, oldPwd: e.target.value })} className="filter-input input-profile" placeholder="Nhập mật khẩu hiện tại..." />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title blue">MẬT KHẨU MỚI:</label>
                                <input type="password" required value={pwdData.newPwd} onChange={e => setPwdData({ ...pwdData, newPwd: e.target.value })} className="filter-input input-profile" placeholder="Nhập mật khẩu mới..." />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title red">XÁC NHẬN MẬT KHẨU:</label>
                                <input type="password" required value={pwdData.confirmPwd} onChange={e => setPwdData({ ...pwdData, confirmPwd: e.target.value })} className="filter-input input-profile" placeholder="Nhập lại mật khẩu mới..." />
                            </div>
                        </div>
                        <button type="submit" className="btn-cyber btn-save-profile" style={{ background: '#38bdf8', color: '#000' }}>🔄 XÁC NHẬN ĐỔI MẬT KHẨU</button>
                    </form>
                </section>
            )}

            {activeTab === 'matchups' && (
                <>
                    <div className="source-toggle-bar">
                        <button className={`toggle-btn ${viewMode === 'personal' ? 'active personal' : ''}`} onClick={() => setViewMode('personal')}>🛡️ KÈO CỦA TÔI</button>
                        <button className={`toggle-btn ${viewMode === 'system' ? 'active system' : ''}`} onClick={() => setViewMode('system')}>🤖 KÈO HỆ THỐNG</button>
                        <button className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`} onClick={() => setViewMode('community')}>👥 KÈO CỘNG ĐỒNG</button>
                    </div>

                    <div className="filter-bar filter-bar-user">
                        <input type="text" placeholder="🔍 Tìm kiếm bí kíp..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input search-input" />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                            <option value="">🛡️ TẤT CẢ VAI TRÒ</option>
                            {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)} className="filter-select">
                            <option value="">🗺️ TẤT CẢ ĐƯỜNG</option>
                            {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                        </select>
                    </div>

                    <section className="personal-matchups-section">
                        <div className="flex-row-gap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="section-title m-0-b-5" style={{ marginBottom: 0, paddingLeft: 0, borderLeft: 'none' }}>
                                📔 TỪ ĐIỂN KÈO KHẮC CHẾ (1V1)
                            </h3>
                            <button onClick={openAddForm} className="btn-save" style={{ background: '#38bdf8', padding: '10px 20px', borderRadius: '8px' }}>
                                ➕ THÊM BÍ KÍP MỚI
                            </button>
                        </div>

                        {loading ? (
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
                                                        <span className="score-label">TRUNG BÌNH: {group.totalScore}đ</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-details">
                                                {group.matchupDetails.map((d, idx) => {
                                                    const enemyHero = heroes.find(h => h._id === d.enemyId);
                                                    
                                                    // KIỂM TRA QUYỀN SỞ HỮU TRƯỚC KHI HIỆN NÚT SỬA/XÓA
                                                    const authorId = d.authorId || d.author?._id || d.author;
                                                    const isOwner = authorId === user?.id;

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
                                                                
                                                                {isOwner && (
                                                                    <div className="strat-header-actions">
                                                                        <button className="btn-edit-mini btn-transparent-mini" onClick={(e) => { e.stopPropagation(); handleEditClick(d, group.hero._id); }} title="Sửa">✏️</button>
                                                                        <button className="btn-del-mini" onClick={(e) => { e.stopPropagation(); handleDelete(d._id); }} title="Xóa">🗑️</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="note-text matchup-note-txt">"{d.note}"</p>
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
                                        Không tìm thấy bí kíp nào khớp với bộ lọc của bạn.
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* 🌟 FORM THÊM/SỬA KÈO NẰM TRONG MODAL 🌟 */}
                    {isFormOpen && (
                        <div className="card-detail-overlay" onClick={closeFormModal} style={{ zIndex: 10000 }}>
                            <div className="cyber-panel strat-modal-panel" onClick={e => e.stopPropagation()} style={{ background: '#0f172a', width: '90%', maxWidth: '800px', maxHeight: '90vh', padding: '30px', borderRadius: '12px', overflowY: 'auto', border: `2px solid ${editingId ? '#f59e0b' : '#38bdf8'}`, position: 'relative' }}>
                                <button className="close-modal-btn" onClick={closeFormModal}>×</button>
                                <h2 style={{ color: editingId ? '#f59e0b' : '#38bdf8', marginBottom: '25px', fontFamily: 'Oswald', textTransform: 'uppercase' }}>
                                    {editingId ? `✏️ CẬP NHẬT BÍ KÍP 1V1` : '➕ THÊM BÍ KÍP 1V1 MỚI'}
                                </h2>
                                <form onSubmit={handleSubmitMatchup} className="cyber-form-layout">
                                    <div className="matchup-vs-display">
                                        <div className="slot-item">
                                            <span className="slot-title red">ĐỐI THỦ</span>
                                            <HeroSelect heroes={heroes} selectedHeroId={formData.enemyHeroId} isEnemy={true} onChange={id => setFormData({ ...formData, enemyHeroId: id })} />
                                        </div>
                                        <div className="vs-logo">VS</div>
                                        <div className="slot-item">
                                            <span className="slot-title blue">TƯỚNG BẠN CHỌN</span>
                                            <HeroSelect heroes={heroes} selectedHeroId={formData.counterHeroId} onChange={id => setFormData({ ...formData, counterHeroId: id })} />
                                        </div>
                                        <div className="score-picker-column">
                                            <span className="slot-title yellow">HIỆU QUẢ (1-5)</span>
                                            <div className="cyber-score-bar">
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <button key={num} type="button" className={`score-node ${formData.score === num ? 'active' : ''}`} onClick={() => setFormData({ ...formData, score: num })}>
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-bottom-row mt-20">
                                        <div className="textarea-wrap form-col flex-2">
                                            <label className="slot-title">MẸO KHẮC CHẾ:</label>
                                            <textarea value={formData.note} required onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="VD: Bám sát và dồn sát thương..." className="form-textarea matchup-textarea" />
                                        </div>
                                        <div className="items-selector-wrap form-col flex-1">
                                            <label className="slot-title">TRANG BỊ ({formData.counterItems.length}):</label>
                                            <div className="selected-items-row items-col-layout">
                                                <button type="button" className="btn-open-item-modal btn-full" onClick={() => setIsItemModalOpen(true)}>➕ Chọn Trang Bị</button>
                                                <div className="mini-item-list mini-item-wrap">
                                                    {formData.counterItems.map(itemId => {
                                                        const it = items.find(i => i._id === itemId);
                                                        return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} className="match-item-icon mini-item-img" />;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-submit-row">
                                        <button type="submit" className="btn-cyber btn-submit-large bg-emerald" style={{ color: '#000', flex: 1, height: '50px', fontSize: '18px' }}>
                                            {editingId ? '🔄 CẬP NHẬT BÍ KÍP' : 'XÁC NHẬN LƯU VÀO BÍ KÍP'}
                                        </button>
                                        <button type="button" className="btn-cyber btn-cancel btn-submit-large" style={{ flex: 1, height: '50px', fontSize: '18px' }} onClick={closeFormModal}>
                                            ❌ HỦY BỎ
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'strategies' && (
                <ManageStrategies />
            )}

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />

            {/* 🌟 GIAO DIỆN MODAL XEM CHI TIẾT 🌟 */}
            {viewingDetail && (
                <div className="hero-detail-overlay" onClick={() => setViewingDetail(null)} style={{ zIndex: 10000 }}>
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

export default UserDashboard;