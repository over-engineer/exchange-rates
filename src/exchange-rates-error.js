class ExchangeRatesError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExchangeRatesError';
  }
}

module.exports = ExchangeRatesError;
