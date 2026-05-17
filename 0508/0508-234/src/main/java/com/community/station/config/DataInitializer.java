package com.community.station.config;

import com.community.station.entity.Role;
import com.community.station.entity.Station;
import com.community.station.entity.User;
import com.community.station.repository.StationRepository;
import com.community.station.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initUsers();
        initStations();
    }

    private void initUsers() {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setRealName("系统管理员");
            admin.setPhone("13800138000");
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            userRepository.save(admin);

            User sorter = new User();
            sorter.setUsername("sorter01");
            sorter.setPassword(passwordEncoder.encode("123456"));
            sorter.setRealName("张分拣");
            sorter.setPhone("13800138001");
            sorter.setRole(Role.SORTER);
            sorter.setEnabled(true);
            userRepository.save(sorter);

            User deliverer = new User();
            deliverer.setUsername("deliverer01");
            deliverer.setPassword(passwordEncoder.encode("123456"));
            deliverer.setRealName("李派送");
            deliverer.setPhone("13800138002");
            deliverer.setRole(Role.DELIVERER);
            deliverer.setEnabled(true);
            userRepository.save(deliverer);

            User disabledUser = new User();
            disabledUser.setUsername("disabled");
            disabledUser.setPassword(passwordEncoder.encode("123456"));
            disabledUser.setRealName("已禁用用户");
            disabledUser.setRole(Role.DELIVERER);
            disabledUser.setEnabled(false);
            userRepository.save(disabledUser);

            System.out.println("测试用户初始化完成");
        }
    }

    private void initStations() {
        if (stationRepository.count() == 0) {
            Station station1 = new Station();
            station1.setStationName("阳光社区驿站");
            station1.setAddress("阳光路100号");
            station1.setServiceScope("阳光社区、花园小区");
            station1.setBusinessHours("08:00-20:00");
            station1.setGoverningCommunity("阳光社区");
            station1.setContactPhone("010-12345678");
            station1.setManager("王站长");
            station1.setDescription("主营快递收发、便民服务");
            stationRepository.save(station1);

            Station station2 = new Station();
            station2.setStationName("幸福家园驿站");
            station2.setAddress("幸福大街88号");
            station2.setServiceScope("幸福家园、和平小区");
            station2.setBusinessHours("09:00-21:00");
            station2.setGoverningCommunity("幸福社区");
            station2.setContactPhone("010-87654321");
            station2.setManager("李站长");
            station2.setDescription("快递收发、生鲜配送");
            stationRepository.save(station2);

            Station station3 = new Station();
            station3.setStationName("和平小区驿站");
            station3.setAddress("和平里50号");
            station3.setServiceScope("和平小区、周边商户");
            station3.setBusinessHours("07:30-19:30");
            station3.setGoverningCommunity("和平社区");
            station3.setContactPhone("010-11112222");
            station3.setManager("张站长");
            station3.setDescription("社区便民服务中心");
            stationRepository.save(station3);

            System.out.println("测试驿站初始化完成");
        }
    }
}
