package com.datamine.controller;

import com.datamine.service.AnalysisService;
import com.datamine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserService userService;
    @Autowired
    private AnalysisService analysisService;

    // 获取所有用户
    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        return ResponseEntity.ok(userService.listAll());
    }

    // 删除用户
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.removeById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // 所有分析记录
    @GetMapping("/analysis")
    public ResponseEntity<?> allAnalysis() {
        return ResponseEntity.ok(analysisService.getAllHistory());
    }
}
