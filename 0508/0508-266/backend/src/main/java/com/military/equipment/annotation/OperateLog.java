package com.military.equipment.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperateLog {
    String module() default "";
    String type() default "";
    String desc() default "";
}
