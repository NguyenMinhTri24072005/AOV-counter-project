import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, forgotPassword, verifyOtp, resetPassword } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // --- STATE CHO BỘ ĐẾM GIỜ BỊ KHÓA (RATE LIMIT) ---
    const [lockoutTime, setLockoutTime] = useState(0);

    // --- STATE CHO QUÊN MẬT KHẨU ---
    const [forgotStep, setForgotStep] = useState(0);
    const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '', confirmNewPassword: '' });

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // 🌟 KÍCH HOẠT BỘ ĐẾM NGƯỢC
    useEffect(() => {
        let timer;
        if (lockoutTime > 0) {
            timer = setInterval(() => {
                setLockoutTime(prevTime => prevTime - 1);
            }, 1000);
        } else if (lockoutTime === 0 && error.includes('bị khóa')) {
            // Tự động xóa dòng lỗi khi hết thời gian khóa
            setError('');
        }
        return () => clearInterval(timer); // Dọn dẹp interval khi component unmount
    }, [lockoutTime, error]);

    // Format giây thành dạng MM:SS cho đẹp mắt
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Xử lý Đăng Nhập
    const handleLogin = async (e) => {
        e.preventDefault();

        if (lockoutTime > 0) return;

        try {
            const res = await loginUser({ username, password });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 429) {
                // 🌟 1. Lấy đúng câu thông báo từ Backend (Có chứa số phút)
                setError(err.response?.data?.message || 'Tài khoản tạm thời bị khóa!');

                // 🌟 2. Lấy CHÍNH XÁC số giây từ Backend để nạp vào đồng hồ đếm ngược
                const exactLockoutTime = err.response?.data?.lockoutTime || 300;
                setLockoutTime(exactLockoutTime);
            } else {
                setError(err.response?.data?.message || 'Lỗi đăng nhập!');
            }
        }
    };

    // --- CÁC HÀM XỬ LÝ QUÊN MẬT KHẨU ---
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            await forgotPassword({ email: forgotData.email });
            toast.success("Mã OTP đã được gửi đến Email của bạn!");
            setForgotStep(2);
        } catch (err) {
            if (err.response?.status === 429) {
                toast.error("Bạn thao tác quá nhanh! Vui lòng chờ một lát rồi thử lại.");
            } else {
                toast.error(err.response?.data?.message || "Lỗi gửi email!");
            }
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            await verifyOtp({ email: forgotData.email, otp: forgotData.otp });
            toast.success("Mã OTP hợp lệ! Vui lòng đặt mật khẩu mới.");
            setForgotStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || "OTP không chính xác hoặc đã hết hạn!");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (forgotData.newPassword !== forgotData.confirmNewPassword) {
            return toast.warning("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.");
        }

        try {
            await resetPassword({ email: forgotData.email, otp: forgotData.otp, newPassword: forgotData.newPassword });
            toast.success("Khôi phục mật khẩu thành công! Bạn có thể đăng nhập ngay.");
            setForgotStep(0);
            setForgotData({ email: '', otp: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi đặt lại mật khẩu!");
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
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Nhập tên đăng nhập..."
                            disabled={lockoutTime > 0} // Vô hiệu hóa ô nhập khi bị khóa
                        />
                    </div>
                    <div className="input-group">
                        <label>Mật khẩu an ninh</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu..."
                            disabled={lockoutTime > 0} // Vô hiệu hóa ô nhập khi bị khóa
                        />
                    </div>

                    {/* 🌟 NÚT ĐĂNG NHẬP HIỂN THỊ ĐẾM NGƯỢC */}
                    <button
                        type="submit"
                        className={`btn-auth btn-login ${lockoutTime > 0 ? 'btn-disabled' : ''}`}
                        disabled={lockoutTime > 0}
                        style={lockoutTime > 0 ? { cursor: 'not-allowed', opacity: 0.7, background: '#ef4444' } : {}}
                    >
                        {lockoutTime > 0 ? `BỊ KHÓA (${formatTime(lockoutTime)})` : 'TRUY CẬP'}
                    </button>
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

            {/* --- MODAL QUÊN MẬT KHẨU (3 BƯỚC) Giữ nguyên --- */}
            {forgotStep > 0 && (
                <div className="auth-modal-overlay">
                    <div className="auth-modal-card cyber-panel">
                        <button className="auth-modal-close" onClick={() => setForgotStep(0)}>×</button>
                        <h2 className="auth-title modal-title">KHÔI PHỤC KẾT NỐI</h2>

                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotPassword} className="forgot-form">
                                <p className="forgot-desc">Hệ thống cần định vị tín hiệu của bạn. Vui lòng nhập Email đã đăng ký.</p>
                                <input type="email" required placeholder="Nhập Email của bạn..."
                                    value={forgotData.email} onChange={e => setForgotData({ ...forgotData, email: e.target.value })}
                                    className="forgot-input" />
                                <button type="submit" className="btn-auth btn-step1">PHÁT TÍN HIỆU OTP</button>
                            </form>
                        )}

                        {forgotStep === 2 && (
                            <form onSubmit={handleVerifyOtp} className="forgot-form">
                                <p className="forgot-desc">Mã OTP 6 số đã được gửi qua Email. Liên kết sẽ đóng lại sau 10 phút.</p>
                                <input type="text" required maxLength="6" placeholder="------"
                                    value={forgotData.otp} onChange={e => setForgotData({ ...forgotData, otp: e.target.value })}
                                    className="forgot-input otp-input" />
                                <button type="submit" className="btn-auth btn-step2">XÁC THỰC MÃ BẢO MẬT</button>
                            </form>
                        )}

                        {forgotStep === 3 && (
                            <form onSubmit={handleResetPassword} className="forgot-form">
                                <p className="forgot-desc success-text">Kết nối ổn định! Vui lòng thiết lập Mật khẩu an ninh mới.</p>
                                <input type="password" required placeholder="Nhập mật khẩu mới..."
                                    value={forgotData.newPassword} onChange={e => setForgotData({ ...forgotData, newPassword: e.target.value })}
                                    className="forgot-input" />
                                <input type="password" required placeholder="Xác nhận lại mật khẩu mới..."
                                    value={forgotData.confirmNewPassword} onChange={e => setForgotData({ ...forgotData, confirmNewPassword: e.target.value })}
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