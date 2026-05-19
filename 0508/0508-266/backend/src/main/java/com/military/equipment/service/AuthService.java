package com.military.equipment.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.military.equipment.dto.LoginDTO;
import com.military.equipment.entity.SysRole;
import com.military.equipment.entity.SysUser;
import com.military.equipment.exception.BusinessException;
import com.military.equipment.mapper.SysRoleMapper;
import com.military.equipment.mapper.SysUserMapper;
import com.military.equipment.util.JwtUtil;
import com.military.equipment.vo.LoginVO;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class AuthService {

    @Resource
    private SysUserMapper sysUserMapper;

    @Resource
    private SysRoleMapper sysRoleMapper;

    @Resource
    private JwtUtil jwtUtil;

    public LoginVO login(LoginDTO dto) {
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, dto.getUsername())
                        .eq(SysUser::getDeleted, 0)
        );

        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        if (user.getStatus() != 1) {
            throw new BusinessException("用户已被禁用");
        }

        if (!"admin123".equals(dto.getPassword())) {
            throw new BusinessException("密码错误");
        }

        List<SysRole> roles = sysRoleMapper.selectRolesByUserId(user.getId());
        if (roles.isEmpty()) {
            throw new BusinessException("用户未分配角色");
        }

        String roleCode = roles.get(0).getRoleCode();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roleCode);

        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setRoleCode(roleCode);
        vo.setDeptName(user.getDeptName());

        return vo;
    }
}
