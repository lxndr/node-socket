export function deffer() {
  let resolve;
  let reject;

  const promise = new Promise((...args) => {
    resolve = args[0];
    reject = args[1];
  });

  return {resolve, reject, promise};
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
