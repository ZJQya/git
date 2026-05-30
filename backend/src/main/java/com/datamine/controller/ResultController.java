package com.datamine.controller;

import com.datamine.entity.AnalysisTask;
import com.datamine.mapper.AnalysisTaskMapper;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/result")
public class ResultController {

    private final AnalysisTaskMapper taskMapper;

    public ResultController(AnalysisTaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @GetMapping("/image/{taskId}")
    public ResponseEntity<Resource> getImage(@PathVariable Long taskId) {
        AnalysisTask task = taskMapper.selectById(taskId);
        if (task == null || task.getResultPath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path imagePath = Paths.get(task.getResultPath());
        if (!imagePath.toFile().exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(imagePath);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }
}
