import React, { useState, useEffect, useMemo } from 'react';
import { getHeroes } from '../services/api';
import './Admin/Admin.css'; 

const getImgUrl = (url) => {
    if (!url) return 'https://placehold.co/50x50?text=Hero';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const HeroesPage = () => {
    const [heroes, setHeroes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedLane, setSelectedLane] = useState('');
    
    const [viewingHero, setViewingHero] = useState(null);

    // 🌟 STATE PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24; // Hiển thị 18 thẻ 1 trang

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const res = await getHeroes();
                // 🌟 SỬA DÒNG NÀY: Thêm .data vào cuối
                setHeroes(res.data.data); 
            } catch (err) {
                console.error("Lỗi khi tải tướng:", err);
            }
        };
        fetchHeroes();
    }, []);

    // 🌟 RESET TRANG KHI LỌC
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRole, selectedLane]);

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

    const filteredHeroes = heroes.filter(h => {
        const matchName = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = selectedRole ? h.roles?.some(r => (r.name || r) === selectedRole || r._id === selectedRole) : true;
        const matchLane = selectedLane ? h.lane?.includes(selectedLane) : true;
        return matchName && matchRole && matchLane;
    });

    // 🌟 CẮT MẢNG ĐỂ PHÂN TRANG
    const totalPages = Math.ceil(filteredHeroes.length / itemsPerPage);
    const currentHeroes = filteredHeroes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="admin-manage-container hero-page-container">
            <h2 className="admin-page-title">🛡️ TỪ ĐIỂN TƯỚNG ({filteredHeroes.length})</h2>
            
            <div className="filter-bar hero-page-filterbar">
                <input type="text" placeholder="🔍 Tìm tên tướng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-input search-hero-input" />
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="filter-select select-hero-input">
                    <option value="">🛡️ VAI TRÒ</option>
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={selectedLane} onChange={(e) => setSelectedLane(e.target.value)} className="filter-select select-hero-input">
                    <option value="">🗺️ ĐƯỜNG</option>
                    {allLanes.map(lane => <option key={lane} value={lane}>{lane}</option>)}
                </select>
            </div>

            {/* DANH SÁCH TƯỚNG */}
            <div className="hero-page-grid">
                {currentHeroes.length > 0 ? (
                    currentHeroes.map(hero => (
                        <div key={hero._id} className="hero-card-clickable hero-page-card" onClick={() => setViewingHero(hero)}>
                            <img src={getImgUrl(hero.avatar)} alt={hero.name} className="hero-page-img" />
                            <h3 className="hero-page-name">{hero.name}</h3>
                            <div className="hero-page-meta">
                                <span className="hero-page-role">{hero.roles?.map(r => r.name || r).join('/')}</span>
                                <span className="hero-page-lane">{hero.lane?.join(', ')}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-filter-msg">Không tìm thấy tướng nào.</div>
                )}
            </div>

            {/* THANH PHÂN TRANG */}
            {totalPages > 1 && (
                <div className="pagination-bar">
                    <button 
                        className="btn-page" 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        ◀ TRƯỚC
                    </button>
                    <span className="page-info">
                        TRANG {currentPage} / {totalPages}
                    </span>
                    <button 
                        className="btn-page" 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        SAU ▶
                    </button>
                </div>
            )}

            {/* MODAL CHI TIẾT TƯỚNG */}
            {viewingHero && (
                <div className="hero-detail-overlay" onClick={() => setViewingHero(null)}>
                    <div className="hero-detail-modal cyber-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewingHero(null)}>×</button>
                        
                        <div className="modal-header">
                            <img src={getImgUrl(viewingHero.avatar)} alt="avatar" className="modal-avatar" />
                            <div className="header-info">
                                <h2 className="hero-name-large">{viewingHero.name}</h2>
                                <div className="hero-badges">
                                    {viewingHero.roles?.map((r, i) => <span key={i} className="badge role">{r.name || r}</span>)}
                                    {viewingHero.lane?.map((l, i) => <span key={i} className="badge lane">{l}</span>)}
                                </div>
                            </div>
                        </div>

                        <div className="modal-body-scroll">
                            <h3 className="section-title">⚔️ BỘ KỸ NĂNG</h3>
                            <div className="skills-container">
                                {Object.entries(viewingHero.skills || {}).map(([key, value]) => {
                                    if (!value) return null;
                                    const [name, desc] = value.split(': ');
                                    const labelMap = {
                                        passive: 'Nội tại', skill1: 'Chiêu 1', skill2: 'Chiêu 2', skill3: 'Chiêu 3', skill4: 'Chiêu 4'
                                    };
                                    return (
                                        <div key={key} className="skill-item">
                                            <div className="skill-label">{labelMap[key]}</div>
                                            <div className="skill-content">
                                                <strong className="skill-name">{name}</strong>
                                                <p className="skill-desc">{desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroesPage;