interface IDAble {
  id: string
}


class SingleCounter<T extends IDAble> {
  _cubeable: T;
  _count: number;

  constructor(cubeable: T, count: number) {
    this._cubeable = cubeable;
    this._count = count;
  }

  item = (): T => {
    return this._cubeable
  };

  count = (): number => {
    return this._count
  };

  add = (amount: number): SingleCounter<T> => {
    this._count += amount;
    return this;
  };

}


export class Counter<T extends IDAble> {

  _counters: { [id: string]: SingleCounter<T> };

  constructor(items: [T, number][] = []) {
    this._counters = {};
    items.forEach(([item, multiplicity]) => this.add(item, multiplicity));
  }

  isEmpty = (): boolean => {
    return !Object.keys(this._counters).length;
  };

  add = (item: T, amount: number = 1): void => {
    if (amount === 0) {
      return
    }
    let count = this._counters[item.id];
    if (count === undefined) {
      this._counters[item.id] = new SingleCounter(item, amount)
    } else {
      if (count.add(amount).count() === 0) {
        delete this._counters[item.id]
      }
    }
  };

  * items(): IterableIterator<[T, number]> {
    for (const count of Object.values(this._counters)) {
      yield [count.item(), count.count()]
    }
  }

  * iter(): IterableIterator<T> {
    for (const count of Object.values(this._counters)) {
      for (let _ = 0; _ < count.count(); _++) {
        yield count.item()
      }
    }
  }

}


export class MultiplicityList<T> {
  items: [T, number][];

  constructor(items: [T, number][] = []) {
    this.items = items;
  }

  * iter(): IterableIterator<T> {
    for (const [item, multiplicity] of this.items) {
      for (let _ = 0; _ < multiplicity; _++) {
        yield item
      }
    }
  }

}