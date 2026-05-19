package com.military.equipment.annotation;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresRoles {
    String[] value();
    Logical logical() default Logical.OR;

    enum Logical {
        OR, AND
    }
}