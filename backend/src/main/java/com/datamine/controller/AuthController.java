package com.datamine.controller;

import com.datamine.dto.RegisterRequest;
import com.datamine.entity.User;
import com.datamine.service.CaptchaService;
import com.datamine.service.JwtUserDetailsService;
import com.datamine.service.UserService;
import com.datamine.util.JwtTokenUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final JwtUserDetailsService userDetailsService;
    private final UserService userService;   // 新增字段


    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenUtil jwtTokenUtil,
                          JwtUserDetailsService userDetailsService,UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
        this.userDetailsService = userDetailsService;
        this.userService = userService; // 关键：必须赋值
    }
    @Autowired
    private CaptchaService captchaService;
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {

        // 校验验证码
        String captchaToken = loginRequest.get("captchaToken");
        String captchaCode = loginRequest.get("captchaCode");
        if (captchaToken == null || !captchaService.verify(captchaToken, captchaCode)) {
            return ResponseEntity.badRequest().body(Map.of("error", "验证码错误"));
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.get("username"), loginRequest.get("password"))
        );
        //
        final UserDetails userDetails = userDetailsService.loadUserByUsername(
                loginRequest.get("username"));
        // 查询完整用户信息，获取ID
        User user = userService.getByUsername(loginRequest.get("username"));
        final String token = jwtTokenUtil.generateToken(userDetails, user.getId());
        return ResponseEntity.ok(Map.of("token", token));

//        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.get("username"));
//        final String token = jwtTokenUtil.generateToken(userDetails);
//        return ResponseEntity.ok(Map.of("token", token));
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        String captchaToken = request.getCaptchaToken();   // 需在 RegisterRequest 中添加字段
        String captchaCode = request.getCaptchaCode();
        if (captchaToken == null || !captchaService.verify(captchaToken, captchaCode)) {
            return ResponseEntity.badRequest().body(Map.of("error", "验证码错误"));
        }

        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        userService.registerUser(request.getUsername(), request.getPassword(), request.getEmail());
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }



}
