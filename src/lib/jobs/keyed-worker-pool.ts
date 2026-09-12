type KeyedWorkerPoolOptions<Item, Result> = {
  items: Item[];
  concurrency: number;
  keyFor: (item: Item) => string;
  worker: (item: Item) => Promise<Result>;
};

type QueuedItem<Item> = {
  item: Item;
  index: number;
};

export async function runKeyedWorkerPool<Item, Result>({
  items,
  concurrency,
  keyFor,
  worker,
}: KeyedWorkerPoolOptions<Item, Result>): Promise<Result[]> {
  if (items.length === 0) return [];

  const queues = new Map<string, QueuedItem<Item>[]>();
  for (const [index, item] of items.entries()) {
    const key = keyFor(item);
    const queue = queues.get(key) ?? [];
    queue.push({ item, index });
    queues.set(key, queue);
  }

  const readyKeys = [...queues.keys()];
  const results = new Array<Result>(items.length);
  const limit = Math.max(1, Math.min(Math.floor(concurrency) || 1, items.length));
  let active = 0;
  let completed = 0;
  let settled = false;

  return new Promise<Result[]>((resolve, reject) => {
    const schedule = () => {
      if (settled) return;
      if (completed === items.length) {
        settled = true;
        resolve(results);
        return;
      }

      while (active < limit && readyKeys.length > 0) {
        const key = readyKeys.shift() as string;
        const queue = queues.get(key) as QueuedItem<Item>[];
        const next = queue.shift() as QueuedItem<Item>;
        active += 1;

        void worker(next.item)
          .then((result) => {
            results[next.index] = result;
            completed += 1;
            if (queue.length > 0) readyKeys.push(key);
          })
          .catch((error: unknown) => {
            if (!settled) {
              settled = true;
              reject(error);
            }
          })
          .finally(() => {
            active -= 1;
            schedule();
          });
      }
    };

    schedule();
  });
}
