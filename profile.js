async loadUserInfo() {
    const currentUser = await AV.User.current().fetch();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // ... 其他基本信息加载代码保持不变 ...

    // 检查邮箱验证状态
    const email = currentUser.get('email');
    const emailVerified = currentUser.get('emailVerified');
    
    const emailVerifiedView = document.querySelector('.email-verified-view');
    const emailForm = document.querySelector('#email-form');
    
    if (email && emailVerified) {
        // 显示已验证邮箱
        emailVerifiedView.style.display = 'block';
        emailForm.style.display = 'none';
        emailVerifiedView.querySelector('.email-display').textContent = email;
    } else {
        // 显示邮箱绑定表单
        emailVerifiedView.style.display = 'none';
        emailForm.style.display = 'block';
        
        if (email && !emailVerified) {
            // 邮箱未验证状态
            this.elements.inputs.email.value = email;
            this.elements.inputs.email.parentElement.querySelector('.tip-text').textContent = '邮箱未验证，请验证邮箱';
            this.elements.inputs.email.parentElement.querySelector('.tip-text').style.color = '#FF9500';
        }
    }
}

initializeEvents() {
    // ... 其他事件监听保持不变 ...

    // 添加更换邮箱按钮事件
    document.querySelector('.change-email-button')?.addEventListener('click', () => {
        const emailVerifiedView = document.querySelector('.email-verified-view');
        const emailForm = document.querySelector('#email-form');
        
        emailVerifiedView.style.display = 'none';
        emailForm.style.display = 'block';
        
        // 清空输入框
        this.elements.inputs.email.value = '';
        this.elements.inputs.email.parentElement.querySelector('.tip-text').textContent = '绑定邮箱可用于找回密码';
        this.elements.inputs.email.parentElement.querySelector('.tip-text').style.color = '';
    });
} 