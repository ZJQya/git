package com.datamine;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "123456";
        String newEncoded = encoder.encode(rawPassword);
        System.out.println("新密文: " + newEncoded);
        String encoded = "$2a$10$ZxTX2EXuu20X/wrF.zYvl.Bebnp8ZqxB2QcHk5C/1iqMAgPUOSjNC";  // 从数据库复制过来
        System.out.println("匹配结果: " + encoder.matches("123456", encoded));
    }
}
//UPDATE user SET password = '$2a$10$ZxTX2EXuu20X/wrF.zYvl.Bebnp8ZqxB2QcHk5C/1iqMAgPUOSjNC' WHERE username = 'admin';