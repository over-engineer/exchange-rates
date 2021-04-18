/**
 * An API wrapper around api.ratesapi.io
 *
 * @module exchange-rate-api
 * @author over-engineer
 */

require('isomorphic-fetch');
const { getYear, isAfter } = require('date-fns');

const ExchangeRatesError = require('./exchange-rates-error');
const QueryStringBuilder = require('./query-string-builder');
const currenciesList = require('./currencies');
const utils = require('./utils');

const API_BASE_URL = 'https://api.ratesapi.io';

/**
 * ExchangeRates
 */
class ExchangeRates {
  constructor() {
    // API base url
    this._api_base_url = API_BASE_URL;

    // Base currency, defaults to 'EUR'
    this._base = null;

    // Exchange rates to fetch
    this._symbols = null;

    // Date from which to request historical rates
    this._from = 'latest';

    // Date to which to request historical rates
    this._to = null;
  }

  /**
   * Throw an error if the given currency is not supported
   *
   * @throws {ExchangeRatesError}     Will throw an error if the given currency
   *                                  doesn't exist in the `currenciesList` object
   */
  _validateCurrency(currency) {
    if (!(currency in currenciesList)) {
      throw new ExchangeRatesError(`${currency} is not a valid currency`);
    }
  }

  /**
   * Determine whether this request should call the /history endpoint or not
   *
   * @return {boolean}                Whether this a history request or not
   */
  _isHistoryRequest() {
    return this._to !== null;
  }

  /**
   * Throw an error if any of our validations fails
   *
   * @throws {ExchangeRatesError}     Will throw an error if any validation fails
   */
  _validate() {
    if (this._isHistoryRequest()) {
      if (this._from === 'latest') {
        throw new ExchangeRatesError('Cannot set the \'from\' date to \'latest\' when fetching a date range');
      }
      if (isAfter(this._from, this._to)) {
        throw new ExchangeRatesError('The \'from\' date cannot be after the \'to\' date');
      }
    }

    if (this._from !== 'latest' && getYear(this._from) < 1999) {
      throw new ExchangeRatesError('Cannot get historical rates before 1999');
    }
  }

  /**
   * Build and return the url to request
   *
   * @return {string}                 The url to request
   */
  _buildUrl() {
    let url = `${this._api_base_url}/`;
    const qs = new QueryStringBuilder();

    if (this._isHistoryRequest()) {
      url += 'history';
      qs.addParam('start_at', utils.formatDate(this._from));
      qs.addParam('end_at', utils.formatDate(this._to));
    } else {
      url += (this._from === 'latest') ? 'latest' : utils.formatDate(this._from);
    }

    if (this._base) {
      qs.addParam('base', this._base);
    }

    if (this._symbols) {
      qs.addParam('symbols', this._symbols.join(','), false);
    }

    return url + qs;
  }

  /**
   * Set the API base url
   *
   * @param {string} url                  API base url
   */
  setApiBaseUrl(url) {
    this._api_base_url = utils.untrailingSlashIt(url);
    return this; // chainable
  }

  /**
   * Set the date to get historical rates for that specific day
   *
   * @param {Date} date               The date to request its historical rates
   * @return {ExchangeRates}          The instance on which this method was called
   */
  at(date) {
    this._from = utils.parseDate(date);
    return this; // chainable
  }

  /**
   * Set the date to get the latest exchange rates
   *
   * @return {ExchangeRates}          The instance on which this method was called
   */
  latest() {
    this._from = 'latest';
    return this; // chainable
  }

  /**
   * Set the date from which to request historical rates
   *
   * @param {Date} date               The date from which to request historical rates
   * @return {ExchangeRates}          The instance on which this method was called
   */
  from(date) {
    this._from = utils.parseDate(date);
    return this; // chainable
  }

  /**
   * Set the date to which to request historical rates
   *
   * @param {Date} date               The date to which to request historical rates
   * @return {ExchangeRates}          The instance on which this method was called
   */
  to(date) {
    this._to = utils.parseDate(date);
    return this; // chainable
  }

  /**
   * Set the base currency (if not explicitly set, it defaults to 'EUR')
   *
   * @param {string} currency         The base currency
   * @return {ExchangeRates}          The instance on which this method was called
   */
  base(currency) {
    if (typeof currency !== 'string') {
      throw new TypeError('Base currency has to be a string');
    }

    const currencyUpper = currency.toUpperCase();
    this._validateCurrency(currencyUpper);

    this._base = currencyUpper;
    return this; // chainable
  }

