import React, { useState, useContext } from 'react';
import { getCounters } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import HeroSelect from './HeroSelect';
import ModeToggle from './ModeToggle';
import './SoloCounter.css';

const getImgUrl = (url, type = 'hero') => {
    if (!url) return type === 'hero' ? 'https://placehold.co/80x80?text=Hero' : 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const SoloCounter = ({ heroes }) => {
    const { user } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('standard');
    const [sections, setSections] = useState([
        { id: Date.now(), enemyHeroId: "", results: [], loading: false }
    ]);

    const addSection = () => {
        setSections([...sections, { id: Date.now(), enemyHeroId: "", results: [], loading: false }]);
    };

    const removeSection = (id) => {
        if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
        else setSections([{ id: Date.now(), enemyHeroId: "", results: [], loading: false }]);
    };

    const updateEnemyId = (sectionId, heroId) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, enemyHeroId: heroId } : s));
    };

    const handleAnalyze = async (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section.enemyHeroId) return alert("Vui lòng chọn mục tiêu!");

        setSections(sections.map(s => s.id === sectionId ? { ...s, loading: true } : s));
        try {
            const response = await getCounters([section.enemyHeroId], [], viewMode, user?.id);
            setSections(sections.map(s => 
                s.id === sectionId ? { ...s, results: response.data, loading: false } : s
            ));
        } catch (error) {
            setSections(sections.map(s => s.id === sectionId ? { ...s, loading: false } : s));
        }
    };

    // Hàm render Card tướng, chỉ nhận vào các detail đã được lọc sẵn
    const renderHeroCard = (hero, filteredDetails, isSystemSide) => (
        <div key={hero._id} className={`counter-card-neon ${isSystemSide ? 'sys-card' : 'user-card'}`}>
            <div className="card-header">
                <div className="hero-info">
                    <div className="avatar-frame">
                        <img src={getImgUrl(hero.avatar)} alt={hero.name} className="hero-avatar-rect" />
                    </div>
                    <div className="name-wrap">
                        <h3 className="hero-name-highlight">{hero.name}</h3>
                        <span className="score-badge">ĐIỂM: {hero.totalScore}</span>
                    </div>
                </div>
            </div>
            <div className="card-body">
                {filteredDetails.map((detail, idx) => (
                    <div key={idx} className="matchup-detail-box">
                        <p className="detail-note">“{detail.note}”</p>
                        {detail.counterItems?.length > 0 && (
                            <div className="items-row">
                                {detail.counterItems.map(item => (
                                    <div key={item._id} className="item-gaming-card" title={item.passive}>
                                        <div className="item-icon-wrap">
                                            <img src={getImgUrl(item.icon, 'item')} alt={item.name} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isSystemSide && <div className="author-tag">CHIẾN THUẬT CỦA BẠN</div>}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="solo-counter-multi">
            <div className="global-controls">
                <ModeToggle mode={viewMode} setMode={setViewMode} />
                <button className="btn-cyber btn-add-section" onClick={addSection}>➕ THÊM MỤC SO SÁNH</button>
            </div>

            <div className="sections-list">
                {sections.map((section, index) => {
                    // 1. Lọc lấy các tướng có kèo của HỆ THỐNG
                    const systemSideHeroes = section.results.map(h => ({
                        ...h,
                        matchupDetails: h.matchupDetails.filter(d => d.isSystem)
                    })).filter(h => h.matchupDetails.length > 0);

                    // 2. Lọc lấy các tướng có kèo của CHÍNH USER ĐANG ĐĂNG NHẬP
                    const mySideHeroes = section.results.map(h => ({
                        ...h,
                        matchupDetails: h.matchupDetails.filter(d => !d.isSystem && (d.author === user?.id || d.authorId === user?.id))
                    })).filter(h => h.matchupDetails.length > 0);

                    return (
                        <div key={section.id} className="analysis-section-box">
                            <div className="section-header">
                                <span className="section-number">#{index + 1}</span>
                                <div className="section-input-group">
                                    <HeroSelect 
                                        label="MỤC TIÊU:" 
                                        heroes={heroes} 
                                        selectedHeroId={section.enemyHeroId} 
                                        onChange={(id) => updateEnemyId(section.id, id)} 
                                    />
                                    <button className="btn-cyber btn-analyze-small" onClick={() => handleAnalyze(section.id)} disabled={section.loading}>
                                        {section.loading ? 'ĐANG QUÉT...' : '🔍 PHÂN TÍCH'}
                                    </button>
                                </div>
                                <button className="btn-remove-section" onClick={() => removeSection(section.id)}>×</button>
                            </div>

                            <div className="section-results">
                                {section.loading ? (
                                    <div className="cyber-scanning-mini"><div className="scan-line"></div><p>TRUY XUẤT DỮ LIỆU...</p></div>
                                ) : section.results.length > 0 ? (
                                    <div className="comparison-container">
                                        <div className="comparison-col system-side">
                                            <h4 className="side-title">🤖 DỮ LIỆU HỆ THỐNG</h4>
                                            <div className="side-grid">
                                                {systemSideHeroes.length > 0 
                                                    ? systemSideHeroes.map(h => renderHeroCard(h, h.matchupDetails, true)) 
                                                    : <p className="no-data">Hệ thống chưa có dữ liệu kèo này.</p>}
                                            </div>
                                        </div>

                                        <div className="comparison-col community-side">
                                            <h4 className="side-title">🛡️ CHIẾN THUẬT CỦA TÔI</h4>
                                            <div className="side-grid">
                                                {user ? (
                                                    mySideHeroes.length > 0 
                                                        ? mySideHeroes.map(h => renderHeroCard(h, h.matchupDetails, false)) 
                                                        : <p className="no-data">Bạn chưa lưu chiến thuật nào cho kèo này.</p>
                                                ) : (
                                                    <p className="no-data">Vui lòng đăng nhập để xem chiến thuật cá nhân.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-section-msg">Chọn đối thủ và nhấn Phân tích để đối chiếu chiến thuật.</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SoloCounter;