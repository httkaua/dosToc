document.addEventListener('DOMContentLoaded', () => {
  const cepInput = document.getElementById('locationCode');
  const loadingIndicator = document.createElement('div');

  // Loading style
  loadingIndicator.innerHTML = `
      <div id="cep-loading" style="
        display: none;
        margin-top: 8px;
        font-size: 0.9rem;
        color: #007bff;">
        🔄 Buscando endereço...
      </div>
    `;
  cepInput.parentNode.appendChild(loadingIndicator);

  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');

    console.log(cep)

    if (cep.length !== 8) return;

    document.getElementById('cep-loading').style.display = 'block';

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

      console.log(response)

      if (response.data.erro) {
        return alert('CEP não encontrado');
      }

      if (!document.getElementById('street')
        || !document.getElementById('neighborhood')
        || !document.getElementById('city')
        || !document.getElementById('state')
        || !document.getElementById('country')) {
        return alert('Elementos não encontrados, impossível preencher.');
      }

      const data = response.data;

      console.log(data)

      document.getElementById('street').value = data.logradouro || '';
      document.getElementById('neighborhood').value = data.bairro || '';
      document.getElementById('city').value = data.localidade || '';
      document.getElementById('state').value = data.uf || '';
      document.getElementById('country').value = 'Brasil';
    } catch (error) {
      alert('Erro ao buscar o CEP. Verifique se ele está correto.');
    } finally {
      document.getElementById('cep-loading').style.display = 'none';
    }
  });
});
