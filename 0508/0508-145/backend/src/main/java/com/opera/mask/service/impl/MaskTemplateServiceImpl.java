package com.opera.mask.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.opera.mask.entity.MaskTemplate;
import com.opera.mask.mapper.MaskTemplateMapper;
import com.opera.mask.service.MaskTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaskTemplateServiceImpl extends ServiceImpl<MaskTemplateMapper, MaskTemplate> implements MaskTemplateService {

    @Override
    public List<MaskTemplate> getDefaultTemplates() {
        return list(new LambdaQueryWrapper<MaskTemplate>()
                .eq(MaskTemplate::getIsDefault, 1)
                .eq(MaskTemplate::getDeleted, 0)
                .orderByAsc(MaskTemplate::getId));
    }

    @Override
    public MaskTemplate getTemplateById(Long id) {
        return getById(id);
    }

    @Override
    public MaskTemplate uploadCustomTemplate(String svgContent, String name, String description, String regions, Long userId) {
        MaskTemplate template = new MaskTemplate();
        template.setName(name);
        template.setDescription(description);
        template.setType("custom");
        template.setSvgContent(svgContent);
        template.setRegions(regions);
        template.setIsDefault(0);
        template.setCreateBy(userId);
        template.setCreateTime(LocalDateTime.now());
        template.setUpdateTime(LocalDateTime.now());
        template.setDeleted(0);
        save(template);
        return template;
    }
}
