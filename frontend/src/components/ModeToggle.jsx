import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ModeToggle = ({ mode, setMode }) => {
    const { user } = useContext(AuthContext);

    const handleModeChange = (newMode) => {
        // Chỉ yêu cầu đăng nhập đối với 'Của tôi' và 'So sánh chéo'
        if (!user && (newMode === 'custom' || newMode === 'compare')) {
            alert("Vui lòng đăng nhập để sử dụng tính năng cá nhân hóa!");
            return;
        }
        setMode(newMode);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <strong style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px' }}>Nguồn dữ liệu:</strong>
            <div style={{ display: 'flex', background: '#0b0f19', padding: '5px', borderRadius: '25px', border: '1px solid #1e293b' }}>
                <button 
                    onClick={() => handleModeChange('standard')}
                    style={{ border: 'none', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', background: mode === 'standard' ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: mode === 'standard' ? '#38bdf8' : '#64748b' }}>
                    🌐 Hệ thống
                </button>
                <button 
                    onClick={() => handleModeChange('community')}
                    style={{ border: 'none', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', background: mode === 'community' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', color: mode === 'community' ? '#a855f7' : '#64748b' }}>
                    👥 Cộng đồng
                </button>
                <button 
                    onClick={() => handleModeChange('custom')}
                    style={{ border: 'none', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', background: mode === 'custom' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: mode === 'custom' ? '#10b981' : '#64748b', opacity: user ? 1 : 0.5 }}>
                    👤 Của tôi
                </button>
                <button 
                    onClick={() => handleModeChange('compare')}
                    style={{ border: 'none', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', background: mode === 'compare' ? 'rgba(239, 68, 68, 0.15)' : 'transparent', color: mode === 'compare' ? '#ef4444' : '#64748b', opacity: user ? 1 : 0.5 }}>
                    🔄 So sánh chéo
                </button>
            </div>
        </div>
    );
};

export default ModeToggle;