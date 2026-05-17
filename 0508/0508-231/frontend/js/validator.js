const validator = {
    required: function(value, message = '此字段不能为空') {
        if (value === null || value === undefined || value === '') {
            return message;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return message;
        }
        return null;
    },

    minLength: function(value, min, message) {
        if (value && value.length < min) {
            return message || `最少需要${min}个字符`;
        }
        return null;
    },

    maxLength: function(value, max, message) {
        if (value && value.length > max) {
            return message || `最多允许${max}个字符`;
        }
        return null;
    },

    phone: function(value, message = '请输入有效的手机号码') {
        if (!value) return null;
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
            return message;
        }
        return null;
    },

    email: function(value, message = '请输入有效的邮箱地址') {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return message;
        }
        return null;
    },

    validate: function(formData, rules) {
        const errors = {};
        let isValid = true;

        for (const field in rules) {
            const fieldRules = rules[field];
            const value = formData[field];

            for (const rule of fieldRules) {
                let error = null;

                switch (rule.type) {
                    case 'required':
                        error = this.required(value, rule.message);
                        break;
                    case 'minLength':
                        error = this.minLength(value, rule.min, rule.message);
                        break;
                    case 'maxLength':
                        error = this.maxLength(value, rule.max, rule.message);
                        break;
                    case 'phone':
                        error = this.phone(value, rule.message);
                        break;
                    case 'email':
                        error = this.email(value, rule.message);
                        break;
                }

                if (error) {
                    errors[field] = error;
                    isValid = false;
                    break;
                }
            }
        }

        return { isValid, errors };
    },

    showErrors: function(errors, formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errors[field];
                input.parentNode.appendChild(errorDiv);
            }
        }
    },

    clearErrors: function(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
};
