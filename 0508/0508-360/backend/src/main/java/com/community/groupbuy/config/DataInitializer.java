package com.community.groupbuy.config;

import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.User;
import com.community.groupbuy.repository.ProductRepository;
import com.community.groupbuy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User leader = new User();
            leader.setUsername("leader");
            leader.setPassword("123456");
            leader.setName("张团长");
            leader.setPhone("13800138001");
            leader.setRole("LEADER");
            leader.setCommunity("阳光社区");
            leader.setAddress("阳光小区A栋");
            userRepository.save(leader);

            User member1 = new User();
            member1.setUsername("member1");
            member1.setPassword("123456");
            member1.setName("李团员");
            member1.setPhone("13800138002");
            member1.setRole("MEMBER");
            member1.setCommunity("阳光社区");
            member1.setAddress("阳光小区B栋101");
            userRepository.save(member1);

            User member2 = new User();
            member2.setUsername("member2");
            member2.setPassword("123456");
            member2.setName("王团员");
            member2.setPhone("13800138003");
            member2.setRole("MEMBER");
            member2.setCommunity("阳光社区");
            member2.setAddress("阳光小区C栋202");
            userRepository.save(member2);
        }

        if (productRepository.count() == 0) {
            String[][] products = {
                {"新鲜草莓", "云南精选草莓，香甜可口", "fruits", "29.90", "盒", "500"},
                {"红富士苹果", "陕西红富士，脆甜多汁", "fruits", "12.80", "斤", "1000"},
                {"有机番茄", "自然成熟，口感沙甜", "vegetables", "6.80", "斤", "800"},
                {"新鲜黄瓜", "顶花带刺，清脆爽口", "vegetables", "4.50", "斤", "600"},
                {"土鸡蛋", "农家散养土鸡蛋", "eggs", "25.00", "盒", "200"},
                {"鲜牛奶", "当日鲜牛奶，营养丰富", "dairy", "8.50", "瓶", "300"},
                {"五花肉", "新鲜五花肉，肥瘦相间", "meat", "35.00", "斤", "150"},
                {"大米", "东北优质大米", "grain", "68.00", "袋", "100"}
            };

            for (String[] p : products) {
                Product product = new Product();
                product.setName(p[0]);
                product.setDescription(p[1]);
                product.setCategory(p[2]);
                product.setPrice(new BigDecimal(p[3]));
                product.setUnit(p[4]);
                product.setStock(Integer.parseInt(p[5]));
                product.setImage("https://picsum.photos/seed/" + p[0] + "/300/200");
                productRepository.save(product);
            }
        }
    }
}
