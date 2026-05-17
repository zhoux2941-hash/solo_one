package com.wenwan.bracelet.config;

import com.wenwan.bracelet.entity.Material;
import com.wenwan.bracelet.entity.Product;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.MaterialRepository;
import com.wenwan.bracelet.repository.ProductRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        initUsers();
        initMaterials();
        initProducts();
    }

    private void initUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword("admin123");
        admin.setRealName("管理员");
        admin.setPhone("13800138000");
        admin.setRole(User.UserRole.ADMIN);
        userRepository.save(admin);

        User craftsman1 = new User();
        craftsman1.setUsername("craftsman1");
        craftsman1.setPassword("craft123");
        craftsman1.setRealName("张师傅");
        craftsman1.setPhone("13900139001");
        craftsman1.setRole(User.UserRole.CRAFTSMAN);
        craftsman1.setCraftsmanStatus(User.CraftsmanStatus.APPROVED);
        craftsman1.setCraftsmanProfile("从事文玩手串制作10年，擅长菩提根打磨和搭配，作品风格古朴典雅");
        craftsman1.setCraftsmanSkills("菩提根打磨、玉石雕刻、流苏制作");
        craftsman1.setExperienceYears(10);
        userRepository.save(craftsman1);

        User craftsman2 = new User();
        craftsman2.setUsername("craftsman2");
        craftsman2.setPassword("craft456");
        craftsman2.setRealName("李师傅");
        craftsman2.setPhone("13900139002");
        craftsman2.setRole(User.UserRole.CRAFTSMAN);
        craftsman2.setCraftsmanStatus(User.CraftsmanStatus.APPROVED);
        craftsman2.setCraftsmanProfile("专注木质手串制作，擅长各种名贵木材的处理和搭配");
        craftsman2.setCraftsmanSkills("紫檀加工、黄花梨处理、配珠设计");
        craftsman2.setExperienceYears(8);
        userRepository.save(craftsman2);

        User craftsman3 = new User();
        craftsman3.setUsername("craftsman3");
        craftsman3.setPassword("craft789");
        craftsman3.setRealName("王师傅");
        craftsman3.setPhone("13900139003");
        craftsman3.setRole(User.UserRole.CRAFTSMAN);
        craftsman3.setCraftsmanStatus(User.CraftsmanStatus.PENDING);
        craftsman3.setCraftsmanProfile("新手匠人，热爱文玩手串制作3年，希望通过平台学习和发展");
        craftsman3.setCraftsmanSkills("基础串珠、简单雕刻");
        craftsman3.setExperienceYears(3);
        userRepository.save(craftsman3);

        User customer1 = new User();
        customer1.setUsername("customer1");
        customer1.setPassword("cust123");
        customer1.setRealName("文玩爱好者");
        customer1.setPhone("13700137001");
        customer1.setRole(User.UserRole.CUSTOMER);
        userRepository.save(customer1);

        User customer2 = new User();
        customer2.setUsername("customer2");
        customer2.setPassword("cust456");
        customer2.setRealName("收藏家");
        customer2.setPhone("13700137002");
        customer2.setRole(User.UserRole.CUSTOMER);
        userRepository.save(customer2);
    }

    private void initMaterials() {
        if (materialRepository.count() > 0) {
            return;
        }

        Material m1 = new Material();
        m1.setName("白玉菩提根");
        m1.setCategory(Material.MaterialCategory.BODHI_SEED);
        m1.setMaterial("白玉菩提");
        m1.setSizeSpec("12mm圆珠");
        m1.setPatternDescription("温润如玉，表面光滑细腻");
        m1.setOrigin("海南");
        m1.setReferencePrice(new BigDecimal("2.50"));
        m1.setStockQuantity(500);
        m1.setUnit("颗");
        m1.setDescription("优质白玉菩提根，经过精细打磨，质地温润，适合制作各种款式手串");
        materialRepository.save(m1);

        Material m2 = new Material();
        m2.setName("星月菩提");
        m2.setCategory(Material.MaterialCategory.BODHI_SEED);
        m2.setMaterial("星月菩提");
        m2.setSizeSpec("10mm圆珠");
        m2.setPatternDescription("月朗星稀，分布均匀");
        m2.setOrigin("海南");
        m2.setReferencePrice(new BigDecimal("5.00"));
        m2.setStockQuantity(300);
        m2.setUnit("颗");
        m2.setDescription("精品星月菩提，密度高，星点分布均匀，盘玩效果佳");
        materialRepository.save(m2);

        Material m3 = new Material();
        m3.setName("金刚菩提");
        m3.setCategory(Material.MaterialCategory.BODHI_SEED);
        m3.setMaterial("金刚菩提");
        m3.setSizeSpec("15mm五瓣");
        m3.setPatternDescription("纹路清晰，瓣线分明");
        m3.setOrigin("尼泊尔");
        m3.setReferencePrice(new BigDecimal("15.00"));
        m3.setStockQuantity(200);
        m3.setUnit("颗");
        m3.setDescription("尼泊尔五瓣金刚菩提，皮质好，纹路深邃");
        materialRepository.save(m3);

        Material m4 = new Material();
        m4.setName("和田玉珠子");
        m4.setCategory(Material.MaterialCategory.JADE);
        m4.setMaterial("和田玉");
        m4.setSizeSpec("10mm圆珠");
        m4.setPatternDescription("温润细腻，油脂感强");
        m4.setOrigin("新疆");
        m4.setReferencePrice(new BigDecimal("88.00"));
        m4.setStockQuantity(50);
        m4.setUnit("颗");
        m4.setDescription("新疆和田玉，质地温润，色泽典雅");
        materialRepository.save(m4);

        Material m5 = new Material();
        m5.setName("小叶紫檀");
        m5.setCategory(Material.MaterialCategory.WOOD);
        m5.setMaterial("小叶紫檀");
        m5.setSizeSpec("8mm圆珠");
        m5.setPatternDescription("牛毛纹清晰，密度高");
        m5.setOrigin("印度");
        m5.setReferencePrice(new BigDecimal("12.00"));
        m5.setStockQuantity(400);
        m5.setUnit("颗");
        m5.setDescription("印度小叶紫檀，密度高，油性足，盘玩后包浆漂亮");
        materialRepository.save(m5);

        Material m6 = new Material();
        m6.setName("纯银隔片");
        m6.setCategory(Material.MaterialCategory.METAL);
        m6.setMaterial("925银");
        m6.setSizeSpec("6mm隔片");
        m6.setPatternDescription("光亮如镜，工艺精湛");
        m6.setOrigin("浙江");
        m6.setReferencePrice(new BigDecimal("3.00"));
        m6.setStockQuantity(1000);
        m6.setUnit("片");
        m6.setDescription("925纯银隔片，防止珠子磨损，增加美观度");
        materialRepository.save(m6);

        Material m7 = new Material();
        m7.setName("古风流苏");
        m7.setCategory(Material.MaterialCategory.TASSLE);
        m7.setMaterial("真丝");
        m7.setSizeSpec("8cm");
        m7.setPatternDescription("丝线顺滑，色泽纯正");
        m7.setOrigin("苏州");
        m7.setReferencePrice(new BigDecimal("15.00"));
        m7.setStockQuantity(100);
        m7.setUnit("个");
        m7.setDescription("苏州手工流苏，真丝材质，做工精细");
        materialRepository.save(m7);

        Material m8 = new Material();
        m8.setName("弹力绳");
        m8.setCategory(Material.MaterialCategory.CORD);
        m8.setMaterial("进口弹力线");
        m8.setSizeSpec("1.0mm");
        m8.setOrigin("日本");
        m8.setReferencePrice(new BigDecimal("8.00"));
        m8.setStockQuantity(50);
        m8.setUnit("米");
        m8.setDescription("日本进口弹力线，韧性好，不易断");
        materialRepository.save(m8);

        Material m9 = new Material();
        m9.setName("南红玛瑙");
        m9.setCategory(Material.MaterialCategory.BEAD);
        m9.setMaterial("南红玛瑙");
        m9.setSizeSpec("12mm圆珠");
        m9.setPatternDescription("颜色红润，满色满肉");
        m9.setOrigin("四川");
        m9.setReferencePrice(new BigDecimal("68.00"));
        m9.setStockQuantity(80);
        m9.setUnit("颗");
        m9.setDescription("四川凉山南红玛瑙，颜色红润，质地细腻");
        materialRepository.save(m9);

        Material m10 = new Material();
        m10.setName("黄花梨");
        m10.setCategory(Material.MaterialCategory.WOOD);
        m10.setMaterial("海南黄花梨");
        m10.setSizeSpec("10mm圆珠");
        m10.setPatternDescription("纹理独特，鬼脸丰富");
        m10.setOrigin("海南");
        m10.setReferencePrice(new BigDecimal("35.00"));
        m10.setStockQuantity(150);
        m10.setUnit("颗");
        m10.setDescription("海南黄花梨，纹理独特，香气怡人");
        materialRepository.save(m10);
    }

    private void initProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        User craftsman1 = userRepository.findByUsername("craftsman1").orElse(null);
        User craftsman2 = userRepository.findByUsername("craftsman2").orElse(null);

        if (craftsman1 == null || craftsman2 == null) {
            return;
        }

        Product p1 = new Product();
        p1.setCraftsman(craftsman1);
        p1.setName("古韵菩提");
        p1.setStyle(Product.ProductStyle.ANCIENT_STYLE);
        p1.setDescription("精选白玉菩提根，搭配古风流苏，典雅大气，适合日常佩戴和收藏。");
        p1.setMaterialList("白玉菩提根18颗、纯银隔片、古风流苏");
        p1.setPrice(new BigDecimal("168.00"));
        p1.setViewCount(156);
        p1.setLikeCount(42);
        p1.setPublished(true);
        productRepository.save(p1);

        Product p2 = new Product();
        p2.setCraftsman(craftsman1);
        p2.setName("星月禅意");
        p2.setStyle(Product.ProductStyle.MINIMALIST);
        p2.setDescription("星月菩提素串，简约而不简单，体现禅意生活。");
        p2.setMaterialList("星月菩提108颗、纯银隔片");
        p2.setPrice(new BigDecimal("268.00"));
        p2.setViewCount(234);
        p2.setLikeCount(67);
        p2.setPublished(true);
        productRepository.save(p2);

        Product p3 = new Product();
        p3.setCraftsman(craftsman2);
        p3.setName("紫檀雅韵");
        p3.setStyle(Product.ProductStyle.LUXURY);
        p3.setDescription("印度小叶紫檀，搭配南红玛瑙，高贵典雅。");
        p3.setMaterialList("小叶紫檀108颗、南红玛瑙配珠、纯银隔片");
        p3.setPrice(new BigDecimal("588.00"));
        p3.setViewCount(189);
        p3.setLikeCount(55);
        p3.setPublished(true);
        productRepository.save(p3);

        Product p4 = new Product();
        p4.setCraftsman(craftsman2);
        p4.setName("黄花梨珍藏");
        p4.setStyle(Product.ProductStyle.ANCIENT_STYLE);
        p4.setDescription("海南黄花梨，纹理独特，香气怡人，极具收藏价值。");
        p4.setMaterialList("海南黄花梨20颗、和田玉配珠");
        p4.setPrice(new BigDecimal("1288.00"));
        p4.setViewCount(98);
        p4.setLikeCount(31);
        p4.setPublished(true);
        productRepository.save(p4);

        Product p5 = new Product();
        p5.setCraftsman(craftsman1);
        p5.setName("金刚伏魔");
        p5.setStyle(Product.ProductStyle.ETHNIC_STYLE);
        p5.setDescription("尼泊尔五瓣金刚菩提，霸气十足，辟邪保平安。");
        p5.setMaterialList("金刚菩提12颗、流苏配饰");
        p5.setPrice(new BigDecimal("388.00"));
        p5.setViewCount(145);
        p5.setLikeCount(38);
        p5.setPublished(true);
        productRepository.save(p5);
    }
}