package com.datamine.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.datamine.entity.AnalysisTask;
import com.datamine.entity.Dataset;
import com.datamine.mapper.AnalysisTaskMapper;
import com.datamine.mapper.DatasetMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AnalysisService {

    private final AnalysisTaskMapper taskMapper;
    private final DatasetMapper datasetMapper;
    private final RestTemplate restTemplate;
    private final ExecutorService executor = Executors.newFixedThreadPool(5);

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    public AnalysisService(AnalysisTaskMapper taskMapper, DatasetMapper datasetMapper) {
        this.taskMapper = taskMapper;
        this.datasetMapper = datasetMapper;
        this.restTemplate = new RestTemplate();
    }

    public AnalysisTask submitTask(Long datasetId, String taskType, String params, Long userId) {
        AnalysisTask task = new AnalysisTask();
        task.setDatasetId(datasetId);
        task.setUserId(userId);
        task.setTaskType(taskType);
        task.setParameters(params);
        task.setStatus("PENDING");
        taskMapper.insert(task);

        executor.submit(() -> executeAnalysis(task));
        return task;
    }

    private void executeAnalysis(AnalysisTask task) {
        task.setStatus("RUNNING");
        taskMapper.updateById(task);

        Dataset dataset = datasetMapper.selectById(task.getDatasetId());
        if (dataset == null) {
            task.setStatus("FAILED");
            taskMapper.updateById(task);
            return;
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("file_path", dataset.getStoredPath());
        requestBody.put("task_type", task.getTaskType());
        requestBody.put("params", task.getParameters());
        requestBody.put("task_id", task.getId());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    pythonServiceUrl + "/analyze", requestBody, Map.class);
            if (response != null && response.containsKey("image_path")) {
                task.setResultPath((String) response.get("image_path"));
                task.setStatus("SUCCESS");
            } else {
                task.setStatus("FAILED");
            }
        } catch (Exception e) {
            task.setStatus("FAILED");
        }
        taskMapper.updateById(task);
    }

    public AnalysisTask getTaskStatus(Long taskId) {
        return taskMapper.selectById(taskId);
    }

    //AnalysisService 补充方法
    public List<AnalysisTask> getUserHistory(Long userId) {
        return taskMapper.selectList(new LambdaQueryWrapper<AnalysisTask>().eq(AnalysisTask::getUserId, userId).orderByDesc(AnalysisTask::getCreateTime));
    }

    public List<AnalysisTask> getAllHistory() {
        return taskMapper.selectList(new LambdaQueryWrapper<AnalysisTask>().orderByDesc(AnalysisTask::getCreateTime));
    }
}
