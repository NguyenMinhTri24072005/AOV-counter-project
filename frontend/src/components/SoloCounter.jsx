import React, { useState, useContext } from 'react';
import { getCounters, getStrategies } from '../services/api';
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
        { id: Date.now(), enemyHeroId: "", results: [], targetCounters: [], relatedStrategies: [], loading: false }
    ]);

    const heroesList = Array.isArray(heroes) ? heroes : (heroes?.data || []);

    const addSection = () => {
        setSections([...sections, { id: Date.now() + Math.random(), enemyHeroId: "", results: [], targetCounters: [], relatedStrategies: [], loading: false }]);
    };

    const removeSection = (id) => {
        if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
        else setSections([{ id: Date.now(), enemyHeroId: "", results: [], targetCounters: [], relatedStrategies: [], loading: false }]);
    };

    const updateEnemyId = (sectionId, heroId) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, enemyHeroId: heroId } : s));
    };

    const handleAnalyze = async (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section.enemyHeroId) return alert("Vui lòng chọn mục tiêu!");

        setSections(sections.map(s => s.id === sectionId ? { ...s, loading: true } : s));
        try {
            const [counterRes, stratRes] = await Promise.all([
                getCounters([], [], 'pro', user?.id),
                getStrategies('pro', user?.id)
            ]);

            const allCounters = counterRes.data.data ? counterRes.data.data : counterRes.data;
            const allStrats = stratRes.data.data ? stratRes.data.data : stratRes.data;

            // KHU VỰC 1: AI TRỊ ĐƯỢC MỤC TIÊU?
            const countersTheTarget = allCounters.map(h => ({
                ...h,
                matchupDetails: h.matchupDetails.filter(d => d.enemyId === section.enemyHeroId)
            })).filter(h => h.matchupDetails.length > 0);

            // KHU VỰC 2: MỤC TIÊU TRỊ ĐƯỢC AI?
            const targetCountersThemObj = allCounters.find(h => (h.hero._id || h.hero) === section.enemyHeroId);
            const targetCountersArr = targetCountersThemObj ? [targetCountersThemObj] : [];

            // KHU VỰC 3: CHIẾN THUẬT CHỨA MỤC TIÊU
            const relatedStrats = allStrats.filter(strat => {
                const targetId = section.enemyHeroId;
                if (strat.type === 'combo_counter' || strat.type === 'skill_matchup') {
                    return strat.teamB.some(h => (h._id || h) === targetId) || strat.teamA.some(h => (h._id || h) === targetId);
                }
                if (strat.type === 'synergy') {
                    return strat.teamA.some(h => (h._id || h) === targetId);
                }
                return false;
            });

            setSections(sections.map(s => 
                s.id === sectionId ? { 
                    ...s, 
                    results: countersTheTarget, 
                    targetCounters: targetCountersArr, 
                    relatedStrategies: relatedStrats, 
                    loading: false 
                } : s
            ));
        } catch (error) {
            console.error("Lỗi phân tích:", error);
            setSections(sections.map(s => s.id === sectionId ? { ...s, loading: false } : s));
        }
    };

    // 🃏 CARD 1: Hiển thị người Khắc Chế Mục Tiêu
    const renderHeroCard = (item, filteredDetails, sectionId, currentViewMode) => {
        const isSystem = filteredDetails.some(d => d.isSystem);
        let cardClass = 'sys-card';
        if (currentViewMode === 'custom' || (!isSystem && currentViewMode === 'compare')) cardClass = 'user-card';
        if (currentViewMode === 'community') cardClass = 'community-card';

        return (
            <div key={`${sectionId}-${item.hero._id}`} className={`counter-card-neon ${cardClass}`} style={currentViewMode === 'community' ? { borderLeft: '4px solid #10b981' } : {}}>
                <div className="card-header">
                    <div className="hero-info">
                        <div className="avatar-frame">
                            <img src={getImgUrl(item.hero.avatar)} alt={item.hero.name} className="hero-avatar-rect" />
                        </div>
                        <div className="name-wrap">
                            <h3 className="hero-name-highlight">{item.hero.name}</h3>
                            <span className="score-badge">ĐIỂM: {item.totalScore}</span>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    {filteredDetails.map((detail, idx) => (
                        <div key={`detail-${item.hero._id}-${idx}`} className="matchup-detail-box">
                            <p className="detail-note">“{detail.note}”</p>
                            {detail.counterItems?.length > 0 && (
                                <div className="items-row">
                                    {detail.counterItems.map((it, iIdx) => (
                                        <div key={`item-${it._id || iIdx}`} className="item-gaming-card" title={it.passive || it.name}>
                                            <div className="item-icon-wrap">
                                                <img src={getImgUrl(it.icon, 'item')} alt={it.name} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {currentViewMode === 'custom' && <div className="author-tag" style={{ color: '#f59e0b' }}>CHIẾN THUẬT CỦA BẠN</div>}
                            {(currentViewMode === 'compare' && !detail.isSystem) && <div className="author-tag" style={{ color: '#f59e0b' }}>CHIẾN THUẬT CỦA BẠN</div>}
                            {currentViewMode === 'community' && (
                                <div className="author-tag" style={{ color: '#10b981', fontSize: '11px', marginTop: '5px', fontWeight: 'bold' }}>
                                    BỞI: {detail.authorName || 'Người chơi'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 🃏 CARD 2: Hiển thị những tướng bị Mục Tiêu Khắc Chế
    const renderTargetCounterCard = (detail, sectionId, currentViewMode, idx) => {
        const enemyHero = heroesList.find(h => h._id === detail.enemyId);
        if (!enemyHero) return null;

        let cardClass = detail.isSystem ? 'sys-card' : (currentViewMode === 'community' ? 'community-card' : 'user-card');

        return (
            <div key={`${sectionId}-tc-${detail.enemyId}-${idx}`} className={`counter-card-neon ${cardClass}`} style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="card-header" style={{ borderBottomColor: '#ef4444' }}>
                    <div className="hero-info">
                        <div className="avatar-frame">
                            <img src={getImgUrl(enemyHero.avatar)} alt={enemyHero.name} className="hero-avatar-rect" style={{ borderColor: '#ef4444' }} />
                        </div>
                        <div className="name-wrap">
                            <h3 className="hero-name-highlight" style={{ color: '#ef4444' }}>{enemyHero.name}</h3>
                            <span className="score-badge" style={{ background: '#7f1d1d', color: '#fca5a5' }}>⚠️ DỄ BỊ HẠ GỤC ({detail.score}đ)</span>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="matchup-detail-box" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="detail-note">“{detail.note}”</p>
                        {detail.counterItems?.length > 0 && (
                            <div className="items-row">
                                {detail.counterItems.map((it, iIdx) => (
                                    <div key={`item-${it._id || iIdx}`} className="item-gaming-card" title={it.passive || it.name}>
                                        <div className="item-icon-wrap">
                                            <img src={getImgUrl(it.icon, 'item')} alt={it.name} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {currentViewMode === 'custom' && <div className="author-tag" style={{ color: '#f59e0b' }}>CHIẾN THUẬT CỦA BẠN</div>}
                        {(currentViewMode === 'compare' && !detail.isSystem) && <div className="author-tag" style={{ color: '#f59e0b' }}>CHIẾN THUẬT CỦA BẠN</div>}
                        {currentViewMode === 'community' && (
                            <div className="author-tag" style={{ color: '#10b981', fontSize: '11px', marginTop: '5px', fontWeight: 'bold' }}>
                                BỞI: {detail.authorName || 'Người chơi'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // 🃏 CARD 3: Hiển thị Chiến Thuật Nâng Cao (Combo / 50-50)
    const renderStratCard = (strat, sectionId) => {
        const isSystem = strat.isSystem;
        let cardBorderColor = isSystem ? '#38bdf8' : (strat.author?._id === user?.id ? '#f59e0b' : '#10b981');
        
        const section = sections.find(s => s.id === sectionId);
        const isTargetInTeamB = strat.teamB && strat.teamB.some(h => (h._id || h) === section.enemyHeroId);
        
        let displayTeamA = strat.teamA;
        let displayTeamB = strat.teamB;

        if (strat.type === 'skill_matchup' && !isTargetInTeamB) {
            displayTeamA = strat.teamB;
            displayTeamB = strat.teamA;
        }

        return (
            <div key={`${sectionId}-${strat._id}`} className="counter-card-neon" style={{ borderLeft: `4px solid ${cardBorderColor}`, padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: cardBorderColor, textTransform: 'uppercase' }}>
                        {strat.type === 'skill_matchup' ? '⚔️ KÈO KỸ NĂNG (50/50)' : (strat.type === 'synergy' ? '🤝 COMBO ĐỒNG ĐỘI' : '🛡️ ĐỘI HÌNH PHÁ GIẢI')}
                    </span>
                    <span className="score-badge" style={{ margin: 0, padding: '2px 8px' }}>HIỆU QUẢ: {strat.score}/5</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px dashed #334155' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {displayTeamA.map((h, i) => (
                            <img key={i} src={getImgUrl(h.avatar || h)} alt="hero" style={{ width: '45px', height: '45px', borderRadius: '50%', border: `2px solid ${strat.type === 'synergy' ? '#f59e0b' : '#10b981'}` }} title={h.name || 'Hero'} />
                        ))}
                    </div>
                    {strat.type !== 'synergy' && (
                        <>
                            <span style={{ fontWeight: '900', color: '#64748b', fontSize: '14px', margin: '0 5px' }}>{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {displayTeamB.map((h, i) => (
                                    <img key={i} src={getImgUrl(h.avatar || h)} alt="hero" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #ef4444' }} title={h.name || 'Hero'} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="matchup-detail-box" style={{ marginTop: 0, border: 'none', background: 'transparent', padding: 0 }}>
                    <p className="detail-note" style={{ fontStyle: 'italic', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>“{strat.note}”</p>
                    <div className="author-tag" style={{ color: cardBorderColor, fontSize: '11px', marginTop: '10px', fontWeight: 'bold' }}>
                        NGUỒN: {isSystem ? 'HỆ THỐNG' : (strat.author?._id === user?.id ? 'BẠN' : (strat.author?.username || 'Cộng đồng'))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="solo-counter-multi">
            <div className="global-controls">
                <ModeToggle mode={viewMode} setMode={setViewMode} />
                <button className="btn-cyber btn-add-section" onClick={addSection}>➕ THÊM MỤC SO SÁNH</button>
            </div>

            <div className="sections-list">
                {sections.map((section, index) => {
                    // LỌC THEO VIEW MODE (Khu vực 1: Ai trị mục tiêu)
                    const singleViewHeroes = section.results.map(h => ({
                        ...h,
                        matchupDetails: h.matchupDetails.filter(d => {
                            const authorId = d.authorId || d.author?._id || d.author;
                            if (viewMode === 'standard') return d.isSystem;
                            if (viewMode === 'custom') return authorId === user?.id;
                            if (viewMode === 'community') return !d.isSystem;
                            return false;
                        })
                    })).filter(h => h.matchupDetails.length > 0);

                    const systemSideHeroes = section.results.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => d.isSystem) })).filter(h => h.matchupDetails.length > 0);
                    const mySideHeroes = section.results.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => !d.isSystem && (d.authorId === user?.id || d.author === user?.id)) })).filter(h => h.matchupDetails.length > 0);

                    // LỌC THEO VIEW MODE (Khu vực 2: Mục tiêu trị ai)
                    const singleViewTargetCounters = section.targetCounters.map(h => ({
                        ...h,
                        matchupDetails: h.matchupDetails.filter(d => {
                            const authorId = d.authorId || d.author?._id || d.author;
                            if (viewMode === 'standard') return d.isSystem;
                            if (viewMode === 'custom') return authorId === user?.id;
                            if (viewMode === 'community') return !d.isSystem;
                            return false;
                        })
                    })).filter(h => h.matchupDetails.length > 0);

                    const sysSideTargetCounters = section.targetCounters.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => d.isSystem) })).filter(h => h.matchupDetails.length > 0);
                    const mySideTargetCounters = section.targetCounters.map(h => ({ ...h, matchupDetails: h.matchupDetails.filter(d => !d.isSystem && (d.authorId === user?.id || d.author === user?.id)) })).filter(h => h.matchupDetails.length > 0);

                    // LỌC THEO VIEW MODE (Khu vực 3: Chiến thuật liên quan)
                    const filteredStrats = section.relatedStrategies.filter(strat => {
                        const authorId = strat.author?._id || strat.author;
                        if (viewMode === 'standard' || viewMode === 'compare') return strat.isSystem || authorId === user?.id;
                        if (viewMode === 'custom') return authorId === user?.id;
                        if (viewMode === 'community') return !strat.isSystem;
                        return false;
                    });

                    const skillMatchups = filteredStrats.filter(s => s.type === 'skill_matchup');
                    const comboCounters = filteredStrats.filter(s => s.type === 'combo_counter');
                    const enemySynergies = filteredStrats.filter(s => s.type === 'synergy' && s.teamA.some(h => (h._id || h) === section.enemyHeroId));

                    return (
                        <div key={section.id} className="analysis-section-box">
                            <div className="section-header">
                                <span className="section-number">#{index + 1}</span>
                                <div className="section-input-group">
                                    <HeroSelect 
                                        label="MỤC TIÊU PHÂN TÍCH:" 
                                        heroes={heroesList} 
                                        selectedHeroId={section.enemyHeroId} 
                                        isEnemy={true}
                                        onChange={(id) => updateEnemyId(section.id, id)} 
                                    />
                                    <button className="btn-cyber btn-analyze-small" onClick={() => handleAnalyze(section.id)} disabled={section.loading}>
                                        {section.loading ? 'ĐANG QUÉT...' : '🔍 PHÂN TÍCH ĐA CHIỀU'}
                                    </button>
                                </div>
                                <button className="btn-remove-section" onClick={() => removeSection(section.id)}>×</button>
                            </div>

                            <div className="section-results">
                                {section.loading ? (
                                    <div className="cyber-scanning-mini"><div className="scan-line"></div><p>TRUY XUẤT CƠ SỞ DỮ LIỆU ĐA CHIỀU...</p></div>
                                ) : section.results.length > 0 || section.targetCounters.length > 0 || filteredStrats.length > 0 ? (
                                    <>
                                        {/* KHU VỰC 1 */}
                                        <h4 style={{ color: '#38bdf8', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px', fontSize: '18px' }}>
                                            ✅ TƯỚNG KHẮC CHẾ ĐƯỢC MỤC TIÊU (NÊN CHỌN)
                                        </h4>
                                        {viewMode === 'compare' ? (
                                            <div className="comparison-container">
                                                <div className="comparison-col system-side">
                                                    <h4 className="side-title">🤖 DỮ LIỆU HỆ THỐNG</h4>
                                                    <div className="side-grid">
                                                        {systemSideHeroes.length > 0 
                                                            ? systemSideHeroes.map(h => renderHeroCard(h, h.matchupDetails, section.id, 'compare')) 
                                                            : <p className="no-data">Hệ thống chưa có dữ liệu kèo này.</p>}
                                                    </div>
                                                </div>
                                                <div className="comparison-col community-side">
                                                    <h4 className="side-title">🛡️ CHIẾN THUẬT CỦA TÔI</h4>
                                                    <div className="side-grid">
                                                        {user ? (mySideHeroes.length > 0 ? mySideHeroes.map(h => renderHeroCard(h, h.matchupDetails, section.id, 'compare')) : <p className="no-data">Bạn chưa lưu chiến thuật nào cho kèo này.</p>) : <p className="no-data">Đăng nhập để xem chiến thuật cá nhân.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="single-view-container side-grid" style={{ marginBottom: '30px' }}>
                                                {singleViewHeroes.length > 0
                                                    ? singleViewHeroes.map(h => renderHeroCard(h, h.matchupDetails, section.id, viewMode))
                                                    : <p className="no-data" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Chưa có dữ liệu khắc chế mục tiêu.</p>
                                                }
                                            </div>
                                        )}

                                        {/* KHU VỰC 2 */}
                                        <h4 style={{ color: '#ef4444', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px', fontSize: '18px', marginTop: '30px' }}>
                                            ⚠️ MỤC TIÊU NÀY KHẮC CHẾ NHỮNG TƯỚNG NÀO? (NÊN TRÁNH CHỌN)
                                        </h4>
                                        {viewMode === 'compare' ? (
                                            <div className="comparison-container">
                                                <div className="comparison-col system-side">
                                                    <h4 className="side-title">🤖 DỮ LIỆU HỆ THỐNG</h4>
                                                    <div className="side-grid">
                                                        {sysSideTargetCounters.length > 0 && sysSideTargetCounters[0].matchupDetails.length > 0
                                                            ? sysSideTargetCounters[0].matchupDetails.map((detail, idx) => renderTargetCounterCard(detail, section.id, 'compare', idx)) 
                                                            : <p className="no-data">Chưa có thông tin hệ thống.</p>}
                                                    </div>
                                                </div>
                                                <div className="comparison-col community-side">
                                                    <h4 className="side-title">🛡️ GHI CHÚ CỦA TÔI</h4>
                                                    <div className="side-grid">
                                                        {user ? (mySideTargetCounters.length > 0 && mySideTargetCounters[0].matchupDetails.length > 0
                                                            ? mySideTargetCounters[0].matchupDetails.map((detail, idx) => renderTargetCounterCard(detail, section.id, 'compare', idx)) 
                                                            : <p className="no-data">Bạn chưa có ghi chú tránh né cho mục tiêu này.</p>) : <p className="no-data">Đăng nhập để xem chiến thuật cá nhân.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="single-view-container side-grid" style={{ marginBottom: '30px' }}>
                                                {singleViewTargetCounters.length > 0 && singleViewTargetCounters[0].matchupDetails.length > 0
                                                    ? singleViewTargetCounters[0].matchupDetails.map((detail, idx) => renderTargetCounterCard(detail, section.id, viewMode, idx))
                                                    : <p className="no-data" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Chưa có dữ liệu danh sách tướng bị mục tiêu khắc chế.</p>
                                                }
                                            </div>
                                        )}

                                        {/* KHU VỰC 3 */}
                                        {(skillMatchups.length > 0 || comboCounters.length > 0 || enemySynergies.length > 0) && (
                                            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #1e293b' }}>
                                                <h4 style={{ color: '#f59e0b', marginBottom: '20px', textAlign: 'center', fontSize: '18px', textTransform: 'uppercase' }}>
                                                    🧠 CHIẾN THUẬT & COMBO LIÊN QUAN ĐẾN MỤC TIÊU
                                                </h4>
                                                <div className="single-view-container side-grid">
                                                    {skillMatchups.map(strat => renderStratCard(strat, section.id))}
                                                    {comboCounters.map(strat => renderStratCard(strat, section.id))}
                                                    {enemySynergies.map(strat => renderStratCard(strat, section.id))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-section-msg">Hệ thống Đa Chiều đã sẵn sàng. Hãy chọn mục tiêu!</div>
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