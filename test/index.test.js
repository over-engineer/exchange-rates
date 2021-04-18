require('isomorphic-fetch');
const fetchMock = require('fetch-mock');
const { expect } = require('chai');
const fs = require('fs');

const { exchangeRates } = require('../src');

const getMockResponse = filename => {
    const raw = fs.readFileSync('./test/mock_responses/' + filename + '.json');
    return JSON.parse(raw);
};

describe('Fetch the latest exchange rates', function() {
    afterEach(function() {
        fetchMock.restore();
    });

    describe('#latest()', function() {
        beforeEach(function() {
            fetchMock.mock('https://api.ratesapi.io/latest', getMockResponse('latest'));
        });

        it('Should request /latest', async function() {
            await exchangeRates().latest().fetch();
            expect(fetchMock.called('https://api.ratesapi.io/latest')).to.be.true;
        });

        it('Should eventually return an object', async function() {
            expect(await exchangeRates().latest().fetch()).to.be.an('object');
        });

        it('Should eventually return an object where all of its keys seem like currencies', async function() {
            Object.keys(await exchangeRates().latest().fetch())
                .every(currency => expect(currency).to.match(/^[A-Z]{3}$/));
        });

        it('Should eventually return an object where all of its values are numbers', async function() {
            Object.values(await exchangeRates().latest().fetch())
                .every(rate => expect(rate).to.be.a('number'));
        });
    });
});

describe('Using a different API', function() {
    beforeEach(function() {
        fetchMock.mock('https://api.exchangerate.host/latest', getMockResponse('latest'));
    });

    afterEach(function() {
        fetchMock.restore();
    });

    it('Should switch to api.exchangerate.host', async function() {
        await exchangeRates()
            .setApiBaseUrl('https://api.exchangerate.host')
            .latest()
            .fetch();

        expect(fetchMock.called('https://api.exchangerate.host/latest')).to.be.true;
    });

    it('Should accept API base urls with trailing slashes', async function() {
        await exchangeRates()
            .setApiBaseUrl('https://api.exchangerate.host/')
            .latest()
            .fetch();

        expect(fetchMock.called('https://api.exchangerate.host/latest')).to.be.true;
    });
});

describe('Fetch historic rates for a specific time period', function() {
    beforeEach(function() {
        fetchMock.mock(/^https:\/\/api.ratesapi.io\/history(.*)/, getMockResponse('history'));
    });

    afterEach(function() {
        fetchMock.restore();
    });

    it('Should pass the specified \'start_at\' and \'end_at\' parameters for ISO 8601 dates', async function() {
        await exchangeRates().from('2018-06-01').to('2018-06-21').fetch();
        expect(fetchMock.lastUrl(/^https:\/\/api.ratesapi.io\/history(.*)/))
            .to.equal('https://api.ratesapi.io/history?start_at=2018-06-01&end_at=2018-06-21');
    });

    it('Should pass the specified \'start_at\' and \'end_at\' parameters for date objects', async function() {
        await exchangeRates().from(new Date(2018, 5, 1)).to(new Date(2018, 5, 14)).fetch();
        expect(fetchMock.lastUrl(/^https:\/\/api.ratesapi.io\/history(.*)/))
            .to.equal('https://api.ratesapi.io/history?start_at=2018-06-01&end_at=2018-06-14');
    });

    it('Should pass the specified \'start_at\' and \'end_at\' parameters for date strings', async function() {
        await exchangeRates().from('June 1, 2018').to('June 18, 2018').fetch();
        expect(fetchMock.lastUrl(/^https:\/\/api.ratesapi.io\/history(.*)/))
            .to.equal('https://api.ratesapi.io/history?start_at=2018-06-01&end_at=2018-06-18');
    });
});

describe('Error handling', function() {
    beforeEach(function() {
        fetchMock.mock(/^https:\/\/api.ratesapi.io\/history(.*)/, getMockResponse('history'));
    });

    it('Should throw an error if \'to\' is set, but \'from\' isn\'t', async function() {
        let error = '_DID_NOT_THROW_ERROR_';

        try {
            await exchangeRates().to('2018-06-21').fetch();
        } catch (err) {
            error = err;
        }

        expect(error).to.have.property('name', 'ExchangeRatesError');
    });

    it('Should throw an error if the \'from\' date is after the \'to\' date', async function() {
        let error = '_DID_NOT_THROW_ERROR_';

        try {
            await exchangeRates().from('2018-06-21').to('2018-06-01').fetch();
        } catch (err) {
            error = err;
        }

        expect(error).to.have.property('name', 'ExchangeRatesError');
    });

    it('Should throw an error if \'from\' is set to a date before 1999', async function() {
        let error = '_DID_NOT_THROW_ERROR_';

        try {
            await exchangeRates().from('1998-06-01').fetch();
        } catch (err) {
            error = err;
        }

        expect(error).to.have.property('name', 'ExchangeRatesError');
    });
});

// TODO: Write more/better unit tests
