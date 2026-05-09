import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getHeroes, getItems, createMatchup, deleteMatchup, getCounters, uploadImage, getUserProfile, updateUserInfo, changePassword } from '../../services/api';
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

    const [activeTab, setActiveTab] = useState('matchups'); // 'matchups', 'strategies', 'profile'

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    const [profileData, setProfileData] = useState({ username: '', email: '' });
    const [pwdData, setPwdData] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
    const [userAvatar, setUserAvatar] = useState(user?.avatar || '');

    // Sửa chữ heroId thành counterHeroId
    const [formData, setFormData] = useState({
        enemyHeroId: '', counterHeroId: '', score: 5, note: '', counterItems: []
    });

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
                getHeroes(), getItems(), getCounters([], [], 'custom', user?.id)
            ]);

            // 🌟 LỚP PHÒNG THỦ DỮ LIỆU CHỐNG LỖI .forEach is not a function
            const fetchedHeroes = hRes.data.data ? hRes.data.data : hRes.data;
            const fetchedItems = iRes.data.data ? iRes.data.data : iRes.data;
            const fetchedMatchups = mRes.data.data ? mRes.data.data : mRes.data;

            setHeroes(fetchedHeroes || []);
            setItems(fetchedItems || []);
            setMyMatchups(fetchedMatchups || []);
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

            // Lấy Avatar từ Database ra để hiển thị khi F5 tải lại trang
            if (res.data.avatar) {
                setUserAvatar(res.data.avatar);
            }
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
            ...prev, counterItems: prev.counterItems.includes(itemId)
                ? prev.counterItems.filter(id => id !== itemId) : [...prev.counterItems, itemId]
        }));
    };

    const handleSubmitMatchup = async (e) => {
        e.preventDefault();

        // 🌟 BỔ SUNG: Bắt lỗi nếu người dùng quên chọn tướng
        if (!formData.enemyHeroId || !formData.counterHeroId) {
            return alert("⚠️ Vui lòng chọn đầy đủ Tướng Địch và Tướng Của Bạn!");
        }

        try {
            await createMatchup({ ...formData, author: user?.id || user?._id });
            alert("Đã thêm bí kíp mới!");

            // 🌟 SỬA ĐỔI: Nhớ đổi heroId thành counterHeroId ở đây nữa
            setFormData({ enemyHeroId: '', counterHeroId: '', score: 5, note: '', counterItems: [] });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu bí kíp");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn muốn xóa bí kíp này?")) return;
        try {
            await deleteMatchup(id); loadData();
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            // Chỉ cập nhật Username và Email
            await updateUserInfo(user.id || user._id, {
                username: profileData.username,
                email: profileData.email
            });
            alert("Cập nhật thông biến thành công!");
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi cập nhật thông tin");
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            // 1. Tải ảnh lên thư mục uploads của server
            const upRes = await uploadImage(uploadData);
            const newAvatarUrl = upRes.data.url;

            // 2. Hiển thị ảnh ngay lập tức ra màn hình
            setUserAvatar(newAvatarUrl);

            // 3. GỌI API LƯU ĐƯỜNG LINK ẢNH VÀO DATABASE CỦA USER ĐỂ LƯU VĨNH VIỄN
            await updateUserInfo(user.id || user._id, {
                avatar: newAvatarUrl
            });

            alert("Đã cập nhật Ảnh đại diện vĩnh viễn!");
        } catch (error) {
            alert("Lỗi tải ảnh lên hoặc lưu ảnh.");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwdData.newPwd !== pwdData.confirmPwd) {
            return alert("Mật khẩu xác nhận không khớp!");
        }
        try {
            await changePassword({ oldPassword: pwdData.oldPwd, newPassword: pwdData.newPwd });
            alert("Đổi mật khẩu thành công!");
            setPwdData({ oldPwd: '', newPwd: '', confirmPwd: '' });
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi đổi mật khẩu");
        }
    };

    return (
        <div className="user-dashboard-container">
            {/* HEADER TỔNG QUAN */}
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
                        <span className="stat-value">{myMatchups.reduce((acc, curr) => acc + curr.matchupDetails.length, 0)}</span>
                        <span className="stat-label">BÍ KÍP ĐÃ LƯU</span>
                    </div>
                </div>
            </header>

            {/* ĐIỀU HƯỚNG TAB */}
            <div className="user-tabs-container">
                <button
                    className={`tab-btn tab-btn-matchups ${activeTab === 'matchups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('matchups')}
                >
                    🔥 BÍ KÍP 1V1
                </button>
                <button
                    className={`tab-btn tab-btn-strategies ${activeTab === 'strategies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('strategies')}
                >
                    🧠 CHIẾN THUẬT TEAM
                </button>
                <button
                    className={`tab-btn tab-btn-profile ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    ⚙️ QUẢN LÝ TÀI KHOẢN
                </button>
            </div>

            {/* NỘI DUNG HIỂN THỊ TÙY THEO TAB */}
            {activeTab === 'profile' && (
                <section className="battlefield-form-box profile-setting-box">

                    {/* --- FORM 1: CẬP NHẬT THÔNG TIN CƠ BẢN --- */}
                    <h3 className="section-title profile-title">🛡️ THIẾT LẬP HỒ SƠ CHỈ HUY</h3>
                    <form onSubmit={handleUpdateProfile} className="profile-form-layout">
                        <div className="form-row">
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">TÊN CHỈ HUY (USERNAME):</label>
                                <input type="text" value={profileData.username} required
                                    onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                                    className="filter-input input-profile"
                                />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">ĐỊA CHỈ EMAIL:</label>
                                <input type="email" value={profileData.email} required
                                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                    className="filter-input input-profile"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-cyber btn-save-profile">
                            💾 LƯU THÔNG TIN CÁ NHÂN
                        </button>
                    </form>

                    {/* ĐƯỜNG KẺ NGĂN CÁCH 2 FORM */}
                    <hr style={{ borderColor: '#334155', margin: '40px 0 30px 0', borderStyle: 'dashed' }} />

                    {/* --- FORM 2: ĐỔI MẬT KHẨU BẢO MẬT --- */}
                    <h3 className="section-title profile-title" style={{ color: '#38bdf8', borderColor: '#38bdf8' }}>🔑 ĐỔI MẬT KHẨU BẢO MẬT</h3>
                    <form onSubmit={handlePasswordChange} className="profile-form-layout pwd-update-box">
                        <div className="form-row">
                            <div className="textarea-wrap form-col">
                                <label className="slot-title yellow">MẬT KHẨU CŨ:</label>
                                <input type="password" required value={pwdData.oldPwd}
                                    onChange={e => setPwdData({ ...pwdData, oldPwd: e.target.value })}
                                    className="filter-input input-profile" placeholder="Nhập mật khẩu hiện tại..."
                                />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title blue">MẬT KHẨU MỚI:</label>
                                <input type="password" required value={pwdData.newPwd}
                                    onChange={e => setPwdData({ ...pwdData, newPwd: e.target.value })}
                                    className="filter-input input-profile" placeholder="Nhập mật khẩu mới..."
                                />
                            </div>
                            <div className="textarea-wrap form-col">
                                <label className="slot-title red">XÁC NHẬN MẬT KHẨU:</label>
                                <input type="password" required value={pwdData.confirmPwd}
                                    onChange={e => setPwdData({ ...pwdData, confirmPwd: e.target.value })}
                                    className="filter-input input-profile" placeholder="Nhập lại mật khẩu mới..."
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-cyber btn-save-profile" style={{ background: '#38bdf8', color: '#000' }}>
                            🔄 XÁC NHẬN ĐỔI MẬT KHẨU
                        </button>
                    </form>

                </section>
            )}

            {activeTab === 'matchups' && (
                <>
                    <section className="battlefield-form-box">
                        <h3 className="section-title">➕ THÊM BÍ KÍP KHẮC CHẾ 1V1 MỚI</h3>
                        <form onSubmit={handleSubmitMatchup} className="cyber-form-layout">
                            <div className="matchup-vs-display">
                                <div className="slot-item">
                                    <span className="slot-title red">ĐỐI THỦ</span>
                                    <HeroSelect heroes={heroes} selectedHeroId={formData.enemyHeroId} isEnemy={true} onChange={id => setFormData({ ...formData, enemyHeroId: id })} />
                                </div>
                                <div className="vs-logo">VS</div>
                                <div className="slot-item">
                                    <span className="slot-title blue">TƯỚNG BẠN CHỌN</span>
                                    {/* 🌟 SỬA LẠI TÊN BIẾN Ở DÒNG DƯỚI ĐÂY */}
                                    <HeroSelect
                                        heroes={heroes}
                                        selectedHeroId={formData.counterHeroId}
                                        onChange={id => setFormData({ ...formData, counterHeroId: id })}
                                    />
                                </div>
                                <div className="score-picker-column">
                                    <span className="slot-title yellow">HIỆU QUẢ (1-5)</span>
                                    <div className="cyber-score-bar">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button key={num} type="button" className={`score-node ${formData.score === num ? 'active' : ''}`}
                                                onClick={() => setFormData({ ...formData, score: num })}>
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-bottom-row">
                                <div className="textarea-wrap form-col flex-2">
                                    <label className="slot-title">MẸO KHẮC CHẾ:</label>
                                    <textarea value={formData.note} required onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="VD: Florentino rất sợ bị khống chế cứng..." className="form-textarea matchup-textarea" />
                                </div>
                                <div className="items-selector-wrap form-col">
                                    <label className="slot-title">TRANG BỊ ({formData.counterItems.length}):</label>
                                    <div className="selected-items-row">
                                        <button type="button" className="btn-open-item-modal full-width" onClick={() => setIsItemModalOpen(true)}>➕ Chọn Trang Bị</button>
                                        <div className="mini-item-list">
                                            {formData.counterItems.map(itemId => {
                                                const it = items.find(i => i._id === itemId);
                                                return <img key={itemId} src={getImgUrl(it?.icon)} alt="item" title={it?.name} className="match-item-icon" />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-cyber btn-save-matchup">XÁC NHẬN LƯU VÀO BÍ KÍP 1V1</button>
                        </form>
                    </section>

                    {/* BỘ LỌC TÌM KIẾM */}
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

                    {/* DANH SÁCH BÍ KÍP */}
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
                                                            <div className="detail-item-header">
                                                                <div className="enemy-info-mini">
                                                                    <span>Khắc chế:</span>
                                                                    <img src={getImgUrl(enemyHero?.avatar)} alt="enemy" className="enemy-avatar-mini" />
                                                                    <strong>{enemyHero?.name}</strong>
                                                                </div>
                                                                <button className="btn-del-mini" onClick={() => handleDelete(d._id)}>🗑️</button>
                                                            </div>
                                                            <p className="note-text">"{d.note}"</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state-msg">
                                        Không tìm thấy bí kíp nào khớp với bộ lọc của bạn.
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}

            {activeTab === 'strategies' && (
                <ManageStrategies />
            )}

            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} items={items} selectedItems={formData.counterItems} onToggle={handleToggleItem} />
        </div>
    );
};

export default UserDashboard;