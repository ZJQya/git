import React, { useState } from 'react';
import { Card, Select, Radio, Button, message, Image, Form, InputNumber } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { submitAnalysis, getTaskStatus, getResultImageUrl } from '../services/api';

const AnalysisPanel = ({ datasetList, taskType }) => {
    const [selectedDatasetId, setSelectedDatasetId] = useState(null);
    const [params, setParams] = useState({});
    const [resultImage, setResultImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const startAnalysis = async () => {
        if (!selectedDatasetId) {
            message.warning('请先选择数据集');
            return;
        }
        setLoading(true);
        try {
            const res = await submitAnalysis(selectedDatasetId, taskType, JSON.stringify(params));
            const taskIdRes = res.data.id;
            pollTaskStatus(taskIdRes);
        } catch {
            message.error('提交分析任务失败');
            setLoading(false);
        }
    };

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
            } catch {
                clearInterval(timer);
                setLoading(false);
            }
        }, 2000);
    };

    const renderParamForm = () => {
        switch (taskType) {
            case 'decision_tree':
                return (
                    <>
                        <Form.Item label="最大深度">
                            <InputNumber min={1} max={20} value={params.max_depth || 5} onChange={v => setParams({ ...params, max_depth: v })} />
                        </Form.Item>
                        <Form.Item label="测试集比例">
                            <InputNumber min={0.1} max={0.5} step={0.1} value={params.test_size || 0.2} onChange={v => setParams({ ...params, test_size: v })} />
                        </Form.Item>
                    </>
                );
            case 'kmeans':
                return (
                    <Form.Item label="聚类数">
                        <InputNumber min={2} max={10} value={params.n_clusters || 3} onChange={v => setParams({ ...params, n_clusters: v })} />
                    </Form.Item>
                );
            case 'apriori':
                return (
                    <>
                        <Form.Item label="最小支持度">
                            <InputNumber min={0.01} max={1} step={0.01} value={params.min_support || 0.2} onChange={v => setParams({ ...params, min_support: v })} />
                        </Form.Item>
                        <Form.Item label="最小提升度">
                            <InputNumber min={0.1} max={10} step={0.1} value={params.min_threshold || 0.6} onChange={v => setParams({ ...params, min_threshold: v })} />
                        </Form.Item>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Card title={`${taskType === 'decision_tree' ? '决策树' : taskType === 'kmeans' ? 'K-Means聚类' : '关联规则'} 分析`}>
            <Card title="选择数据集" style={{ marginBottom: 16 }}>
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
            <Card title="参数设置" style={{ marginBottom: 16 }}>
                {renderParamForm()}
                <Button type="primary" onClick={startAnalysis} loading={loading} block>
                    开始分析
                </Button>
            </Card>
            {resultImage && (
                <Card title="分析结果">
                    <Image src={resultImage} style={{ maxWidth: '100%' }} />
                    <div style={{ marginTop: 16 }}>
                        <Button icon={<UploadOutlined />} onClick={() => window.open(resultImage)}>下载图片</Button>
                    </div>
                </Card>
            )}
        </Card>
    );
};

export default AnalysisPanel;