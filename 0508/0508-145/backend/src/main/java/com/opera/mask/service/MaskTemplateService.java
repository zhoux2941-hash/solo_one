package com.opera.mask.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.opera.mask.entity.MaskTemplate;

import java.util.List;

public interface MaskTemplateService extends IService<MaskTemplate> {
    List<MaskTemplate> getDefaultTemplates();
    MaskTemplate getTemplateById(Long id);
    MaskTemplate uploadCustomTemplate(String svgContent, String name, String description, String regions, Long userId);
}
