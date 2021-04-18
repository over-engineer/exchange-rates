const { format, parse, isValid } = require('date-fns');

const ExchangeRatesError = require('./exchange-rates-error');

module.exports = {
  /**
   * Convert the given argument to an instance of Date
   *
   * It utlizes `date-fns/parse` to parse the date
   * {@link https://date-fns.org/v1.30.1/docs/parse}
   *
   * If the argument is an instance of Date, the function returns its clone.
   * If the argument is a number, it is treated as a timestamp.
   * If an argument is a string, the function tries to parse it.
   * Function accepts complete ISO 8601 formats as well as partial
   * implementations. {@link http://en.wikipedia.org/wiki/ISO_8601}
   * If all above fails, the function passes the given argument to
   * Date constructor.
   *
   * It utlizes `date-fns/isValid` to check if the parsed date is valid
   * {@link https://date-fns.org/v1.30.1/docs/isValid}
   *
   * @throws {ExchangeRatesError}     Will throw an error if the parsed
   *                                  date is not a valid date
   *
   * @param {*} date                  The argument to convert to a Date
   * @return {Date}                   The parsed date in the local time zone
   */
  parseDate: (date) => {
    const parsedDate = parse(date);

    try {
      isValid(parsedDate);
    } catch (error) {
      throw new ExchangeRatesError(`${parsedDate} is not a valid date`);
    }

    return date;
  },

  /**
   * Format the given date as a YYYY-MM-DD string
   *
   * {@link https://date-fns.org/v1.30.1/docs/format}
   *
   * @param {Date} date               An instance of Date
   * @return {string}                 The YYYY-MM-DD string
   */
  formatDate: (date) => format(date, 'YYYY-MM-DD'),

  /**
   * Removes trailing forward slashes if they exist
   *
   * @param {string} str              The string to remove the trailing slashes from
   * @return {string}                 The string without the trailing slashes
   */
  untrailingSlashIt: (str) => (str.endsWith('/') ? str.substring(0, str.length - 1) : str),
};
