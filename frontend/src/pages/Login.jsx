import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, forgotPassword, verifyOtp, resetPassword } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // --- STATE CHO QUÊN MẬT KHẨU ---
    const [forgotStep, setForgotStep] = useState(0); // 0: Ẩn, 1: Email, 2: OTP, 3: Pass mới
    // 🌟 Đã thêm confirmNewPassword vào state
    const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '', confirmNewPassword: '' });

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Xử lý Đăng Nhập
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await loginUser({ username, password });
            login(res.data.user, res.data.token);
            navigate('/'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi đăng nhập!');
        }
    };

    // --- CÁC HÀM XỬ LÝ QUÊN MẬT KHẨU ---
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            await forgotPassword({ email: forgotData.email });
            alert("Mã OTP đã được gửi đến Email của bạn!");
            setForgotStep(2);
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi gửi email!");
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            await verifyOtp({ email: forgotData.email, otp: forgotData.otp });
            alert("Mã OTP hợp lệ! Vui lòng đặt mật khẩu mới.");
            setForgotStep(3);
        } catch (err) {
            alert(err.response?.data?.message || "OTP không chính xác hoặc đã hết hạn!");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        // 🌟 KIỂM TRA MẬT KHẨU NHẬP LẠI
        if (forgotData.newPassword !== forgotData.confirmNewPassword) {
            return alert("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.");
        }

        try {
            await resetPassword({ email: forgotData.email, otp: forgotData.otp, newPassword: forgotData.newPassword });
            alert("Khôi phục mật khẩu thành công! Bạn có thể đăng nhập ngay.");
            setForgotStep(0);
            // Reset lại toàn bộ dữ liệu
            setForgotData({ email: '', otp: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đặt lại mật khẩu!");
        }
    };

    return (
        <div className="auth-container">
            {/* --- FORM ĐĂNG NHẬP CHÍNH --- */}
            <div className="auth-card cyber-panel">
                <h2 className="auth-title">ĐĂNG NHẬP HỆ THỐNG</h2>
                {error && <p className="error-msg">{error}</p>}
                
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Tên tài khoản</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Nhập tên đăng nhập..." />
                    </div>
                    <div className="input-group">
                        <label>Mật khẩu an ninh</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu..." />
                    </div>
                    <button type="submit" className="btn-auth btn-login">TRUY CẬP</button>
                </form>

                <div className="forgot-pwd-link-wrap">
                    <span className="forgot-pwd-link" onClick={() => setForgotStep(1)}>
                        Quay lùi thời gian? (Quên mật khẩu)
                    </span>
                </div>

                <p className="auth-switch">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            </div>

            {/* --- MODAL QUÊN MẬT KHẨU (3 BƯỚC) --- */}
            {forgotStep > 0 && (
                <div className="auth-modal-overlay">
                    <div className="auth-modal-card cyber-panel">
                        <button className="auth-modal-close" onClick={() => setForgotStep(0)}>×</button>
                        <h2 className="auth-title modal-title">KHÔI PHỤC KẾT NỐI</h2>
                        
                        {/* BƯỚC 1: NHẬP EMAIL */}
                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotPassword} className="forgot-form">
                                <p className="forgot-desc">Hệ thống cần định vị tín hiệu của bạn. Vui lòng nhập Email đã đăng ký.</p>
                                <input type="email" required placeholder="Nhập Email của bạn..." 
                                    value={forgotData.email} onChange={e => setForgotData({...forgotData, email: e.target.value})}
                                    className="forgot-input" />
                                <button type="submit" className="btn-auth btn-step1">PHÁT TÍN HIỆU OTP</button>
                            </form>
                        )}

                        {/* BƯỚC 2: NHẬP MẬT OTP */}
                        {forgotStep === 2 && (
                            <form onSubmit={handleVerifyOtp} className="forgot-form">
                                <p className="forgot-desc">Mã OTP 6 số đã được gửi qua Email. Liên kết sẽ đóng lại sau 10 phút.</p>
                                <input type="text" required maxLength="6" placeholder="------" 
                                    value={forgotData.otp} onChange={e => setForgotData({...forgotData, otp: e.target.value})}
                                    className="forgot-input otp-input" />
                                <button type="submit" className="btn-auth btn-step2">XÁC THỰC MÃ BẢO MẬT</button>
                            </form>
                        )}

                        {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI (ĐÃ THÊM XÁC NHẬN LẠI) */}
                        {forgotStep === 3 && (
                            <form onSubmit={handleResetPassword} className="forgot-form">
                                <p className="forgot-desc success-text">Kết nối ổn định! Vui lòng thiết lập Mật khẩu an ninh mới.</p>
                                
                                <input type="password" required placeholder="Nhập mật khẩu mới..." 
                                    value={forgotData.newPassword} onChange={e => setForgotData({...forgotData, newPassword: e.target.value})}
                                    className="forgot-input" />
                                    
                                {/* 🌟 Bổ sung ô nhập lại mật khẩu */}
                                <input type="password" required placeholder="Xác nhận lại mật khẩu mới..." 
                                    value={forgotData.confirmNewPassword} onChange={e => setForgotData({...forgotData, confirmNewPassword: e.target.value})}
                                    className="forgot-input" />

                                <button type="submit" className="btn-auth btn-step3">GHI ĐÈ MẬT KHẨU</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;