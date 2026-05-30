package com.datamine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.datamine.entity.Dataset;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DatasetMapper extends BaseMapper<Dataset> {
}
