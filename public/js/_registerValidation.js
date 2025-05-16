document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    const fields = {
        name: {
            input: document.getElementById("name"),
            error: document.getElementById("nameError"),
            validate: (val) => val.trim().length <= 20 && val.trim().length > 0,
            message: "O nome deve ter entre 1 e 20 caracteres."
        },
        phone: {
            input: document.getElementById("phone"),
            error: document.getElementById("phoneError"),
            validate: (val) => /^\+[0-9]{6,14}$/.test(val.trim()),
            message: "Formato inválido. Exemplo: +554172727272"
        },
        email: {
            input: document.getElementById("email"),
            error: document.getElementById("emailError"),
            validate: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim()),
            message: "Insira um e-mail válido."
        },
        password: {
            input: document.getElementById("password"),
            error: document.getElementById("passwordError"),
            validate: (val) => val.length >= 8 && /\d/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val),
            message: "Mínimo 8 caracteres, com número e símbolo."
        },
        passwordConfirm: {
            input: document.getElementById("passwordConfirm"),
            error: document.getElementById("passwordConfirmError"),
            validate: () => fields.password.input.value === fields.passwordConfirm.input.value,
            message: "As senhas não coincidem."
        }
    };

    const validateField = (key) => {
        const { input, error, validate, message } = fields[key];
        const isValid = validate(input.value);
        input.classList.toggle("is-invalid", !isValid);
        error.textContent = isValid ? "" : message;
        return isValid;
    };

    // Real-time validation
    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener("input", () => validateField(key));
    });

    form.addEventListener("submit", (e) => {
        let allValid = true;
        Object.keys(fields).forEach((key) => {
            const isValid = validateField(key);
            if (!isValid) allValid = false;
        });

        if (!allValid) e.preventDefault();
    });
});
