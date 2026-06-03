package com.datamine.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("analysis_task")
public class AnalysisTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long datasetId;
    private Long userId;
    private String taskType;
    private String parameters;
    private String status;
    private String resultPath;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(exist = false)
    private String datasetName;


}
