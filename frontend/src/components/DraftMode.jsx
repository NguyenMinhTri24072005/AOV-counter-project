import React, { useState, useEffect } from 'react';
import { getCounters } from '../services/api';
import './DraftMode.css';

const DraftMode = ({ heroes }) => {
    // State phân chia Địch - Ta
    const [bansEnemy, setBansEnemy] = useState([]); 
    const [bansAlly, setBansAlly] = useState([]);   
    const [picksEnemy, setPicksEnemy] = useState([]); 
    const [picksAlly, setPicksAlly] = useState([]);   
    
    const [selectedHero, setSelectedHero] = useState("");
    
    const [allEnemyCounters, setAllEnemyCounters] = useState([]);
    const [allAllyCounters, setAllAllyCounters] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const allExcluded = [...bansEnemy, ...bansAlly, ...picksEnemy, ...picksAlly];
    const availableHeroes = heroes.filter(hero => !allExcluded.includes(hero._id));

    const handleAddHero = (actionType) => {
        if (!selectedHero) return;

        if (actionType === 'banEnemy' && bansEnemy.length < 4) setBansEnemy([...bansEnemy, selectedHero]);
        else if (actionType === 'banAlly' && bansAlly.length < 3) setBansAlly([...bansAlly, selectedHero]);
        else if (actionType === 'pickEnemy' && picksEnemy.length < 5) setPicksEnemy([...picksEnemy, selectedHero]);
        else if (actionType === 'pickAlly' && picksAlly.length < 5) setPicksAlly([...picksAlly, selectedHero]);
        
        setSelectedHero(""); 
    };

    const handleRemoveHero = (actionType, heroId) => {
        if (actionType === 'banEnemy') setBansEnemy(bansEnemy.filter(id => id !== heroId));
        if (actionType === 'banAlly') setBansAlly(bansAlly.filter(id => id !== heroId));
        if (actionType === 'pickEnemy') setPicksEnemy(picksEnemy.filter(id => id !== heroId));
        if (actionType === 'pickAlly') setPicksAlly(picksAlly.filter(id => id !== heroId));
    };

    // FETCH DATA NGẦM
    useEffect(() => {
        const fetchAllRelations = async () => {
            setIsAnalyzing(true);
            try {
                if (picksEnemy.length > 0) {
                    const resEnemy = await getCounters(picksEnemy, []);
                    setAllEnemyCounters(resEnemy.data);
                } else setAllEnemyCounters([]);

                // Lấy danh sách tướng khắc chế TA (Tướng địch có thể chọn)
                if (picksAlly.length > 0) {
                    const resAlly = await getCounters(picksAlly, []);
                    setAllAllyCounters(resAlly.data);
                } else setAllAllyCounters([]);

            } catch (error) {
                console.error("Lỗi phân tích đội hình:", error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        fetchAllRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picksEnemy, picksAlly]);

    // KIỂM TRA CHÉO BÀN CỜ
    const isEnemyCounteredByAlly = (enemyId) => {
        return allEnemyCounters.some(counterItem => {
            const isAllyPickedIt = picksAlly.includes(counterItem.hero._id);
            const targetsThisEnemy = counterItem.matchupDetails.some(detail => detail.enemyId === enemyId);
            return isAllyPickedIt && targetsThisEnemy;
        });
    };

    const isAllyCounteredByEnemy = (allyId) => {
        return allAllyCounters.some(counterItem => {
            const isEnemyPickedIt = picksEnemy.includes(counterItem.hero._id);
            const targetsThisAlly = counterItem.matchupDetails.some(detail => detail.enemyId === allyId);
            return isEnemyPickedIt && targetsThisAlly;
        });
    };

    // MẢNG 1: Tướng TA nên chọn (Đề xuất)
    const excludedFromRecommendations = [...bansEnemy, ...bansAlly, ...picksEnemy];
    const recommendedToPick = allEnemyCounters.filter(item => !excludedFromRecommendations.includes(item.hero._id));

    // MẢNG 2: Tướng ĐỊCH có thể chọn để khắc chế Ta (Cảnh báo)
    const excludedFromThreats = [...bansEnemy, ...bansAlly, ...picksAlly];
    const threatsToOurTeam = allAllyCounters.filter(item => !excludedFromThreats.includes(item.hero._id));

    const getHeroName = (id) => heroes.find(h => h._id === id)?.name || "Unknown";

    const SlotBox = ({ type, id, onRemove, highlightClass }) => {
        if (!id) return <div className={`slot-box empty ${type}`}>Trống</div>;
        return (
            <div className={`slot-box filled ${type} ${highlightClass || ''}`}>
                <span className="hero-name">{getHeroName(id)}</span>
                <button className="remove-btn" onClick={() => onRemove(id)}>×</button>
            </div>
        );
    };

    return (
        <div className="draft-mode-container">
            {/* THANH CÔNG CỤ */}
            <div className="action-bar">
                <select className="draft-select" value={selectedHero} onChange={(e) => setSelectedHero(e.target.value)}>
                    <option value="" disabled>-- Chọn tướng vào bàn cờ --</option>
                    {availableHeroes.map(hero => (
                        <option key={hero._id} value={hero._id}>{hero.name} - {hero.role}</option>
                    ))}
                </select>

                <div className="action-buttons">
                    <button className="btn-pick-ally" onClick={() => handleAddHero('pickAlly')} disabled={!selectedHero || picksAlly.length >= 5}>
                        🛡️ Pick Ta ({picksAlly.length}/5)
                    </button>
                    <button className="btn-ban-ally" onClick={() => handleAddHero('banAlly')} disabled={!selectedHero || bansAlly.length >= 3}>
                        🚫 Ban Ta ({bansAlly.length}/3)
                    </button>
                    <button className="btn-pick-enemy" onClick={() => handleAddHero('pickEnemy')} disabled={!selectedHero || picksEnemy.length >= 5}>
                        ⚔️ Pick Địch ({picksEnemy.length}/5)
                    </button>
                    <button className="btn-ban-enemy" onClick={() => handleAddHero('banEnemy')} disabled={!selectedHero || bansEnemy.length >= 4}>
                        🚫 Ban Địch ({bansEnemy.length}/4)
                    </button>
                </div>
            </div>

            {/* BÀN CỜ DRAFT */}
            <div className="draft-board-split">
                <div className="team-col ally-col">
                    <h2 className="col-title ally-title">🛡️ ĐỘI TA</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0,1,2,3].map(i => <SlotBox key={`ab-${i}`} type="ban" id={bansAlly[i]} onRemove={(id) => handleRemoveHero('banAlly', id)} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0,1,2,3,4].map(i => {
                                const aId = picksAlly[i];
                                const highlight = aId && isAllyCounteredByEnemy(aId) ? 'border-red' : '';
                                return <SlotBox key={`ap-${i}`} type="pick" id={aId} highlightClass={highlight} onRemove={(id) => handleRemoveHero('pickAlly', id)} />
                            })}
                        </div>
                    </div>
                </div>

                <div className="team-col enemy-col">
                    <h2 className="col-title enemy-title">⚔️ ĐỘI ĐỊCH</h2>
                    <div className="bans-row">
                        <h4>Tướng Cấm (4)</h4>
                        <div className="slots-container bans">
                            {[0,1,2,3].map(i => <SlotBox key={`eb-${i}`} type="ban" id={bansEnemy[i]} onRemove={(id) => handleRemoveHero('banEnemy', id)} />)}
                        </div>
                    </div>
                    <div className="picks-row">
                        <h4>Tướng Chọn (5)</h4>
                        <div className="slots-container picks">
                            {[0,1,2,3,4].map(i => {
                                const eId = picksEnemy[i];
                                const highlight = eId && isEnemyCounteredByAlly(eId) ? 'border-green' : '';
                                return <SlotBox key={`ep-${i}`} type="pick" id={eId} highlightClass={highlight} onRemove={(id) => handleRemoveHero('pickEnemy', id)} />
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* PHÂN TÍCH VÀ ĐỀ XUẤT */}
            <div className="analysis-container">
                
                {/* BẢNG 1: ĐỀ XUẤT CHO ĐỘI TA */}
                <div className="analysis-board board-recommend">
                    <h2>📊 Tướng Đề Xuất Khắc Chế Địch</h2>
                    {isAnalyzing ? (
                        <p className="loading-text">Máy chủ đang phân tích luồng dữ liệu...</p>
                    ) : recommendedToPick.length > 0 ? (
                        <div className="recommendation-grid">
                            {recommendedToPick.map((rec) => {
                                const isPickedByAlly = picksAlly.includes(rec.hero._id);
                                return (
                                    <div key={rec.hero._id} className="rec-card" style={{ border: isPickedByAlly ? '2px solid #28a745' : '1px solid #e0e0e0' }}>
                                        <div className="rec-header">
                                            <strong>
                                                {rec.hero.name} 
                                                {isPickedByAlly && <span style={{ color: '#28a745', fontSize: '12px', marginLeft: '8px' }}>(Đội Ta Đã Chọn)</span>}
                                            </strong> 
                                            <span className="score-badge">ĐIỂM TỐI ƯU: {rec.totalScore}</span>
                                        </div>
                                        <div className="rec-body">
                                            <p className="rec-detail-title">Giải thích lý do:</p>
                                            <ul className="rec-details-list">
                                                {rec.matchupDetails.map((detail, idx) => (
                                                    <li key={idx}>
                                                        Khắc chế <b>{getHeroName(detail.enemyId)}</b> ({detail.score}đ)
                                                        <div className="rec-note">"{detail.note}"</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="no-results">Chưa có dữ liệu từ Đội Địch hoặc không có đề xuất phù hợp.</p>
                    )}
                </div>

                {/* BẢNG 2: CẢNH BÁO MỐI ĐE DỌA TỪ ĐỊCH */}
                <div className="analysis-board board-threat">
                    <h2>⚠️ Cảnh báo: Tướng Địch khắc chế Ta</h2>
                    {isAnalyzing ? (
                        <p className="loading-text">Đang đánh giá rủi ro đội hình...</p>
                    ) : threatsToOurTeam.length > 0 ? (
                        <div className="recommendation-grid">
                            {threatsToOurTeam.map((threat) => {
                                const isPickedByEnemy = picksEnemy.includes(threat.hero._id);
                                return (
                                    <div key={threat.hero._id} className="rec-card threat-card" style={{ border: isPickedByEnemy ? '2px solid #dc3545' : '1px solid #e0e0e0' }}>
                                        <div className="rec-header threat-header">
                                            <strong>
                                                {threat.hero.name} 
                                                {isPickedByEnemy && <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '8px' }}>(Địch Đã Chọn)</span>}
                                            </strong> 
                                            <span className="score-badge threat-badge">MỨC NGUY HIỂM: {threat.totalScore}</span>
                                        </div>
                                        <div className="rec-body">
                                            <p className="rec-detail-title">Nguy hiểm vì:</p>
                                            <ul className="rec-details-list">
                                                {threat.matchupDetails.map((detail, idx) => (
                                                    <li key={idx}>
                                                        Khắc chế <b>{getHeroName(detail.enemyId)}</b> của Ta ({detail.score}đ)
                                                        <div className="rec-note">"{detail.note}"</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="no-results">Đội hình Ta hiện tại đang an toàn, chưa phát hiện thiên địch.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DraftMode;