package com.datamine.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("dataset")
public class Dataset {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String originalName;
    private String storedPath;
    private Long fileSize;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime uploadTime;
}
