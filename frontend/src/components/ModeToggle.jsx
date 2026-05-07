import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ModeToggle = ({ mode, setMode }) => {
    const { user } = useContext(AuthContext);

    const handleModeChange = (newMode) => {
        if (!user && newMode !== 'standard') {
            alert("Vui lòng đăng nhập để xem Kèo cá nhân!");
            return;
        }
        setMode(newMode);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', background: '#f8f9fa', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <strong style={{ color: '#495057' }}>Nguồn dữ liệu:</strong>
            <div style={{ display: 'flex', background: '#e9ecef', padding: '4px', borderRadius: '25px' }}>
                <button 
                    onClick={() => handleModeChange('standard')}
                    style={{ border: 'none', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: mode === 'standard' ? 'white' : 'transparent', color: mode === 'standard' ? '#007bff' : '#6c757d', boxShadow: mode === 'standard' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                    🌐 Hệ thống
                </button>
                <button 
                    onClick={() => handleModeChange('custom')}
                    style={{ border: 'none', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: mode === 'custom' ? 'white' : 'transparent', color: mode === 'custom' ? '#28a745' : '#6c757d', boxShadow: mode === 'custom' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', opacity: user ? 1 : 0.5 }}>
                    👤 Của tôi
                </button>
                <button 
                    onClick={() => handleModeChange('compare')}
                    style={{ border: 'none', padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: mode === 'compare' ? 'white' : 'transparent', color: mode === 'compare' ? '#dc3545' : '#6c757d', boxShadow: mode === 'compare' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', opacity: user ? 1 : 0.5 }}>
                    🔄 So sánh chéo
                </button>
            </div>
        </div>
    );
};

export default ModeToggle;