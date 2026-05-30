import React, { useState } from 'react';
import {
    Layout, Menu, Button, Upload, message, Card, Select, Radio,
    Space, Image, Form, InputNumber
} from 'antd';
import { UploadOutlined, InboxOutlined, LogoutOutlined } from '@ant-design/icons';
import { uploadDataset, submitAnalysis, getTaskStatus, getResultImageUrl } from '../services/api';

import { Link } from 'react-router-dom';
import { activateVip } from '../services/api'; // 需要在 api.js 中定义

const { Content, Sider } = Layout;
const { Dragger } = Upload;



const handleActivateVip = async () => {
    try {
        await activateVip();
        message.success('VIP 已开通（有效期30天）');
    } catch (error) {
        message.error('开通失败');
    }
};

const Dashboard = ({ onLogout }) => {
    const [datasetList, setDatasetList] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState(null);
    const [taskType, setTaskType] = useState('decision_tree');
    const [taskId, setTaskId] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({});  // 新增：存储分析参数

    // 上传数据集
    const handleUpload = async (file) => {
        setLoading(true);
        try {
            const res = await uploadDataset(file);
            message.success('上传成功');
            setSelectedDatasetId(res.data.id);
            setDatasetList([...datasetList, { id: res.data.id, name: file.name }]);
        } catch (error) {
            message.error('上传失败');
        } finally {
            setLoading(false);
        }
        return false;
    };

    // 开始分析，传入参数
    const startAnalysis = async () => {
        if (!selectedDatasetId) {
            message.warning('请先选择数据集');
            return;
        }
        setLoading(true);
        try {
            // 将参数对象转为 JSON 字符串传递给后端
            const res = await submitAnalysis(selectedDatasetId, taskType, JSON.stringify(params));
            const taskIdRes = res.data.id;
            setTaskId(taskIdRes);
            pollTaskStatus(taskIdRes);
        } catch (error) {
            message.error('提交分析任务失败');
            setLoading(false);
        }
    };

    // 轮询任务状态
    const pollTaskStatus = (id) => {
        const timer = setInterval(async () => {
            try {
                const res = await getTaskStatus(id);
                if (res.data.status === 'SUCCESS') {
                    clearInterval(timer);
                    setLoading(false);
                    setResultImage(getResultImageUrl(id));
                    message.success('分析完成');
                } else if (res.data.status === 'FAILED') {
                    clearInterval(timer);
                    setLoading(false);
                    message.error('分析失败');
                }
            } catch (e) {
                clearInterval(timer);
                setLoading(false);
            }
        }, 2000);
    };

    // 切换分析方法时重置参数
    const handleTaskTypeChange = (e) => {
        setTaskType(e.target.value);
        setParams({});
    };

    // 动态渲染参数表单
    const renderParamForm = () => {
        switch (taskType) {
            case 'decision_tree':
                return (
                    <>
                        <Form.Item label="最大深度 (max_depth)">
                            <InputNumber
                                min={1}
                                max={20}
                                value={params.max_depth || 5}
                                onChange={(v) => setParams({ ...params, max_depth: v })}
                            />
                        </Form.Item>
                        <Form.Item label="测试集比例 (test_size)">
                            <InputNumber
                                min={0.1}
                                max={0.5}
                                step={0.1}
                                value={params.test_size || 0.2}
                                onChange={(v) => setParams({ ...params, test_size: v })}
                            />
                        </Form.Item>
                    </>
                );
            case 'kmeans':
                return (
                    <Form.Item label="聚类数 (n_clusters)">
                        <InputNumber
                            min={2}
                            max={10}
                            value={params.n_clusters || 3}
                            onChange={(v) => setParams({ ...params, n_clusters: v })}
                        />
                    </Form.Item>
                );
            case 'apriori':
                return (
                    <>
                        <Form.Item label="最小支持度 (min_support)">
                            <InputNumber
                                min={0.01}
                                max={1}
                                step={0.01}
                                value={params.min_support || 0.2}
                                onChange={(v) => setParams({ ...params, min_support: v })}
                            />
                        </Form.Item>
                        <Form.Item label="最小提升度 (min_threshold)">
                            <InputNumber
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={params.min_threshold || 0.6}
                                onChange={(v) => setParams({ ...params, min_threshold: v })}
                            />
                        </Form.Item>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="light">
                <div style={{ padding: 16, fontWeight: 'bold', fontSize: 18 }}>数据挖掘工具</div>
                <Menu mode="inline" defaultSelectedKeys={['upload']}>
                    <Menu.Item key="upload">数据集管理</Menu.Item>
                    {/* 新增按钮 */}
                    <div style={{ padding: '0 16px', marginBottom: 20 }}>
                        <Button onClick={handleActivateVip} block style={{ marginBottom: 10 }}>开通VIP</Button>
                        <Link to="/history">
                            <Button block>查看历史记录</Button>
                        </Link>
                    </div>
                </Menu>
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                    <Button icon={<LogoutOutlined />} onClick={onLogout}>退出登录</Button>
                </div>
            </Sider>
            <Layout>
                <Content style={{ padding: 24, background: '#fff' }}>
                    <Card title="上传数据集">
                        <Dragger name="file" multiple={false} beforeUpload={handleUpload} showUploadList={false}>
                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                            <p>点击或拖拽CSV文件到此区域上传</p>
                        </Dragger>
                    </Card>

                    {datasetList.length > 0 && (
                        <Card title="选择数据集">
                            <Select
                                style={{ width: '100%' }}
                                placeholder="选择数据集"
                                value={selectedDatasetId}
                                onChange={setSelectedDatasetId}
                            >
                                {datasetList.map(ds => (
                                    <Select.Option key={ds.id} value={ds.id}>{ds.name}</Select.Option>
                                ))}
                            </Select>
                        </Card>
                    )}

                    <Card title="分析方法">
                        <Radio.Group value={taskType} onChange={handleTaskTypeChange}>
                            <Radio.Button value="decision_tree">决策树</Radio.Button>
                            <Radio.Button value="kmeans">K-Means聚类</Radio.Button>
                            <Radio.Button value="apriori">关联规则</Radio.Button>
                        </Radio.Group>

                        {/* 动态参数面板 */}
                        <div style={{ marginTop: 16 }}>{renderParamForm()}</div>

                        <Button type="primary" onClick={startAnalysis} loading={loading} style={{ marginLeft: 0, marginTop: 16 }}>
                            开始分析
                        </Button>
                    </Card>

                    {resultImage && (
                        <Card title="分析结果">
                            <Image src={resultImage} style={{ maxWidth: '100%' }} />
                            <div style={{ marginTop: 16 }}>
                                <Button icon={<UploadOutlined />} onClick={() => window.open(resultImage)}>
                                    下载图片
                                </Button>
                            </div>
                        </Card>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;