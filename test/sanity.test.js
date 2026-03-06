import './setup-dom.js';

export default ({ test, assert }) => {
  test('Sanity - 1 + 1 === 2', () => {
    assert(1 + 1 === 2);
  });

  test('Sanity - string concatenation', () => {
    assert('hello' + ' ' + 'world' === 'hello world');
  });
};
