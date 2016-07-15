import _ from 'lodash';

export function deffer() {
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
    try {
      cb((err, value) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(value);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function callback(self, fn) {
  return function (...args) {
    if (fn.length <= 1) {
      return new Promise(resolve => {
        const ret = fn.apply(self, args);
        resolve(ret);
      });
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
  }

  start() {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.cb, this.interval);
    }
  }

  stop() {
    if (this.timeoutId) {
      clearInterval(this.intervalId);
    }
  }

  reset() {
    this.stop();
    this.start();
  }
}
