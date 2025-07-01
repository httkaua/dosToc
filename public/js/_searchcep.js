document.addEventListener('DOMContentLoaded', () => {

  class DOMManager {
    constructor() {
      this.elements = this._getElements();
      this._validateElements();
    }

    _getElements() {
      return {
        cepInput: document.querySelector('.CEPlocationCode'),
        street: document.querySelector('.CEPstreet'),
        neighborhood: document.querySelector('.CEPneighborhood'),
        city: document.querySelector('.CEPcity'),
        state: document.querySelector('.CEPstate'),
        country: document.querySelector('.CEPcountry')
      };
    }

    _validateElements() {
      if (!this.elements.cepInput) {
        throw new Error('Elemento principal não encontrado');
      }
    }

    getCepValue() {
      return this.elements.cepInput.value.replace(/\D/g, '');
    }

    fillAddressFields(addressData) {
      const { street, neighborhood, city, state, country } = this.elements;

      if (!street || !neighborhood || !city || !state || !country) {
        throw new Error('Elementos não encontrados, impossível preencher.');
      }

      street.value = addressData.logradouro || '';
      neighborhood.value = addressData.bairro || '';
      city.value = addressData.localidade || '';
      state.value = addressData.uf || '';
      country.value = 'Brasil';
    }

    addEventListener(event, callback) {
      this.elements.cepInput.addEventListener(event, callback);
    }
  }

  class LoadingManager {
    constructor(parentElement) {
      this.loadingElement = this._createLoadingElement();
      parentElement.appendChild(this.loadingElement);
    }

    _createLoadingElement() {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.innerHTML = `
        <div id="cep-loading" style="
          display: none;
          margin-top: 8px;
          font-size: 0.9rem;
          color: #007bff;">
          🔄 Buscando endereço...
        </div>
      `;
      return loadingIndicator;
    }

    show() {
      document.getElementById('cep-loading').style.display = 'block';
    }

    hide() {
      document.getElementById('cep-loading').style.display = 'none';
    }
  }

  class CEPValidator {
    static isValid(cep) {
      return cep.length === 8;
    }
  }

  class ICEPService {
    async getAddressByCEP(cep) {
      throw new Error('Método deve ser implementado');
    }
  }

  class ViaCEPService extends ICEPService {
    async getAddressByCEP(cep) {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

      if (response.data.erro) {
        throw new Error('CEP não encontrado');
      }

      return response.data;
    }
  }

  class ErrorHandler {
    static handle(error) {
      console.error('Erro:', error);
      alert(error.message || 'Erro ao buscar o CEP. Verifique se ele está correto.');
    }
  }

  class CEPLookupController {
    constructor(domManager, loadingManager, cepService) {
      this.domManager = domManager;
      this.loadingManager = loadingManager;
      this.cepService = cepService;
      this._bindEvents();
    }

    _bindEvents() {
      this.domManager.addEventListener('blur', async () => {
        await this._handleCEPLookup();
      });
    }

    async _handleCEPLookup() {
      try {
        const cep = this.domManager.getCepValue();

        if (!CEPValidator.isValid(cep)) {
          return;
        }

        this.loadingManager.show();

        const addressData = await this.cepService.getAddressByCEP(cep);

        this.domManager.fillAddressFields(addressData);

      } catch (error) {
        ErrorHandler.handle(error);
      } finally {
        this.loadingManager.hide();
      }
    }
  }

  try {
    const domManager = new DOMManager();
    const loadingManager = new LoadingManager(domManager.elements.cepInput.parentNode);
    const cepService = new ViaCEPService();

    new CEPLookupController(domManager, loadingManager, cepService);
  } catch (error) {
    ErrorHandler.handle(error);
  }
});