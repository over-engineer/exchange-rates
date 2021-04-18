class QueryStringBuilder {
  constructor() {
    this._obj = {};
  }

  /**
   * Build and return the query string
   *
   * @return {string}         The built query string
   */
  _build() {
    const qs = Object.keys(this._obj)
      .map((key) => `${key}=${this._obj[key]}`)
      .join('&');

    return qs.length === 0 ? '' : `?${qs}`;
  }

  /**
   * Add a parameter for the query string
   *
   * This does not support nested objects, so passing an object
   * as the `value` might produce unexpected results
   *
   * @param {string} key              The key of the parameter
   * @param {*} value                 The value of the parameter
   * @param {boolean} [encode=true]   Whether to encode the key and value or not
   * @return {QueryStringBuilder}     The instance on which this method was called
   */
  addParam(key, val, encode = true) {
    const paramKey = (encode) ? encodeURIComponent(key) : key;
    const paramVal = (encode) ? encodeURIComponent(val) : val;

    this._obj[paramKey] = paramVal;
    return this; // chainable
  }

  /**
   * The query string
   * @type {string}
   */
  get val() {
    return this._build();
  }

  /**
   * Return the built query string when the object is to be represented as a text value
   *
   * `.toString()` gets implicitly invoked when the object is to be represented as a
   * text value or an object is referred to in a manner in which a string is expected
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString}
   *
   * The intended usage of the Query String Builder is to build the query string and
   * then concatenate it with a url, so `.toString()` will be automatically invoked
   *
   * @return {string}         The built query string
   */
  toString() {
    return this._build();
  }
}

module.exports = QueryStringBuilder;
