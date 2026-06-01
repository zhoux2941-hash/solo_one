package com.monitor.kernel;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;
import com.monitor.api.ConfigService;
import com.monitor.api.EventPublisher;
import com.monitor.api.AlertService;

public class KernelActivator implements BundleActivator {
    private ConfigCenter configCenter;
    private KernelEventPublisher eventPublisher;
    private KernelAlertService alertService;
    private DropinsWatcher dropinsWatcher;
    private ServiceRegistration<ConfigService> configReg;
    private ServiceRegistration<EventPublisher> eventReg;
    private ServiceRegistration<AlertService> alertReg;

    @Override
    public void start(BundleContext context) throws Exception {
        configCenter = new ConfigCenter(context);
        configCenter.open();
        configReg = context.registerService(ConfigService.class, configCenter, null);

        eventPublisher = new KernelEventPublisher(context);
        eventReg = context.registerService(EventPublisher.class, eventPublisher, null);

        alertService = new KernelAlertService(configCenter);
        alertReg = context.registerService(AlertService.class, alertService, null);

        dropinsWatcher = new DropinsWatcher(context);
        dropinsWatcher.start();

        System.out.println("[KERNEL] Monitor Dashboard Kernel started. Services registered.");
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        if (dropinsWatcher != null) dropinsWatcher.stop();
        if (alertReg != null) alertReg.unregister();
        if (eventReg != null) eventReg.unregister();
        if (configReg != null) configReg.unregister();
        if (configCenter != null) configCenter.close();
        System.out.println("[KERNEL] Monitor Dashboard Kernel stopped.");
    }
}
