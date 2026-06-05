import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { register } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [captcha, setCaptcha] = useState({ token: '', image: '' });
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaReady, setCaptchaReady] = useState(false);
    const navigate = useNavigate();

    const refreshCaptcha = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/captcha/generate');
            setCaptcha(res.data);
            setCaptchaReady(true);
            setCaptchaInput('');
        } catch {
            message.error('获取验证码失败，请稍后重试');
            setCaptchaReady(false);
        }
    };

    useEffect(() => {
        refreshCaptcha();
    }, []);

    const onFinish = async (values) => {
        if (!captchaReady || !captcha.token) {
            message.error('验证码未加载，请刷新后重试');
            return;
        }
        if (!captchaInput) {
            message.error('请输入验证码');
            return;
        }

        setLoading(true);
        try {
            await register(values.username, values.password, values.email, captcha.token, captchaInput);
            message.success('注册成功，请登录');
            navigate('/login');
        } catch (error) {
            const errMsg = error.response?.data?.error || '注册失败';
            message.error(errMsg);
            refreshCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100vh', background: '#f0f2f5'
        }}>
            <Card title="注册新用户" style={{ width: 400 }}>
                <Form onFinish={onFinish}>
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>
                    <Form.Item name="email" rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}>
                        <Input prefix={<MailOutlined />} placeholder="邮箱" />
                    </Form.Item>

                    {/* 验证码部分保持不变 */}
                    <Form.Item>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                prefix={<SafetyOutlined />}
                                placeholder="验证码"
                                value={captchaInput}
                                onChange={e => setCaptchaInput(e.target.value)}
                                style={{ width: 'calc(100% - 80px)' }}
                            />
                            <Button
                                type="text"
                                onClick={refreshCaptcha}
                                style={{
                                    padding: 0,
                                    height: '32px',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={captcha.image}
                                    alt="验证码"
                                    style={{ height: '100%', display: 'block' }}
                                />
                            </Button>
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            注册
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        已有账号？ <Link to="/login">立即登录</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;