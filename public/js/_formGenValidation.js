//* General validations for common fields
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#IVform");

    // Definir todos os validadores possíveis
    const allValidators = {
        name: {
            selector: ".IVname",
            errorSelector: ".IVnameError",
            validate: (val) => val.trim().length <= 20 && val.trim().length > 0,
            message: "O nome deve ter entre 1 e 20 caracteres."
        },
        phone: {
            selector: ".IVphone",
            errorSelector: ".IVphoneError",
            validate: (val) => /^\+[0-9]{6,14}$/.test(val.trim()),
            message: "Formato inválido. Exemplo: +554172727272"
        },
        email: {
            selector: ".IVemail",
            errorSelector: ".IVemailError",
            validate: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim()),
            message: "Insira um e-mail válido. Exemplo: correto@outlook.com"
        },
        cpf: {
            selector: ".IVcpf",
            errorSelector: ".IVcpfError",
            validate: (val) => {
                const cpf = val.replace(/\D/g, '');

                if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
                    return false;
                }

                let sum = 0;
                for (let i = 0; i < 9; i++) {
                    sum += parseInt(cpf[i]) * (10 - i);
                }
                let digit1 = 11 - (sum % 11);
                digit1 = digit1 >= 10 ? 0 : digit1;

                if (parseInt(cpf[9]) !== digit1) return false;

                sum = 0;
                for (let i = 0; i < 10; i++) {
                    sum += parseInt(cpf[i]) * (11 - i);
                }
                let digit2 = 11 - (sum % 11);
                digit2 = digit2 >= 10 ? 0 : digit2;

                return parseInt(cpf[10]) === digit2;
            },
            message: "Insira um CPF válido. Exemplo: 001.001.001-00"
        },
        cnpj: {
            selector: ".IVcnpj",
            errorSelector: ".IVcnpjError",
            validate: (val) => {
                const cnpj = val.replace(/\D/g, '');

                if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
                    return false;
                }

                const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                let sum = 0;
                for (let i = 0; i < 12; i++) {
                    sum += parseInt(cnpj[i]) * weights1[i];
                }
                let digit1 = sum % 11;
                digit1 = digit1 < 2 ? 0 : 11 - digit1;

                if (parseInt(cnpj[12]) !== digit1) return false;

                const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                sum = 0;
                for (let i = 0; i < 13; i++) {
                    sum += parseInt(cnpj[i]) * weights2[i];
                }
                let digit2 = sum % 11;
                digit2 = digit2 < 2 ? 0 : 11 - digit2;

                return parseInt(cnpj[13]) === digit2;
            },
            message: "Insira um CNPJ válido. Exemplo: 01.001.001/0001-01"
        },
        password: {
            selector: ".IVpassword",
            errorSelector: ".IVpasswordError",
            validate: (val) => val.length >= 8 && /\d/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val),
            message: "Mínimo 8 caracteres, com número e símbolo."
        },
        passwordConfirm: {
            selector: ".IVpasswordConfirm",
            errorSelector: ".IVpasswordConfirmError",
            validate: (val, fields) => {
                const passwordField = fields.password;
                return passwordField ? passwordField.input.value === val : false;
            },
            message: "As senhas não coincidem."
        }
    };

    // Criar objeto apenas com campos que existem no DOM
    const fields = {};

    Object.keys(allValidators).forEach(key => {
        const validator = allValidators[key];
        const input = document.querySelector(validator.selector);
        const error = document.querySelector(validator.errorSelector);

        // Só adicionar se ambos os elementos existirem
        if (input && error) {
            fields[key] = {
                input,
                error,
                validate: validator.validate,
                message: validator.message
            };
        }
    });

    // Função para validar um campo específico
    const validateField = (key) => {
        const field = fields[key];
        if (!field) return true;

        const { input, error, validate, message } = field;
        const isValid = validate(input.value, fields);

        input.classList.toggle("is-invalid", !isValid);
        error.textContent = isValid ? "" : message;

        return isValid;
    };

    // Adicionar validação em tempo real apenas para campos existentes
    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener("input", () => validateField(key));
    });

    // Validação no submit
    if (form) {
        form.addEventListener("submit", (e) => {
            let allValid = true;

            Object.keys(fields).forEach((key) => {
                const isValid = validateField(key);
                if (!isValid) allValid = false;
            });

            if (!allValid) {
                e.preventDefault();
            }
        });
    }
});