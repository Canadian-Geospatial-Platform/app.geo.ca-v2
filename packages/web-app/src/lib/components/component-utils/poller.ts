export function poll(fn: Function, validate: Function, interval: number) {
  let stop = false;
  async function execute(resolve: Function, reject: Function) {
    if (stop) return;

    const result = await fn();
    if (await validate(result) === true) {
      resolve(result);
    } else if (!stop) {
      setTimeout(execute, interval, resolve, reject);
    }
  }

  function clear() {
    stop = true;
  }

  return [new Promise(execute), clear];
}