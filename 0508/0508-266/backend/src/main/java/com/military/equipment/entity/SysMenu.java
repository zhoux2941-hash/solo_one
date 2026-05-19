package com.military.equipment.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.military.equipment.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_menu")
public class SysMenu extends BaseEntity {
    private Long parentId;
    private String menuName;
    private String menuPath;
    private String menuComponent;
    private String menuIcon;
    private Integer menuType;
    private String permissionCode;
    private Integer sortOrder;
    private Integer status;

    @TableField(exist = false)
    private List<SysMenu> children;
}
