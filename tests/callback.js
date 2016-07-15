const {promiseFromCallback, callback} = require('../lib/util');

describe('promise from callback', () => {
  it('fulfill', () => {
    function foo(arg1, arg2, cb) {
      cb(null, true);
    }

    const promise = promiseFromCallback(cb => {
      foo(1, 2, cb);
    });

    return promise.should.eventually.be.true;
  });

  it('error', () => {
    function foo(arg1, arg2, cb) {
      cb(new Error());
    }

    const promise = promiseFromCallback(cb => {
      foo(1, 2, cb);
    });

    return promise.should.eventually.be.rejected;
  });

  it('throw', () => {
    function foo(arg1, arg2, cb) {
      throw new Error();
      cb(null, true);
    }

    const promise = promiseFromCallback(cb => {
      foo(1, 2, cb);
    });

    return promise.should.eventually.be.rejected;
  });
});

describe('universal callback', () => {
  it('using a plain value', () => {
    const cb = callback(null, () => {
      return true;
    });

    return cb().should.eventually.be.true;
  });

  it('using a plain value (error)', () => {
    const cb = callback(null, () => {
      throw new Error();
    });

    return cb().should.eventually.be.rejected;
  });

  it('using Promise', () => {
    const cb = callback(null, () => {
      return Promise.resolve(true);
    });

    return cb().should.eventually.be.true;
  });

  it('using a classic callback', () => {
    const cb = callback(null, (data, cb) => {
      cb(null, true);
    });

    return cb(1).should.eventually.to.be.true;
  });

  it('using a classic callback (error)', () => {
    const cb = callback(null, (data, cb) => {
      cb(new Error());
    });

    return cb(1).should.eventually.be.rejected;
  });

  it('using a classic callback (throw)', () => {
    const cb = callback(null, (data, cb) => {
      throw new Error();
    });

    return cb(1).should.eventually.be.rejected;
  });
});
