const Validator = {
    required(value, message = '此项为必填项') {
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
            return message || `最少输入${min}个字符`;
        }
        return null;
    },

    maxLength(value, max, message) {
        if (value && value.length > max) {
            return message || `最多输入${max}个字符`;
        }
        return null;
    },

    phone(value, message = '请输入正确的手机号码') {
        if (!value) return null;
        const reg = /^1[3-9]\d{9}$/;
        if (!reg.test(value)) {
            return message;
        }
        return null;
    },

    email(value, message = '请输入正确的邮箱地址') {
        if (!value) return null;
        const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!reg.test(value)) {
            return message;
        }
        return null;
    },

    validate(rules, data) {
        const errors = {};

        for (const field in rules) {
            const fieldRules = rules[field];
            const value = data[field];

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
                    break;
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    },

    showErrors(formId, errors) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.form-error').forEach(el => el.remove());

        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.textContent = errors[field];
                input.parentNode.appendChild(errorDiv);
            }
        }
    },

    clearErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.querySelectorAll('.form-error').forEach(el => el.remove());
    },

    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },
};
