package com.monitor.plugin.cpu;

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.framework.ServiceRegistration;
import org.osgi.service.log.LogService;
import com.monitor.api.AlertService;
import com.monitor.api.ConfigService;
import com.monitor.api.EventPublisher;
import com.monitor.api.MonitorPlugin;

public class CpuMonitorActivator implements BundleActivator {
    private CpuMonitorPlugin plugin;
    private ServiceRegistration<MonitorPlugin> pluginReg;
    private ServiceReference<LogService> logRef;
    private ServiceReference<ConfigService> configRef;
    private ServiceReference<EventPublisher> eventRef;
    private ServiceReference<AlertService> alertRef;

    @Override
    public void start(BundleContext context) throws Exception {
        LogService logService = null;
        logRef = context.getServiceReference(LogService.class);
        if (logRef != null) logService = context.getService(logRef);
        if (logService != null) {
            logService.log(LogService.LOG_INFO, "[CPU] Plugin activating (BundleID=" + context.getBundle().getBundleId() + ")");
        }

        ConfigService configService = null;
        configRef = context.getServiceReference(ConfigService.class);
        if (configRef != null) configService = context.getService(configRef);

        EventPublisher eventPublisher = null;
        eventRef = context.getServiceReference(EventPublisher.class);
        if (eventRef != null) eventPublisher = context.getService(eventRef);

        AlertService alertService = null;
        alertRef = context.getServiceReference(AlertService.class);
        if (alertRef != null) alertService = context.getService(alertRef);

        plugin = new CpuMonitorPlugin(context, configService, eventPublisher, alertService, logService);
        plugin.start();
        pluginReg = context.registerService(MonitorPlugin.class, plugin, null);
        System.out.println("[CPU] Plugin started and registered.");
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        if (plugin != null) {
            plugin.stop();
            plugin = null;
        }
        if (pluginReg != null) {
            pluginReg.unregister();
            pluginReg = null;
        }
        if (alertRef != null) { context.ungetService(alertRef); alertRef = null; }
        if (eventRef != null) { context.ungetService(eventRef); eventRef = null; }
        if (configRef != null) { context.ungetService(configRef); configRef = null; }
        if (logRef != null) { context.ungetService(logRef); logRef = null; }
        System.out.println("[CPU] Plugin stopped and unregistered.");
    }
}
