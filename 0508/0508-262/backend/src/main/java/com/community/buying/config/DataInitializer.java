package com.community.buying.config;

import com.community.buying.entity.*;
import com.community.buying.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initPermissions();
        initRoles();
        initUsers();
        initCategories();
        initProducts();
    }

    private void initPermissions() {
        if (permissionRepository.count() == 0) {
            String[][] permissions = {
                {"admin:all", "管理员全部权限"},
                {"product:read", "查看商品"},
                {"product:write", "编辑商品"},
                {"order:read", "查看订单"},
                {"order:write", "编辑订单"},
                {"store:read", "查看门店"},
                {"store:write", "编辑门店"},
                {"group:read", "查看团购"},
                {"group:write", "编辑团购"},
                {"refund:read", "查看退款"},
                {"refund:write", "审核退款"}
            };

            for (String[] p : permissions) {
                Permission permission = new Permission();
                permission.setPermissionCode(p[0]);
                permission.setPermissionName(p[1]);
                permission.setStatus(1);
                permissionRepository.save(permission);
            }
        }
    }

    private void initRoles() {
        if (roleRepository.count() == 0) {
            Set<Permission> allPermissions = new HashSet<>(permissionRepository.findAll());

            Role adminRole = new Role();
            adminRole.setRoleCode("ADMIN");
            adminRole.setRoleName("管理员");
            adminRole.setPermissions(allPermissions);
            adminRole.setStatus(1);
            roleRepository.save(adminRole);

            Set<Permission> leaderPermissions = new HashSet<>();
            permissionRepository.findByPermissionCodeStartingWith("order:").ifPresent(leaderPermissions::add);
            permissionRepository.findByPermissionCodeStartingWith("store:").ifPresent(leaderPermissions::add);
            permissionRepository.findByPermissionCode("product:read").ifPresent(leaderPermissions::add);
            permissionRepository.findByPermissionCode("refund:read").ifPresent(leaderPermissions::add);

            Role leaderRole = new Role();
            leaderRole.setRoleCode("LEADER");
            leaderRole.setRoleName("团长");
            leaderRole.setPermissions(leaderPermissions);
            leaderRole.setStatus(1);
            roleRepository.save(leaderRole);

            Set<Permission> userPermissions = new HashSet<>();
            permissionRepository.findByPermissionCode("product:read").ifPresent(userPermissions::add);

            Role userRole = new Role();
            userRole.setRoleCode("USER");
            userRole.setRoleName("普通用户");
            userRole.setPermissions(userPermissions);
            userRole.setStatus(1);
            roleRepository.save(userRole);
        }
    }

    private void initUsers() {
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByRoleCode("ADMIN").orElseThrow();
            Role leaderRole = roleRepository.findByRoleCode("LEADER").orElseThrow();
            Role userRole = roleRepository.findByRoleCode("USER").orElseThrow();

            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setNickname("系统管理员");
            admin.setPhone("13800138000");
            admin.setStatus(1);
            Set<Role> adminRoles = new HashSet<>();
            adminRoles.add(adminRole);
            admin.setRoles(adminRoles);
            userRepository.save(admin);

            User leader = new User();
            leader.setUsername("leader");
            leader.setPassword(passwordEncoder.encode("123456"));
            leader.setNickname("张团长");
            leader.setPhone("13800138001");
            leader.setStatus(1);
            Set<Role> leaderRoles = new HashSet<>();
            leaderRoles.add(leaderRole);
            leader.setRoles(leaderRoles);
            userRepository.save(leader);

            User user = new User();
            user.setUsername("user");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setNickname("李用户");
            user.setPhone("13800138002");
            user.setStatus(1);
            Set<Role> userRoles = new HashSet<>();
            userRoles.add(userRole);
            user.setRoles(userRoles);
            userRepository.save(user);
        }
    }

    private void initCategories() {
        if (categoryRepository.count() == 0) {
            String[][] categories = {
                {"时令蔬菜", "1"},
                {"新鲜水果", "2"},
                {"肉禽蛋类", "3"},
                {"海鲜水产", "4"},
                {"粮油调味", "5"},
                {"乳品饮料", "6"}
            };

            for (String[] c : categories) {
                Category category = new Category();
                category.setCategoryName(c[0]);
                category.setSortOrder(Integer.parseInt(c[1]));
                category.setStatus(1);
                categoryRepository.save(category);
            }
        }
    }

    private void initProducts() {
        if (productRepository.count() == 0) {
            Category vegCategory = categoryRepository.findById(1L).orElseThrow();
            Category fruitCategory = categoryRepository.findById(2L).orElseThrow();
            Category meatCategory = categoryRepository.findById(3L).orElseThrow();

            Product p1 = new Product();
            p1.setProductName("有机大白菜");
            p1.setDescription("新鲜有机种植，口感清甜");
            p1.setCategory(vegCategory);
            p1.setOriginalPrice(new BigDecimal("5.99"));
            p1.setGroupPrice(new BigDecimal("3.99"));
            p1.setStock(100);
            p1.setSales(50);
            p1.setUnit("颗");
            p1.setStatus(1);
            p1.setIsRecommend(1);
            p1.setSortOrder(1);
            productRepository.save(p1);

            Product p2 = new Product();
            p2.setProductName("红富士苹果");
            p2.setDescription("山东烟台红富士，脆甜多汁");
            p2.setCategory(fruitCategory);
            p2.setOriginalPrice(new BigDecimal("12.99"));
            p2.setGroupPrice(new BigDecimal("8.99"));
            p2.setStock(200);
            p2.setSales(150);
            p2.setUnit("斤");
            p2.setStatus(1);
            p2.setIsRecommend(1);
            p2.setSortOrder(2);
            productRepository.save(p2);

            Product p3 = new Product();
            p3.setProductName("土鸡蛋");
            p3.setDescription("农家散养土鸡蛋，营养丰富");
            p3.setCategory(meatCategory);
            p3.setOriginalPrice(new BigDecimal("1.50"));
            p3.setGroupPrice(new BigDecimal("1.00"));
            p3.setStock(500);
            p3.setSales(300);
            p3.setUnit("个");
            p3.setStatus(1);
            p3.setIsRecommend(0);
            p3.setSortOrder(3);
            productRepository.save(p3);

            Product p4 = new Product();
            p4.setProductName("新鲜草莓");
            p4.setDescription("双流冬草莓，香甜可口");
            p4.setCategory(fruitCategory);
            p4.setOriginalPrice(new BigDecimal("29.99"));
            p4.setGroupPrice(new BigDecimal("19.99"));
            p4.setStock(50);
            p4.setSales(30);
            p4.setUnit("盒");
            p4.setStatus(1);
            p4.setIsRecommend(1);
            p4.setSortOrder(4);
            productRepository.save(p4);
        }
    }
}