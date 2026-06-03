package com.datamine.controller;

import com.datamine.entity.AnalysisTask;
import com.datamine.service.AnalysisService;
import com.datamine.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final JwtTokenUtil jwtTokenUtil;

    public AnalysisController(AnalysisService analysisService,JwtTokenUtil jwtTokenUtil) {
        this.analysisService = analysisService;
        this.jwtTokenUtil = jwtTokenUtil;
    }



    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest)  {
        Long datasetId = Long.valueOf(request.get("datasetId").toString());
        String taskType = (String) request.get("taskType");
        String params = request.getOrDefault("params", "{}").toString();
        String token = httpRequest.getHeader("Authorization").substring(7);
        Long userId = jwtTokenUtil.getUserIdFromToken(token);
        AnalysisTask task = analysisService.submitTask(datasetId, taskType, params, userId);
        return ResponseEntity.ok(Map.of("id", task.getId()));
    }

    @GetMapping("/status/{taskId}")
    public ResponseEntity<?> status(@PathVariable Long taskId) {
        AnalysisTask task = analysisService.getTaskStatus(taskId);
        return ResponseEntity.ok(Map.of("status", task.getStatus()));
    }
}
