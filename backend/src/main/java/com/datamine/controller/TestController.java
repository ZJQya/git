package com.datamine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/redis-test")
    public String test() {
        // 写入 Redis
        redisTemplate.opsForValue().set("hello", "world");
        // 从 Redis 读取
        return "Redis 连接成功，读取到的值：" + redisTemplate.opsForValue().get("hello");
    }
}