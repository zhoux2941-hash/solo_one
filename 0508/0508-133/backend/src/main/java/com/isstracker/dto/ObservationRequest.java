package com.isstracker.dto;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import org.hibernate.validator.constraints.Length;

public class ObservationRequest {
    
    @NotNull(message = "事件ID不能为空")
    private String passEventId;
    
    @NotNull(message = "纬度不能为空")
    @DecimalMin(value = "-90.0", message = "纬度最小值为-90")
    @DecimalMax(value = "90.0", message = "纬度最大值为90")
    private Double latitude;
    
    @NotNull(message = "经度不能为空")
    @DecimalMin(value = "-180.0", message = "经度最小值为-180")
    @DecimalMax(value = "180.0", message = "经度最大值为180")
    private Double longitude;
    
    @Length(max = 500, message = "描述不能超过500个字符")
    private String description;

    public String getPassEventId() {
        return passEventId;
    }

    public void setPassEventId(String passEventId) {
        this.passEventId = passEventId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
