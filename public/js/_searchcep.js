function formatCEP(e) {
    let v = e.target.value.replace(/\D/g, '')
    v = v.replace(/^(\d{5})(\d)/, '$1-$2')
    e.target.value = v
}

async function searchCEP(cep) {
    cep = cep.replace(/\D/g, '')

    if (cep.length !== 8) {
        alert('CEP deve conter 8 dígitos')
        return
    }

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json`)
        const data = response.data

        if (!data.erro) {
            document.getElementById('address').value = data.logradouro || ''
            document.getElementById('neighborhood').value = data.bairro || ''
            document.getElementById('city').value = data.localidade || ''
            document.getElementById('state').value = data.uf || ''
            document.getElementById('country').value = 'Brasil'
        } else {
            alert('CEP não encontrado')
        }

    } catch (err) {
        console.error(`Erro ao buscar CEP: ${err}`)
        alert('Erro ao buscar CEP. Tente novamente em alguns segundos')
    }
}
