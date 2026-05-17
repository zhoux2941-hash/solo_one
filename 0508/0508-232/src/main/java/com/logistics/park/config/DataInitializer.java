package com.logistics.park.config;

import com.logistics.park.entity.Role;
import com.logistics.park.entity.User;
import com.logistics.park.entity.Warehouse;
import com.logistics.park.entity.WarehouseArea;
import com.logistics.park.repository.UserRepository;
import com.logistics.park.repository.WarehouseAreaRepository;
import com.logistics.park.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private WarehouseAreaRepository warehouseAreaRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        String password = passwordEncoder.encode("123456");

        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setPhone("13800138000");
            admin.setPassword(password);
            admin.setName("张管理员");
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            admin.setCreateTime(LocalDateTime.now());
            admin.setUpdateTime(LocalDateTime.now());
            userRepository.save(admin);

            User dispatcher = new User();
            dispatcher.setPhone("13800138001");
            dispatcher.setPassword(password);
            dispatcher.setName("李调度员");
            dispatcher.setRole(Role.DISPATCHER);
            dispatcher.setEnabled(true);
            dispatcher.setCreateTime(LocalDateTime.now());
            dispatcher.setUpdateTime(LocalDateTime.now());
            userRepository.save(dispatcher);

            User keeper = new User();
            keeper.setPhone("13800138002");
            keeper.setPassword(password);
            keeper.setName("王仓管员");
            keeper.setRole(Role.WAREHOUSE_KEEPER);
            keeper.setEnabled(true);
            keeper.setCreateTime(LocalDateTime.now());
            keeper.setUpdateTime(LocalDateTime.now());
            userRepository.save(keeper);

            User disabled = new User();
            disabled.setPhone("13800138003");
            disabled.setPassword(password);
            disabled.setName("赵禁用");
            disabled.setRole(Role.DISPATCHER);
            disabled.setEnabled(false);
            disabled.setCreateTime(LocalDateTime.now());
            disabled.setUpdateTime(LocalDateTime.now());
            userRepository.save(disabled);
        }

        if (warehouseRepository.count() == 0) {
            Warehouse wh1 = new Warehouse();
            wh1.setCode("WH001");
            wh1.setName("一号仓库");
            wh1.setLocation("园区A区1栋");
            wh1.setStorageCategory("电子产品");
            wh1.setCapacity(1000.0);
            wh1.setUsedCapacity(350.0);
            wh1.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            wh1.setRemark("主要存放电子元器件");
            wh1.setCreateTime(LocalDateTime.now());
            wh1.setUpdateTime(LocalDateTime.now());
            warehouseRepository.save(wh1);

            Warehouse wh2 = new Warehouse();
            wh2.setCode("WH002");
            wh2.setName("二号仓库");
            wh2.setLocation("园区A区2栋");
            wh2.setStorageCategory("食品饮料");
            wh2.setCapacity(800.0);
            wh2.setUsedCapacity(600.0);
            wh2.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            wh2.setRemark("冷藏食品专区");
            wh2.setCreateTime(LocalDateTime.now());
            wh2.setUpdateTime(LocalDateTime.now());
            warehouseRepository.save(wh2);

            Warehouse wh3 = new Warehouse();
            wh3.setCode("WH003");
            wh3.setName("三号仓库");
            wh3.setLocation("园区B区1栋");
            wh3.setStorageCategory("服装鞋帽");
            wh3.setCapacity(1200.0);
            wh3.setUsedCapacity(1200.0);
            wh3.setStatus(Warehouse.WarehouseStatus.FULL);
            wh3.setRemark("已满载");
            wh3.setCreateTime(LocalDateTime.now());
            wh3.setUpdateTime(LocalDateTime.now());
            warehouseRepository.save(wh3);

            Warehouse wh4 = new Warehouse();
            wh4.setCode("WH004");
            wh4.setName("四号仓库");
            wh4.setLocation("园区B区2栋");
            wh4.setStorageCategory("五金建材");
            wh4.setCapacity(1500.0);
            wh4.setUsedCapacity(200.0);
            wh4.setStatus(Warehouse.WarehouseStatus.MAINTENANCE);
            wh4.setRemark("设备维护中");
            wh4.setCreateTime(LocalDateTime.now());
            wh4.setUpdateTime(LocalDateTime.now());
            warehouseRepository.save(wh4);

            WarehouseArea area1 = new WarehouseArea();
            area1.setCode("AREA001");
            area1.setName("A1库区");
            area1.setWarehouseId(1L);
            area1.setAreaCategory("电子元件区");
            area1.setShelfCount(20);
            area1.setCapacity(500.0);
            area1.setUsedCapacity(200.0);
            area1.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            area1.setRemark("A栋1层");
            area1.setCreateTime(LocalDateTime.now());
            area1.setUpdateTime(LocalDateTime.now());
            warehouseAreaRepository.save(area1);

            WarehouseArea area2 = new WarehouseArea();
            area2.setCode("AREA002");
            area2.setName("A2库区");
            area2.setWarehouseId(1L);
            area2.setAreaCategory("成品存储区");
            area2.setShelfCount(15);
            area2.setCapacity(500.0);
            area2.setUsedCapacity(150.0);
            area2.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            area2.setRemark("A栋2层");
            area2.setCreateTime(LocalDateTime.now());
            area2.setUpdateTime(LocalDateTime.now());
            warehouseAreaRepository.save(area2);

            WarehouseArea area3 = new WarehouseArea();
            area3.setCode("AREA003");
            area3.setName("B1库区");
            area3.setWarehouseId(2L);
            area3.setAreaCategory("冷藏区");
            area3.setShelfCount(10);
            area3.setCapacity(400.0);
            area3.setUsedCapacity(300.0);
            area3.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            area3.setRemark("B栋1层冷藏");
            area3.setCreateTime(LocalDateTime.now());
            area3.setUpdateTime(LocalDateTime.now());
            warehouseAreaRepository.save(area3);

            WarehouseArea area4 = new WarehouseArea();
            area4.setCode("AREA004");
            area4.setName("B2库区");
            area4.setWarehouseId(2L);
            area4.setAreaCategory("常温区");
            area4.setShelfCount(12);
            area4.setCapacity(400.0);
            area4.setUsedCapacity(300.0);
            area4.setStatus(Warehouse.WarehouseStatus.AVAILABLE);
            area4.setRemark("B栋2层常温");
            area4.setCreateTime(LocalDateTime.now());
            area4.setUpdateTime(LocalDateTime.now());
            warehouseAreaRepository.save(area4);
        }
    }
}
