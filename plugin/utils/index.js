function get(target, attr) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr, index, self) => {
        return accumulator[attr];
      }, target)
    : target[attr];
}

function set(target, attr, value) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr, index, self) => {
        if (self.length - 1 === index) {
          accumulator[attr] = value;
        }
        return accumulator[attr];
      }, target)
    : (target[attr] = value);
}

function getType(target) {
  return Object.prototype.toString.call(target);
}

function createUUID() {
  return Number(Math.random().toString().substr(2)).toString(36);
}

export { get, set, getType, createUUID };
