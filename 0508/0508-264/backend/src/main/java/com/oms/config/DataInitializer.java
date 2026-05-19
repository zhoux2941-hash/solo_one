package com.oms.config;

import com.oms.entity.*;
import com.oms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Tenant tenant = new Tenant();
        tenant.setTenantCode("T001");
        tenant.setTenantName("演示企业");
        tenant.setContactPerson("张三");
        tenant.setContactPhone("13800138000");
        tenant.setEmail("demo@example.com");
        tenant = tenantRepository.save(tenant);

        Permission menuDashboard = createPermission(null, "仪表盘", "dashboard", Permission.PermissionType.MENU, "/dashboard", "Dashboard", "dashboard", 1);
        Permission menuOrder = createPermission(null, "订单管理", "order", Permission.PermissionType.MENU, "/order", "Order", "shopping", 2);
        Permission btnOrderCreate = createPermission(menuOrder.getId(), "创建订单", "order:create", Permission.PermissionType.BUTTON, null, null, null, 1);
        Permission btnOrderApprove = createPermission(menuOrder.getId(), "审批订单", "order:approve", Permission.PermissionType.BUTTON, null, null, null, 2);
        Permission menuProduct = createPermission(null, "商品管理", "product", Permission.PermissionType.MENU, "/product", "Product", "shop", 3);
        Permission menuFinance = createPermission(null, "财务报表", "finance", Permission.PermissionType.MENU, "/finance", "Finance", "dollar", 4);
        Permission menuSystem = createPermission(null, "系统管理", "system", Permission.PermissionType.MENU, "/system", "System", "setting", 5);

        Role adminRole = new Role();
        adminRole.setTenantId(tenant.getId());
        adminRole.setRoleName("系统管理员");
        adminRole.setRoleCode("ADMIN");
        adminRole.setDescription("拥有所有权限");
        Set<Permission> permissions = new HashSet<>();
        permissions.add(menuDashboard);
        permissions.add(menuOrder);
        permissions.add(btnOrderCreate);
        permissions.add(btnOrderApprove);
        permissions.add(menuProduct);
        permissions.add(menuFinance);
        permissions.add(menuSystem);
        adminRole.setPermissions(permissions);
        adminRole = roleRepository.save(adminRole);

        User admin = new User();
        admin.setTenantId(tenant.getId());
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRealName("系统管理员");
        admin.setEmail("admin@example.com");
        admin.setRoles(new HashSet<>(Set.of(adminRole)));
        userRepository.save(admin);

        createProduct(tenant.getId(), "苹果手机 iPhone 15 Pro", "P001", "数码电子", "Apple", "台", new BigDecimal("7999"), new BigDecimal("8999"), new BigDecimal("8499"), 100);
        createProduct(tenant.getId(), "华为 Mate 60 Pro", "P002", "数码电子", "Huawei", "台", new BigDecimal("5999"), new BigDecimal("6999"), new BigDecimal("6499"), 80);
        createProduct(tenant.getId(), "联想笔记本电脑 ThinkPad", "P003", "电脑办公", "Lenovo", "台", new BigDecimal("4999"), new BigDecimal("5999"), new BigDecimal("5499"), 50);
    }

    private Permission createPermission(Long parentId, String name, String code, Permission.PermissionType type, String path, String component, String icon, int sort) {
        Permission perm = new Permission();
        perm.setParentId(parentId);
        perm.setPermissionName(name);
        perm.setPermissionCode(code);
        perm.setType(type);
        perm.setPath(path);
        perm.setComponent(component);
        perm.setIcon(icon);
        perm.setSortOrder(sort);
        return permissionRepository.save(perm);
    }

    private void createProduct(Long tenantId, String name, String sku, String category, String brand, String unit, BigDecimal cost, BigDecimal sale, BigDecimal vip, int stock) {
        Product product = new Product();
        product.setTenantId(tenantId);
        product.setProductName(name);
        product.setSkuCode(sku);
        product.setCategory(category);
        product.setBrand(brand);
        product.setUnit(unit);
        product.setCostPrice(cost);
        product.setSalePrice(sale);
        product.setVipPrice(vip);
        product.setStockQuantity(stock);
        product.setWarnQuantity(10);
        productRepository.save(product);
    }
}