  /**
   * Set symbols to limit results to specific exchange rate(s)
   *
   * @param {string|string[]} currencies      The currency (or an array of currencies)
   * @return {ExchangeRates}                  The instance on which this method was called
   */
  symbols(currencies) {
    const currenciesArray = Array.isArray(currencies) ? currencies : [currencies];

    for (let i = 0; i < currenciesArray.length; i += 1) {
      let currency = currenciesArray[i];

      if (typeof currency !== 'string') {
        throw new TypeError('Symbol currencies have to be strings');
      }

      currency = currency.toUpperCase();
      this._validateCurrency(currency);

      currenciesArray[i] = currency;
    }

    this._symbols = currenciesArray;
    return this; // chainable
  }

  /**
   * The API url to request
   * @type {string}
   */
  get url() {
    this._validate();
    return this._buildUrl();
  }

  /**
   * Fetch the exchange rates from api.ratesapi.io, parse the response and return it
   *
   * @return {Promise<object|number>}     A Promise that when resolved, returns either an
   *                                      object containing the exchange rates, or a number
   *                                      if the response contains a single exchange rate
   */
  fetch() {
    this._validate();

    // isomorphic-fetch adds `fetch` as a global
    // eslint-disable-next-line no-undef
    return fetch(this._buildUrl())
      .then((response) => {
        if (response.status !== 200) {
          throw new ExchangeRatesError(`API returned a bad response (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        const keys = Object.keys(data.rates);
        return (keys.length === 1) ? data.rates[keys[0]] : data.rates;
      })
      .catch((err) => {
        throw new ExchangeRatesError(`Couldn't fetch the exchange rate, ${err.message}`);
      });
  }

  /**
   * Return the average value of each exchange rate for the selected time period
   * To select a time period, create a chain with `.from()` and `.to()` before `.avg()`
   *
   * @param {?number} decimalPlaces       If set, it limits the number of decimal places
   * @return {Promise<object|number>}     A Promise that when resolved, returns either an
   *                                      object containing the average value of each rate
   *                                      for the selected time period, or a number if
   *                                      a single date was selected
   */
  avg(decimalPlaces = null) {
    if (decimalPlaces !== null && !Number.isInteger(decimalPlaces)) {
      throw new ExchangeRatesError('The decimal places parameter has to be an integer');
    }

    if (decimalPlaces !== null && decimalPlaces < 0) {
      throw new ExchangeRatesError('Decimal places cannot be negative');
    }

    return this.fetch().then((rates) => {
      if (!this._isHistoryRequest()) return rates;

      const mergedObj = {};
      Object.values(rates).forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          mergedObj[key] = mergedObj[key] || [];
          mergedObj[key].push(obj[key]);
        });
      });

      const avgRates = {};
      const keys = Object.keys(mergedObj);
      keys.forEach((key) => {
        const avgRate = mergedObj[key].reduce((p, c) => p + c, 0) / mergedObj[key].length;
        avgRates[key] = (decimalPlaces === null) ? avgRate : +avgRate.toFixed(decimalPlaces);
      });

      return (keys.length === 1) ? avgRates[keys[0]] : avgRates;
    });
  }
}

/**
 * Convert the given amount from one currency to another using the exchange rate of the given date
 *
 * @param {number} amount                   The amount to convert
 * @param {string} fromCurrency             Which currency to convert from
 * @param {string} toCurrency               Which currency to convert to
 * @param {Date|string} [date='latest']     The date to request the historic rate
 *                                          (if omitted, defaults to 'latest')
 * @return {number}                         The converted amount
 */
const convert = (amount, fromCurrency, toCurrency, date = 'latest') => {
  if (typeof amount !== 'number') {
    throw new TypeError('The \'amount\' parameter has to be a number');
  }

  if (Array.isArray(toCurrency)) {
    throw new TypeError('Cannot convert to multiple currencies at the same time');
  }

  const instance = new ExchangeRates();

  if (date === 'latest') {
    instance.latest();
  } else {
    instance.at(date);
  }

  return instance.base(fromCurrency).symbols(toCurrency).fetch().then((rate) => rate * amount);
};

/**
 * Return a new instance of `ExchangeRates`
 *
 * @return {ExchangeRates}      A new instance of `ExchangeRates`
 */
const exchangeRates = () => new ExchangeRates();

module.exports = {
  exchangeRates,
  currencies: currenciesList,
  convert,
};
