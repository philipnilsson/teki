import { parseRoute, reverseRoute } from '../index'

describe('parsing', () => {
  describe('path', () => {
    test('happy 1', () => {
      expect(
        parseRoute('/foo/:path/:baz<foo(1|2|3)>')
          ('http://localhost/foo/bar/foo1')
      ).toEqual({
        query: {},
        path: {
          baz: 'foo1',
          path: 'bar',
        },
        hash: {}
      })
    })

    test('happy 2', () => {
      expect(
        parseRoute('/:baz<(aa){2,3}>/')
          ('https://www.example.com/aaaaaa')
      ).toEqual({
        query: {},
        path: {
          baz: 'aaaaaa',
        },
        hash: {}
      })
    })

    test('happy 3', () => {
      expect(
        parseRoute('/user/:id<\\d+>/')
          ('https://www.example.com:8080/user/123')
      ).toEqual({
        query: {},
        path: {
          id: '123',
        },
        hash: {}
      })
    })

    test('fail 1', () => {
      expect(
        parseRoute('/:baz<(aa){2,3}>/')
          ('https://www.example.com/aaaaa')
      ).toEqual(null)
    })

    test('fail 2', () => {
      expect(() => parseRoute('noleadingslash'))
        .toThrow('Must start with /')
    })

    test('fail 3', () => {
      expect(() => parseRoute('/foo/:path<oops')('http://localhost/foo/path'))
        .toThrow('Expected closing >')
    })
  })

  describe('query', () => {
    test('happy 1', () => {
      expect(
        parseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ('http://localhost/foo?ipsum=123&lorem=aaa')
      ).toEqual({
        query: { hi: 'aaa', ipsum: '123' },
        path: {},
        hash: {}
      })
    })

    test('happy 2', () => {
      expect(
        parseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ('http://localhost/foo?ipsum=123&lorem=b')
      ).toEqual({
        query: { hi: 'b', ipsum: '123' },
        path: {},
        hash: {}
      })
    })

    test('fail 1', () => {
      expect(
        parseRoute
          ('/foo?ipsum=:ipsum&lorem=:hi<a+|b+>')
          ('http://localhost/foo?ipsum=123&lorem=')
      ).toEqual(null)
    })

    test('superset', () => {
      expect(
        parseRoute
          ('/foo?lorem=:hi<a+|b+>')
          ('http://localhost/foo?ipsum=123&lorem=aaa')
      ).toEqual({
        query: { hi: 'aaa' },
        path: {},
        hash: {}
      })
    })

    test('subset', () => {
      expect(
        parseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ('http://localhost/foo?ipsum=123')
      ).toEqual(null)
    })

    test('no = #1', () => {
      expect(
        parseRoute
          ('/foo?lorem&ipsum&dolor')
          ('http://localhost/foo?lorem&ipsum&dolor')
      ).toEqual({
        path: {},
        hash: {},
        query: {}
      })
    })

    test('no = #2', () => {
      expect(
        parseRoute
          ('/foo?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>')
          ('http://localhost/foo?lorem&ipsum&dolor=sit')
      ).toEqual({
        path: {},
        hash: {},
        query: {
          ipsum: '',
          dolor: 'sit'
        }
      })
    })

    test('no = #3', () => {
      expect(
        parseRoute
          ('/foo?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>')
          ('http://localhost/foo?lorem&ipsum&dolor=sitx')
      ).toEqual(null)
    })
  })

  describe('hash', () => {
    test('happy 1', () => {
      expect(
        parseRoute('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#aaabb')
      ).toEqual({
        query: {},
        path: {},
        hash: {
          word: 'aaabb'
        }
      })
    })

    test('happy 2', () => {
      expect(
        parseRoute('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#b')
      ).toEqual({
        query: {},
        path: {},
        hash: {
          word: 'b'
        }
      })
    })

    test('fail 1', () => {
      expect(
        parseRoute('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#cbbb')
      ).toEqual(null)
    })
  })

  test('all together now', () => {
    expect(
      parseRoute('/foo/:b1_2/:baz<\\d+>?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>#:word<c?a*b{1,2}>')
        ('http://localhost/foo/bar/123?lorem&ipsum=ip&dolor=amet#caaabb')
    ).toEqual({
      hash: {
        word: 'caaabb',
      },
      path: {
        b1_2: 'bar',
        baz: '123',
      },
      query: {
        dolor: 'amet',
        ipsum: 'ip',
      }
    })
  })
})

describe('unparsing', () => {
  describe('path', () => {
    test('happy 1', () => {
      expect(
        reverseRoute('/foo/:path/:baz<foo(1|2|3)>')({
          query: {},
          path: {
            baz: 'foo1',
            path: 'bar',
          },
          hash: {}
        })
      ).toEqual(
        '/foo/bar/foo1'
      )
    })

    test('happy 2', () => {
      expect(
        reverseRoute('/:baz<(aa){2,3}>/')
          ({
            query: {},
            path: {
              baz: 'aaaaaa',
            },
            hash: {}
          })
      ).toEqual('/aaaaaa')
    })

    test('happy 3', () => {
      expect(
        reverseRoute('/user/:id<\\d+>/')({
          query: {},
          path: {
            id: '123',
          },
          hash: {}
        })
      ).toEqual('/user/123')
    })

    test('fail 1', () => {
      expect(
        () => reverseRoute('/:baz<(aa){2,3}>/')({ query: {}, path: {}, hash: {} })
      ).toThrow('Dict should contain baz')
    })
  })

  describe('query', () => {
    test('happy 1', () => {
      expect(
        reverseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({
            query: { hi: 'aaa', ipsum: '123' },
            path: {},
            hash: {}
          })
      ).toEqual('/foo?lorem=aaa&ipsum=123')
    })

    test('happy 2', () => {
      expect(
        reverseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({
            query: { hi: 'b', ipsum: '123' },
            path: {},
            hash: {}
          })
      ).toEqual('/foo?lorem=b&ipsum=123')
    })

    test('superset', () => {
      expect(
        reverseRoute
          ('/foo?lorem=:hi<a+|b+>')
          ({
            query: { hi: 'aaa', bar: '123', baz: '' },
            path: {},
            hash: {}
          })
      ).toEqual('/foo?lorem=aaa')
    })

    test('subset', () => {
      expect(
        () => reverseRoute
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({ query: {}, path: {}, hash: {} })
      ).toThrow(
        'Dict should contain hi'
      )
    })

    test('no =', () => {
      expect(
        reverseRoute
          ('/foo?lorem&ipsum&dolor')
          ({
            path: {},
            hash: {},
            query: {}
          })
      ).toEqual('/foo?lorem=&ipsum=&dolor=')
    })
  })

  describe('hash', () => {
    test('happy 1', () => {
      expect(
        parseRoute('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#aaabb')
      ).toEqual({
        query: {},
        path: {},
        hash: {
          word: 'aaabb'
        }
      })
    })

    test('happy 2', () => {
      expect(
        reverseRoute('/foo#:word<c?a*b{1,2}>')
          ({
            query: {},
            path: {},
            hash: {
              word: 'b'
            }
          })
      ).toEqual('/foo#b')
    })
  })
})
