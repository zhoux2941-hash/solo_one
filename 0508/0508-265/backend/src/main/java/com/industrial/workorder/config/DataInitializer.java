package com.industrial.workorder.config;

import com.industrial.workorder.entity.Device;
import com.industrial.workorder.entity.User;
import com.industrial.workorder.repository.DeviceRepository;
import com.industrial.workorder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            initUsers();
        }
        if (deviceRepository.count() == 0) {
            initDevices();
        }
    }

    private void initUsers() {
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword("admin123");
        admin.setRealName("系统管理员");
        admin.setRole("ADMIN");
        admin.setPhone("13800138000");
        admin.setDepartment("运维部");
        userRepository.save(admin);

        User leader = new User();
        leader.setUsername("leader");
        leader.setPassword("leader123");
        leader.setRealName("张组长");
        leader.setRole("TEAM_LEADER");
        leader.setPhone("13800138001");
        leader.setDepartment("运维部");
        userRepository.save(leader);

        User worker1 = new User();
        worker1.setUsername("worker1");
        worker1.setPassword("worker123");
        worker1.setRealName("李运维");
        worker1.setRole("WORKER");
        worker1.setPhone("13800138002");
        worker1.setDepartment("运维部");
        userRepository.save(worker1);

        User worker2 = new User();
        worker2.setUsername("worker2");
        worker2.setPassword("worker123");
        worker2.setRealName("王维修");
        worker2.setRole("WORKER");
        worker2.setPhone("13800138003");
        worker2.setDepartment("运维部");
        userRepository.save(worker2);
    }

    private void initDevices() {
        String[] deviceNames = {"数控车床-01", "数控车床-02", "铣床-01", "铣床-02", "磨床-01", 
                                "冲压机-01", "冲压机-02", "焊接机器人-01", "焊接机器人-02", "传送带-A"};
        String[] types = {"车床", "车床", "铣床", "铣床", "磨床", "冲压设备", "冲压设备", "机器人", "机器人", "输送设备"};
        String[] lines = {"A线", "A线", "A线", "B线", "B线", "B线", "C线", "C线", "C线", "C线"};

        for (int i = 0; i < deviceNames.length; i++) {
            Device device = new Device();
            device.setDeviceCode("DEV" + String.format("%03d", i + 1));
            device.setDeviceName(deviceNames[i]);
            device.setDeviceType(types[i]);
            device.setProductionLine(lines[i]);
            device.setLocation("车间" + (i % 3 + 1));
            device.setStatus("NORMAL");
            device.setDescription("生产设备-" + (i + 1));
            device.setInstallDate(LocalDateTime.now().minusMonths(i + 1));
            deviceRepository.save(device);
        }
    }
}
