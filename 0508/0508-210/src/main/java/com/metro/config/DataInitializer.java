package com.metro.config;

import com.metro.entity.TunnelSection;
import com.metro.repository.TunnelSectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private TunnelSectionRepository tunnelSectionRepository;

    @Override
    public void run(String... args) throws Exception {
        if (tunnelSectionRepository.count() == 0) {
            createTunnelSection("S001", "1号区间-东站至西站", "连接东站和西站的主隧道");
            createTunnelSection("S002", "2号区间-南站至北站", "连接南站和北站的主隧道");
            createTunnelSection("S003", "3号区间-市中心环线", "市中心环线隧道");
            createTunnelSection("S004", "4号区间-机场快线", "连接市区和机场的快速隧道");
            createTunnelSection("S005", "5号区间-开发区专线", "通往开发区的专用隧道");
        }
    }

    private void createTunnelSection(String sectionId, String sectionName, String description) {
        TunnelSection section = new TunnelSection();
        section.setSectionId(sectionId);
        section.setSectionName(sectionName);
        section.setDescription(description);
        tunnelSectionRepository.save(section);
    }
}
