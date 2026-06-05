import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { login } from '../services/api';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [captcha, setCaptcha] = useState({ token: '', image: '' });
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaReady, setCaptchaReady] = useState(false); // 标记验证码是否已加载

    // 获取验证码
    const refreshCaptcha = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/captcha/generate');
            setCaptcha(res.data);
            setCaptchaReady(true);
            setCaptchaInput(''); // 清空输入框
        } catch {
            message.error('获取验证码失败，请稍后重试');
            setCaptchaReady(false);
        }
    };

    useEffect(() => {
        refreshCaptcha();
    }, []);

    const onFinish = async (values) => {
        // 校验验证码是否已就绪
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
            const res = await login(values.username, values.password, captcha.token, captchaInput);
            localStorage.setItem('token', res.data.token);
            message.success('登录成功');
            onLoginSuccess();
        } catch (error) {
            const errMsg = error.response?.data?.error || '用户名或密码错误';
            message.error(errMsg);
            refreshCaptcha();   // 失败时刷新验证码
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100vh', background: '#f0f2f5'
        }}>
            <Card title="数据挖掘系统" style={{ width: 400 }}>
                <Form onFinish={onFinish}>
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

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
                            登录
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        没有账号？ <Link to="/register">立即注册</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;