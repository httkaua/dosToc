document.addEventListener ('DOMContentLoaded', () => {
    const passwordBtn = document.getElementById('generate-password-btn')
    const passwordInput = document.getElementById('generated-password')

    passwordBtn.addEventListener('click', () => {
        const password = generatePassword();
        passwordInput.value = password;
    });
})

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specials = '!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';

    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    for (let i = 0; i < 2; i++) {
        const specialChar = specials.charAt(Math.floor(Math.random() * specials.length));
        const insertAt = Math.floor(Math.random() * password.length);
        password = password.slice(0, insertAt) + specialChar + password.slice(insertAt);
    }

    return password;
}