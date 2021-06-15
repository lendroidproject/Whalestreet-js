// tslint:disable-next-line: no-namespace
export const call = (method: (...args: any) => any) => (...args: any) =>
  method(...args).call() as Promise<any>;
export const send = (method: (...args: any) => any) => (...args: any) => {
  const option = args.pop();
  const transaction = method(...args);
  return {
    estimate: (): Promise<any> =>
      transaction.estimateGas(option) as Promise<any>,
    send: (): Promise<any> => transaction.send(option) as Promise<any>,
    transaction
  };
};
