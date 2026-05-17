const Validator = {
    rules: {
        required: function(value, message = '此字段为必填项') {
            return value !== null && value !== undefined && value !== '' ? null : message;
        },
        minLength: function(value, length, message) {
            if (!value) return null;
            const msg = message || `最少需要${length}个字符`;
            return value.length >= length ? null : msg;
        },
        maxLength: function(value, length, message) {
            if (!value) return null;
            const msg = message || `最多允许${length}个字符`;
            return value.length <= length ? null : msg;
        },
        email: function(value, message = '请输入有效的邮箱地址') {
            if (!value) return null;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(value) ? null : message;
        },
        phone: function(value, message = '请输入有效的手机号') {
            if (!value) return null;
            const regex = /^1[3-9]\d{9}$/;
            return regex.test(value) ? null : message;
        },
        number: function(value, message = '请输入有效的数字') {
            if (!value) return null;
            return !isNaN(value) ? null : message;
        },
        idCard: function(value, message = '请输入有效的身份证号') {
            if (!value) return null;
            const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
            return regex.test(value) ? null : message;
        }
    },

    validate: function(value, rules) {
        for (const rule of rules) {
            const ruleName = rule.rule;
            const validator = this.rules[ruleName];
            if (validator) {
                const args = [value].concat(rule.params || []);
                if (rule.message) {
                    args.push(rule.message);
                }
                const error = validator.apply(null, args);
                if (error) {
                    return error;
                }
            }
        }
        return null;
    },

    validateForm: function(formData, schema) {
        const errors = {};
        let isValid = true;

        for (const field in schema) {
            const value = formData[field];
            const rules = schema[field];
            const error = this.validate(value, rules);
            if (error) {
                errors[field] = error;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

    showError: function(elementId, message) {
        const errorEl = document.getElementById(elementId + '_error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        const inputEl = document.getElementById(elementId);
        if (inputEl) {
            inputEl.classList.add('input-error');
        }
    },

    clearError: function(elementId) {
        const errorEl = document.getElementById(elementId + '_error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        const inputEl = document.getElementById(elementId);
        if (inputEl) {
            inputEl.classList.remove('input-error');
        }
    },

    clearAllErrors: function() {
        const errorEls = document.querySelectorAll('.error-message');
        errorEls.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        const inputEls = document.querySelectorAll('.input-error');
        inputEls.forEach(el => {
            el.classList.remove('input-error');
        });
    }
};
