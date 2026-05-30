package com.datamine.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.datamine.entity.User;
import com.datamine.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService extends ServiceImpl<UserMapper, User> {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean existsByUsername(String username) {
        return userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)) > 0;
    }


    public void registerUser(String username, String password, String email) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRole("USER");      // 默认角色为 USER
        user.setVip(false);        // 默认非 VIP
        userMapper.insert(user);
    }

//    public void registerUser(String username, String password, String email) {
//        User user = new User();
//        user.setUsername(username);
//        user.setPassword(passwordEncoder.encode(password));
//        user.setEmail(email);
//        userMapper.insert(user);
//    }

    // 根据用户名查询用户
    public User getByUsername(String username) {
        return baseMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    // 激活 VIP
    public void activateVip(Long userId, int days) {
        User user = getById(userId);
        if (user != null) {
            user.setVip(true);
            user.setVipExpireTime(LocalDateTime.now().plusDays(days));
            updateById(user);
        }
    }
    public List<User> listAll() {
        return userMapper.selectList(null);   // 无条件查询所有用户
    }
    public void deleteUser(Long userId) {
        userMapper.deleteById(userId);
    }


}