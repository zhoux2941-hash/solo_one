document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const logout = urlParams.get('logout');

    const errorMessage = document.getElementById('errorMessage');

    if (error) {
        errorMessage.textContent = '用户名或密码错误，或账号已被禁用';
        errorMessage.classList.add('show');
    }

    if (logout) {
        errorMessage.textContent = '您已成功退出登录';
        errorMessage.style.backgroundColor = '#efe';
        errorMessage.style.color = '#27ae60';
        errorMessage.classList.add('show');
    }
});
