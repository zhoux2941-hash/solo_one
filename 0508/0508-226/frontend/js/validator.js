window.Validator = {
    required(value, message = '此字段为必填项') {
        if (value === null || value === undefined || value === '') {
            return message;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return message;
        }
        return null;
    },

    minLength(value, min, message) {
        if (value && value.length < min) {
            return message || `最少需要${min}个字符`;
        }
        return null;
    },

    maxLength(value, max, message) {
        if (value && value.length > max) {
            return message || `最多允许${max}个字符`;
        }
        return null;
    },

    email(value, message = '请输入有效的邮箱地址') {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : message;
    },

    phone(value, message = '请输入有效的手机号码') {
        if (!value) return null;
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(value) ? null : message;
    },

    number(value, message = '请输入有效的数字') {
        if (!value) return null;
        return isNaN(Number(value)) ? message : null;
    },

    positiveNumber(value, message = '请输入大于0的数字') {
        if (!value) return null;
        const num = Number(value);
        return isNaN(num) || num <= 0 ? message : null;
    },

    validate(rules, data) {
        const errors = {};
        
        for (const field in rules) {
            const fieldRules = rules[field];
            const value = data[field];
            
            for (const rule of fieldRules) {
                const error = rule.validator ? rule.validator(value) : null;
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }
};

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    clearFieldError(fieldId);
    
    field.classList.add('input-error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.id = `${fieldId}-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ff4d4f;
        font-size: 12px;
        margin-top: 4px;
    `;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('input-error');
    }
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
        errorDiv.remove();
    }
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorFields = form.querySelectorAll('.input-error');
    errorFields.forEach(field => field.classList.remove('input-error'));
    
    const errorMessages = form.querySelectorAll('.field-error');
    errorMessages.forEach(msg => msg.remove());
}