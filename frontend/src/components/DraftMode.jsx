import React, { useState, useEffect, useContext } from 'react';
import { getCounters, getStrategies } from '../services/api'; 
import { AuthContext } from '../context/AuthContext';
import ModeToggle from './ModeToggle';
import HeroModal from './HeroModal';
import './DraftMode.css';

const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=No+Image';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const DraftMode = ({ heroes }) => {
    const { user } = useContext(AuthContext);
    const [viewMode, setViewMode] = useState('standard');

    const [bansEnemy, setBansEnemy] = useState([null, null, null, null]); 
    const [bansAlly, setBansAlly] = useState([null, null, null, null]);   
    const [picksEnemy, setPicksEnemy] = useState([null, null, null, null, null]); 
    const [picksAlly, setPicksAlly] = useState([null, null, null, null, null]);   

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetAction, setTargetAction] = useState({ type: null, index: null });

    // STATE DỮ LIỆU
    const [allEnemyCounters, setAllEnemyCounters] = useState([]);
    const [allAllyCounters, setAllAllyCounters] = useState([]);
    const [advancedStrategies, setAdvancedStrategies] = useState([]); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const validBansEnemy = bansEnemy.filter(Boolean);
    const validBansAlly = bansAlly.filter(Boolean);
    const validPicksEnemy = picksEnemy.filter(Boolean);
    const validPicksAlly = picksAlly.filter(Boolean);

    const allExcluded = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy, ...validPicksAlly];
    const availableHeroes = heroes.filter(hero => !allExcluded.includes(hero._id));

    const openModalFor = (type, index) => {
        setTargetAction({ type, index });
        setIsModalOpen(true);
    };

    const handleSelectHero = (heroId) => {
        if (!heroId || targetAction.index === null) return;
        const { type, index } = targetAction;

        if (type === 'banEnemy') {
            const newArr = [...bansEnemy]; newArr[index] = heroId; setBansEnemy(newArr);
        } else if (type === 'banAlly') {
            const newArr = [...bansAlly]; newArr[index] = heroId; setBansAlly(newArr);
        } else if (type === 'pickEnemy') {
            const newArr = [...picksEnemy]; newArr[index] = heroId; setPicksEnemy(newArr);
        } else if (type === 'pickAlly') {
            const newArr = [...picksAlly]; newArr[index] = heroId; setPicksAlly(newArr);
        }
        
        setIsModalOpen(false);
        setTargetAction({ type: null, index: null });
    };

    const handleRemoveHero = (type, index, e) => {
        e.stopPropagation();
        if (type === 'banEnemy') {
            const newArr = [...bansEnemy]; newArr[index] = null; setBansEnemy(newArr);
        } else if (type === 'banAlly') {
            const newArr = [...bansAlly]; newArr[index] = null; setBansAlly(newArr);
        } else if (type === 'pickEnemy') {
            const newArr = [...picksEnemy]; newArr[index] = null; setPicksEnemy(newArr);
        } else if (type === 'pickAlly') {
            const newArr = [...picksAlly]; newArr[index] = null; setPicksAlly(newArr);
        }
    };

    // FETCH TOÀN BỘ DỮ LIỆU KHI CÓ SỰ THAY ĐỔI TƯỚNG HOẶC CHẾ ĐỘ
    useEffect(() => {
        const fetchAllRelations = async () => {
            setIsAnalyzing(true);
            try {
                if (validPicksEnemy.length > 0) {
                    const resEnemy = await getCounters(validPicksEnemy, [], viewMode, user?.id);
                    setAllEnemyCounters(resEnemy.data);
                } else setAllEnemyCounters([]);

                if (validPicksAlly.length > 0) {
                    const resAlly = await getCounters(validPicksAlly, [], viewMode, user?.id);
                    setAllAllyCounters(resAlly.data);
                } else setAllAllyCounters([]);

                const resStrats = await getStrategies(viewMode, user?.id);
                setAdvancedStrategies(resStrats.data);

            } catch (error) {
                console.error("Lỗi phân tích đội hình:", error);
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchAllRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picksEnemy, picksAlly, viewMode, user]); 

    // --- LOGIC PHÂN TÍCH 1V1 ---
    const isEnemyCounteredByAlly = (enemyId) => allEnemyCounters.some(c => validPicksAlly.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === enemyId));
    const isAllyCounteredByEnemy = (allyId) => allAllyCounters.some(c => validPicksEnemy.includes(c.hero._id) && c.matchupDetails.some(d => d.enemyId === allyId));
    const getHeroName = (id) => heroes.find(h => h._id === id)?.name || "Unknown";
    const getHeroAvatar = (id) => heroes.find(h => h._id === id)?.avatar || "";

    const excludedFromRecommendations = [...validBansEnemy, ...validBansAlly, ...validPicksEnemy];
    const recommendedToPick = allEnemyCounters.filter(item => !excludedFromRecommendations.includes(item.hero._id));
    const excludedFromThreats = [...validBansEnemy, ...validBansAlly, ...validPicksAlly];
    const threatsToOurTeam = allAllyCounters.filter(item => !excludedFromThreats.includes(item.hero._id));

    // ========================================================
    // --- THUẬT TOÁN CHIẾN THUẬT NÂNG CAO (AI TỰ ĐỘNG SUY LUẬN) ---
    // ========================================================

    // 1. Kèo Kỹ Năng 2 Chiều 
    const skillMatchups = [];
    advancedStrategies.forEach(s => {
        if (s.type === 'skill_matchup') {
            if (s.teamB.some(h => validPicksEnemy.includes(h._id))) {
                skillMatchups.push(s);
            } else if (s.teamA.some(h => validPicksEnemy.includes(h._id))) {
                skillMatchups.push({ ...s, teamA: s.teamB, teamB: s.teamA });
            }
        }
    });

    // 2. Phối hợp đồng đội (Gợi ý cho đội Ta)
    const allySynergies = advancedStrategies.filter(s => 
        s.type === 'synergy' && 
        s.teamA.some(h => validPicksAlly.includes(h._id)) && 
        !s.teamA.every(h => validPicksAlly.includes(h._id)) 
    );

    // 3. Cảnh báo Combo địch (Nâng cấp AI suy luận)
    const enemyCombosRaw = [];
    advancedStrategies.forEach(s => {
        // Cảnh báo từ các Synergy được khai báo
        if (s.type === 'synergy' && s.teamA.some(h => validPicksEnemy.includes(h._id))) {
            enemyCombosRaw.push(s);
        }
        
        // AI TỰ ĐỘNG SUY LUẬN: Nếu địch pick tướng nằm trong teamB của "Đội hình phá giải"
        if (s.type === 'combo_counter' && s.teamB.some(h => validPicksEnemy.includes(h._id))) {
            enemyCombosRaw.push({
                ...s,
                _id: s._id + '_auto', // Tránh trùng key UI
                type: 'synergy',      // Ép kiểu thành synergy để chỉ hiển thị 1 phe địch
                teamA: s.teamB,       
                teamB: [],
                note: "" // XÓA GHI CHÚ ĐỂ TRÁNH BỊ "LẠT QUẺ"
            });
        }
    });

    // Lọc trùng lặp combo để tránh 1 cảnh báo hiện 2 lần
    const uniqueEnemyCombos = [];
    const seenCombos = new Set();
    enemyCombosRaw.forEach(c => {
        const comboStr = c.teamA.map(h => h._id).join(',');
        if (!seenCombos.has(comboStr)) {
            seenCombos.add(comboStr);
            uniqueEnemyCombos.push(c);
        }
    });

    // 4. Phá giải đội hình (Gợi ý phe ta)
    const comboCounters = advancedStrategies.filter(s =>
        s.type === 'combo_counter' &&
        s.teamB.some(h => validPicksEnemy.includes(h._id))
    );

    // ========================================================
    // --- GIAO DIỆN COMPONENT ---
    // ========================================================

    const SlotBox = ({ type, id, index, highlightClass }) => {
        if (!id) return (
            <div className={`slot-box empty ${type}`} onClick={() => openModalFor(type, index)} title="Bấm để chọn tướng">
                <span className="plus-icon">+</span>
            </div>
        );
        return (
            <div className={`slot-box filled ${type} ${highlightClass || ''}`} onClick={() => openModalFor(type, index)} title="Bấm để đổi tướng">
                <div className="slot-image-container">
                    <img src={getAvatarUrl(getHeroAvatar(id))} alt="Hero" className="slot-img-bg" />
                    <div className="slot-name-overlay"><span className="hero-name">{getHeroName(id)}</span></div>
                </div>
                <button className="remove-btn" onClick={(e) => handleRemoveHero(type, index, e)}>×</button>
            </div>
        );
    };

    const getFilteredCards = (cards, sourceFilter) => {
        if (!cards) return [];
        return cards.map(card => {
            const filteredDetails = card.matchupDetails.filter(d => {
                if (sourceFilter === 'system') return d.isSystem;
                if (sourceFilter === 'personal') return !d.isSystem; 
                return true;
            });
            return { ...card, matchupDetails: filteredDetails };
        }).filter(card => card.matchupDetails.length > 0);
    };

    // UI: RENDER CARD 1V1
    const renderCards = (cardsList, isThreatBox) => {
        if (cardsList.length === 0) return <p className="no-results" style={{ fontSize: '13px' }}>Không có dữ liệu 1v1 phù hợp.</p>;
        
        return (
            <div className="recommendation-grid">
                {cardsList.map((dataObj) => {
                    const isPicked = isThreatBox ? validPicksEnemy.includes(dataObj.hero._id) : validPicksAlly.includes(dataObj.hero._id);
                    const colorMain = isThreatBox ? '#dc3545' : '#28a745';
                    const textLabel = isThreatBox ? '(Địch Đã Chọn)' : '(Đã Chọn)';

                    return (
                        <div key={dataObj.hero._id} className="rec-card" style={{ border: isPicked ? `2px solid ${colorMain}` : '1px solid #334155', display: 'flex', gap: '15px' }}>
                            <img src={getAvatarUrl(dataObj.hero.avatar)} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="hero" />
                            <div style={{ flex: 1 }}>
                                <div className="rec-header" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                                    <strong>{dataObj.hero.name} {isPicked && <span style={{ color: colorMain, fontSize: '12px' }}>{textLabel}</span>}</strong>
                                    <span className="score-badge" style={{ background: isThreatBox ? '#ef4444' : '#f59e0b', color: isThreatBox ? '#fff' : '#000' }}>
                                        {isThreatBox ? 'NGUY HIỂM: ' : 'ĐIỂM: '}{dataObj.totalScore}
                                    </span>
                                </div>
                                <div className="rec-body" style={{ padding: '10px 0 0 0' }}>
                                    <ul className="rec-details-list">
                                        {dataObj.matchupDetails.map((detail, idx) => (
                                            <li key={idx}>
                                                Khắc chế 
                                                <img src={getAvatarUrl(getHeroAvatar(detail.enemyId))} className="mini-inline-avatar" alt="enemy" title={getHeroName(detail.enemyId)} />
                                                <b style={{color: isThreatBox ? '#ef4444' : '#f59e0b'}}>{getHeroName(detail.enemyId)}</b> ({detail.score}đ)
                                                
                                                <div className="rec-note">
                                                    "{detail.note}"
                                                    <div style={{ fontSize: '11px', marginTop: '3px', color: detail.isSystem ? '#38bdf8' : '#10b981', fontWeight: 'bold' }}>
                                                        Nguồn: {detail.isSystem ? 'Hệ Thống' : detail.authorName}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // UI: RENDER CHIẾN THUẬT NÂNG CAO (ĐÃ ĐẢO VỊ TRÍ TRÁI-PHẢI)
    const renderAdvancedCards = (stratList, title, themeColor, isThreatBox = false) => {
        if (!stratList || stratList.length === 0) return null;
        
        const getFilteredStrats = (list, sourceFilter) => list.filter(s => sourceFilter === 'system' ? s.isSystem : !s.isSystem);

        const StrategyList = ({ data }) => {
            if(data.length === 0) return <p className="no-results" style={{fontSize:'12px'}}>Không có chiến thuật này.</p>;
            return (
                <div className="strat-advanced-grid">
                    {data.map(strat => (
                        <div key={strat._id} className="strat-advanced-card" style={{ borderLeftColor: themeColor }}>
                            <div className="adv-card-header">
                                <span className="adv-type">{strat.type === 'skill_matchup' ? '⚔️ 50/50' : (strat.type === 'synergy' ? '🤝 COMBO' : '🛡️ KHẮC CHẾ')}</span>
                                <span className="adv-author">Bởi: {strat.isSystem ? 'Hệ thống' : strat.author?.username}</span>
                            </div>
                            <div className="adv-teams">
                                
                                {/* BÊN TRÁI: GỢI Ý CHO TA (Hoặc Combo địch nếu là khối Cảnh Báo) */}
                                <div className={`mini-team-row ${isThreatBox ? 'enemy-shadow' : 'ally-shadow'}`}>
                                    {strat.teamA.map(h => (
                                        <div key={h._id} className="strat-hero-icon-wrap">
                                            <img src={getAvatarUrl(h.avatar)} title={h.name} alt={h.name} />
                                            <span className="strat-hero-name">{h.name}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* BÊN PHẢI: ĐỐI THỦ (Nếu có) */}
                                {strat.type !== 'synergy' && strat.teamB?.length > 0 && (
                                    <>
                                        <div className="adv-vs">{strat.type === 'skill_matchup' ? '50/50' : 'VS'}</div>
                                        <div className={`mini-team-row ${isThreatBox ? 'ally-shadow' : 'enemy-shadow'}`}>
                                            {strat.teamB.map(h => (
                                                <div key={h._id} className="strat-hero-icon-wrap">
                                                    <img src={getAvatarUrl(h.avatar)} title={h.name} alt={h.name} />
                                                    <span className="strat-hero-name">{h.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                            </div>
                            {/* {strat.note && strat.note.trim() !== "" && (
                                <p className="adv-note">"{strat.note}"</p>
                            )} */}
                        </div>
                    ))}
                </div>
            )
        };

        return (
            <div className="advanced-strategy-block" style={{ borderTop: `2px solid ${themeColor}` }}>
                <h3 className="advanced-block-title" style={{ color: themeColor }}>{title}</h3>
                
                {viewMode === 'compare' ? (
                    <div className="compare-split-layout">
                        <div className="compare-col system-col">
                            <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                            <StrategyList data={getFilteredStrats(stratList, 'system')} />
                        </div>
                        <div className="compare-col personal-col">
                            <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                            <StrategyList data={getFilteredStrats(stratList, 'personal')} />
                        </div>
                    </div>
                ) : (
                    <StrategyList data={stratList} />
                )}
            </div>
        );
    };

    return (
        <div className="draft-mode-container">
            <ModeToggle mode={viewMode} setMode={setViewMode} />

            <HeroModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTargetAction({ type: null, index: null }); }} heroes={availableHeroes} onSelect={handleSelectHero} />

            <div className="draft-board-split" style={{ marginTop: '20px' }}>
                <div className="team-col ally-col">
                    <h2 className="col-title ally-title">🛡️ ĐỘI TA</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0, 1, 2, 3].map(i => <SlotBox key={`ab-${i}`} type="banAlly" id={bansAlly[i]} index={i} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0, 1, 2, 3, 4].map(i => {
                                const aId = picksAlly[i];
                                const highlight = aId && isAllyCounteredByEnemy(aId) ? 'border-red' : '';
                                return <SlotBox key={`ap-${i}`} type="pickAlly" id={aId} index={i} highlightClass={highlight} />;
                            })}
                        </div>
                    </div>
                </div>

                <div className="team-col enemy-col">
                    <h2 className="col-title enemy-title">⚔️ ĐỘI ĐỊCH</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0, 1, 2, 3].map(i => <SlotBox key={`eb-${i}`} type="banEnemy" id={bansEnemy[i]} index={i} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0, 1, 2, 3, 4].map(i => {
                                const eId = picksEnemy[i];
                                const highlight = eId && isEnemyCounteredByAlly(eId) ? 'border-green' : '';
                                return <SlotBox key={`ep-${i}`} type="pickEnemy" id={eId} index={i} highlightClass={highlight} />
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="analysis-container">
                {isAnalyzing && <p className="loading-text" style={{ textAlign: 'center', width: '100%', padding: '10px' }}>Máy chủ đang phân tích...</p>}

                {/* KHU VỰC 1: ĐỀ XUẤT 1V1 VÀ COMBO PHÁ GIẢI (MÀU XANH) */}
                <div className="analysis-board board-recommend">
                    <h2>📊 GỢI Ý CHIẾN THUẬT CHO ĐỘI TA</h2>
                    
                    {/* Bảng Đề xuất 1v1 */}
                    <div className="sub-board">
                        <h3 className="sub-board-title">Khắc chế 1v1</h3>
                        {viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                                    {renderCards(getFilteredCards(recommendedToPick, 'system'), false)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                                    {renderCards(getFilteredCards(recommendedToPick, 'personal'), false)}
                                </div>
                            </div>
                        ) : (
                            renderCards(recommendedToPick, false)
                        )}
                    </div>

                    {/* HIỂN THỊ KÈO 50/50 VÀ COMBO TẠI ĐÂY */}
                    {renderAdvancedCards(skillMatchups, '⚔️ KÈO KỸ NĂNG (ĐỐI ĐẦU SÒNG PHẲNG)', '#f59e0b', false)}
                    {renderAdvancedCards(allySynergies, '🤝 GỢI Ý PHỐI HỢP ĐỒNG ĐỘI (COMBO)', '#10b981', false)}
                    {renderAdvancedCards(comboCounters, '🛡️ PHÁ GIẢI ĐỘI HÌNH ĐỊCH', '#38bdf8', false)}
                </div>

                {/* KHU VỰC 2: CẢNH BÁO NGUY HIỂM TỪ ĐỊCH (MÀU ĐỎ) */}
                <div className="analysis-board board-threat">
                    <h2>⚠️ PHÂN TÍCH MỐI ĐE DỌA TỪ ĐỊCH</h2>
                    
                    <div className="sub-board">
                        <h3 className="sub-board-title">Tướng Địch khắc chế Ta (1v1)</h3>
                        {viewMode === 'compare' ? (
                            <div className="compare-split-layout">
                                <div className="compare-col system-col">
                                    <h4 className="compare-sub-title">🤖 HỆ THỐNG</h4>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'system'), true)}
                                </div>
                                <div className="compare-col personal-col">
                                    <h4 className="compare-sub-title">👤 CÁ NHÂN</h4>
                                    {renderCards(getFilteredCards(threatsToOurTeam, 'personal'), true)}
                                </div>
                            </div>
                        ) : (
                            renderCards(threatsToOurTeam, true)
                        )}
                    </div>

                    {/* HIỂN THỊ CẢNH BÁO ĐỊCH TẠI ĐÂY (TRUYỀN BIẾN TRUE ĐỂ KHUNG MÀU ĐỎ LÊN TRƯỚC) */}
                    {renderAdvancedCards(uniqueEnemyCombos, '🚨 BÁO ĐỘNG: ĐỊCH ĐANG XÂY DỰNG COMBO', '#ef4444', true)}
                </div>
            </div>
        </div>
    );
};

export default DraftMode;