<p align="center">
    <img width="128" height="128" src="../assets/icon.svg" alt="icon" />
</p>

# Exchange Rates
[![npm](https://img.shields.io/npm/v/exchange-rates-api.svg)](https://www.npmjs.com/package/exchange-rates-api)
[![NPM](https://img.shields.io/npm/l/exchange-rates-api.svg)](https://github.com/over-engineer/exchange-rates/blob/master/LICENSE)
[![Travis (.org)](https://img.shields.io/travis/over-engineer/exchange-rates.svg)](https://travis-ci.org/over-engineer/exchange-rates)

💰🌍 An unofficial [node.js](https://nodejs.org/) wrapper for the awesome and free [ratesapi.io](https://ratesapi.io/), which provides exchange rate lookups courtesy of the [Central European Bank](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html).

## Table of Contents

* [Installation](#-installation)
* [Usage](#-usage)
* [Supported Currencies](#-supported-currencies)
* [Bugs & Features](#-bugs-features)
* [Documentation](#-documentation)
* [Unit Testing](#-unit-testing)
* [Dependencies](#-dependencies)
* [License](#-license)

## 📦 Installation

```
$ npm i exchange-rates-api
```

## ⌨️ Usage

Once you [have installed the npm package](#-installation) you can start using it immediately. [Rates API](https://ratesapi.io/) does **not** require you to sign up, generate API keys etc.

### Latest & specific date rates

```javascript
const { exchangeRates } = require('exchange-rates-api');

(async () => {
    // Get the latest exchange rates
    await exchangeRates().latest().fetch();                             // {THB: 34.978, PHP: 58.159, …, HUF: 323.58}

    // Get historical rates for any day since 1999
    await exchangeRates().at('2018-03-26').fetch();                     // {THB: 38.66, PHP: 64.82, …, HUF: 312.73}

    // By default, the base currency is EUR, but it can be changed
    await exchangeRates().latest().base('USD').fetch();                 // {THB: 30.9348191386, …, HUF: 286.1767046962}

    // Request specific exchange rates
    await exchangeRates().latest().symbols(['USD', 'GBP']).fetch();     // {USD: 1.1307, GBP: 0.89155}

    // Request one specific exchange rate
    await exchangeRates().latest().symbols('USD').fetch();              // 1.1307
})();
```

### Rates history

```javascript
const { exchangeRates } = require('exchange-rates-api');

(async () => {
    // Get historical rates for a time period
    await exchangeRates().from('2018-01-01').to('2018-09-01').fetch();
    // outputs: { '2018-02-28': { THB: 38.613, …, HUF: 313.97 }, …, { '2018-06-07': { … } } }

    // Limit results to specific exchange rates to save bandwidth
    await exchangeRates()
        .from('2018-01-01').to('2018-09-01')
        .symbols(['ILS', 'JPY'])
        .fetch();

    // Quote the historical rates against a different currency
    await exchangeRates().from('2018-01-01').to('2018-09-01').base('USD');
})();
```

### Different ways to pass a date

```javascript
const { exchangeRates } = require('exchange-rates-api');

(async () => {
    // Pass an YYYY-MM-DD (ISO 8601) string
    await exchangeRates().at('2018-09-01').fetch();

    // Pass another string
    await exchangeRates().at('September 1, 2018').fetch();

    // Pass a Date object
    await exchangeRates().at(new Date(2019, 8, 1)).fetch();
})();
```

### Currencies object

```javascript
const { exchangeRates, currencies } = require('exchange-rates-api');

(async () => {
    await exchangeRates().latest()
        .base(currencies.USD)
        .symbols([currencies.EUR, currencies.GBP])
        .fetch();
})();
```

### Average rate for a specific time period

```javascript
const { exchangeRates } = require('exchange-rates-api');

(async () => {
    // Find the average exchange rate for January, 2018
    await exchangeRates()
        .from('2018-01-01').to('2018-01-31')
        .base('USD').symbols('EUR')
        .avg();     // 0.8356980613403501

    // Set the number of decimal places
    await exchangeRates()
        .from('2018-01-01').to('2018-01-31')
        .base('USD').symbols(['EUR', 'GBP'])
        .avg(2);    // { EUR: 0.84, GBP: 0.74 }
})();
```

### Convert

```javascript
const { convert } = require('exchange-rates-api');

(async () => {
    let amount = await convert(2000, 'USD', 'EUR', '2018-01-01');
    console.log(amount);    // 1667.6394564000002
})();
```

### API URL

```javascript
const { exchangeRates } = require('exchange-rates-api');

// Grab the url we're going to request
let url = exchangeRates()
    .from('2018-01-01').to('2018-09-01')
    .base('USD').symbols(['EUR', 'GBP'])
    .url;

console.log(url);
// https://api.ratesapi.io/history?start_at=2018-01-01&end_at=2018-09-01&base=USD&symbols=EUR,GBP
```

### Using a different API

```javascript
const { exchangeRates } = require('exchange-rates-api');

/* You can use it with pretty much any Fixer.io-compatible API */

(async () => {
    await exchangeRates()
        .setApiBaseUrl('https://api.exchangerate.host')
        .latest()
        .fetch();    // {THB: 34.978, PHP: 58.159, …, HUF: 323.58}
})();
```

### Error handling

```javascript
const { exchangeRates } = require('exchange-rates-api');

/* `ExchangeRatesError` and `TypeError` are explicitly thrown
 * sometimes, so you might want to handle them */

// async/await syntax
(async () => {
    try {
        /* This will throw an `ExchangeRateError` with the error
         * message 'Cannot get historical rates before 1999' */
        let rates = await exchangeRates().at('1990-01-01').fetch();
    } catch (error) {
        // Handle the error
    }
})();

// Promises syntax
exchangeRates().at('1990-01-01').fetch()
    .then(rates => {})
    .catch(error => {
        // Handle the error
    });
```

## 💰 Supported Currencies

The library supports any currency currently available on the European Central Bank's web service, which at the time of the latest release are as follows:

- Australian Dollar (AUD)
- Brazilian Real (BRL)
- British Pound Sterline (GBP)
- Bulgarian Lev (BGN)
- Canadian Dollar (CAD)
- Chinese Yuan Renminbi (CNY)
- Croatian Kuna (HRK)
- Czech Koruna (CZK)
- Danish Krone (DKK)
- Euro (EUR)
- Hong Kong Dollar (HKD)
- Hungarian Forint (HUF)
- Icelandic Krona (ISK)
- Indonesian Rupiah (IDR)
- Indian Rupee (INR)
- Israeli Shekel (ILS)
- Japanese Yen (JPY)
- Malaysian Ringgit (MYR)
- Mexican Peso (MXN)
- New Zealand Dollar (NZD)
- Norwegian Krone (NOK)
- Philippine Peso (PHP)
- Polish Zloty (PLN)
- Romanian Leu (RON)
- Russian Rouble (RUB)
- Singapore Dollar (SGD)
- South African Rand (ZAR)
- South Korean Won (KRW)
- Swedish Krona (SEK)
- Swiss Franc (CHF)
- Thai Baht (THB)
- Turkish Lira (TRY)
- US Dollar (USD)

## 🐞 Bugs & Features

If you have spotted any bugs, or would like to request additional features from the library, please [file an issue](https://github.com/over-engineer/exchange-rates/issues).

## 📚 Documentation

- [Read the docs](https://over-engineer.github.io/docs/exchange-rates-api/)
- Generate them using jsdoc

    ```
    $ npm run docs
    ```

## 🧪 Unit Testing

There are a few basic unit tests in the `test` directory, but [we should definitely write more](https://github.com/over-engineer/exchange-rates/issues/2)

**Development dependencies**

* [Chai](https://www.chaijs.com/) — a BDD / TDD assertion library for node and the browser
* [Mocha](https://mochajs.org/) — a feature-rich JavaScript test framework running on Node.js and in the browser
* [fetch-mock](http://www.wheresrhys.co.uk/fetch-mock/) — allows mocking http requests made using fetch or a library imitating its api, such as node-fetch or fetch-ponyfill

## 🗄 Dependencies

* [date-fns](https://www.npmjs.com/package/date-fns) — Modern JavaScript date utility library
* [isomorphic-fetch](https://www.npmjs.com/package/isomorphic-fetch) — Isomorphic WHATWG Fetch API, for Node & Browserify

## 📖 License

The MIT License, check the `LICENSE` file
