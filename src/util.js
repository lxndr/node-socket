import debug from 'debug';

export const log = debug('socket');

export function defer() {
  let resolve;
  let reject;

  const promise = new Promise((...args) => {
    resolve = args[0];
    reject = args[1];
  });

  return {resolve, reject, promise};
}

export function promiseFromCallback(cb) {
  return new Promise((resolve, reject) => {
    cb((err, value) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(value);
    });
  });
}

export function callback(self, fn) {
  return function (...args) {
    if (fn.length <= 1) {
      return Promise.resolve(fn.apply(self, args));
    }

    if (args.length !== fn.length - 1) {
      throw new TypeError('callback argument mismatch');
    }

    return promiseFromCallback(cb => {
      fn.apply(self, [...args, cb]);
    });
  };
}

export class Interval {
  constructor(interval, cb) {
    this.intervalId = null;
    this.interval = interval;
    this.cb = cb;
    this.start();
  }

  start() {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.cb, this.interval);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.start();
  }
}
