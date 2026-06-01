package com.monitor.kernel;

import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;
import com.monitor.api.EventPublisher;
import java.util.HashMap;
import java.util.Map;

public class KernelEventPublisher implements EventPublisher {
    private final BundleContext bundleContext;

    public KernelEventPublisher(BundleContext context) {
        this.bundleContext = context;
    }

    @Override
    public void publish(String topic, Map<String, Object> data) {
        publish(topic, null, data);
    }

    @Override
    public void publish(String topic, String pluginId, Map<String, Object> data) {
        ServiceReference<EventAdmin> ref = bundleContext.getServiceReference(EventAdmin.class);
        if (ref == null) {
            System.err.println("[EVENT] EventAdmin service not available");
            return;
        }
        try {
            EventAdmin eventAdmin = bundleContext.getService(ref);
            if (eventAdmin == null) return;
            Map<String, Object> properties = new HashMap<>();
            if (pluginId != null) {
                properties.put("plugin.id", pluginId);
            }
            if (data != null) {
                properties.putAll(data);
            }
            eventAdmin.postEvent(new Event(topic, properties));
        } finally {
            bundleContext.ungetService(ref);
        }
    }
}
