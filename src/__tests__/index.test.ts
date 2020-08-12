import { parse, reverse } from '../index'

describe.only('wat', () => {
  test('123123', () => {
    const userRoute =
      parse('/user/:id')

    console.log(userRoute('http://localhost/user/123'))
  })
})

describe('parsing', () => {
  describe('path', () => {
    test('happy 1', () => {
      expect(
        parse('/foo/:path/:baz<foo(1|2|3)>')
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
        parse('/:baz<(aa){2,3}>/')
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
        parse('/user/:id<\\d+>/')
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
        parse('/:baz<(aa){2,3}>/')
          ('https://www.example.com/aaaaa')
      ).toEqual(null)
    })

    test('fail 2', () => {
      expect(() => parse('noleadingslash'))
        .toThrow('Must start with /')
    })

    test('fail 3', () => {
      expect(() => parse('/foo/:path<oops')('http://localhost/foo/path'))
        .toThrow('No closing >')
    })
  })

  describe('query', () => {
    test('happy 1', () => {
      expect(
        parse
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
        parse
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
        parse
          ('/foo?ipsum=:ipsum&lorem=:hi<a+|b+>')
          ('http://localhost/foo?ipsum=123&lorem=')
      ).toEqual(null)
    })

    test('superset', () => {
      expect(
        parse
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
        parse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ('http://localhost/foo?ipsum=123')
      ).toEqual(null)
    })

    test('no = #1', () => {
      expect(
        parse
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
        parse
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
        parse
          ('/foo?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>')
          ('http://localhost/foo?lorem&ipsum&dolor=sitx')
      ).toEqual(null)
    })
  })

  describe('hash', () => {
    test('happy 1', () => {
      expect(
        parse('/foo#:word<c?a*b{1,2}>')
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
        parse('/foo#:word<c?a*b{1,2}>')
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
        parse('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#cbbb')
      ).toEqual(null)
    })
  })

  test('all together now', () => {
    expect(
      parse('/foo/:b1_2/:baz<\\d+>?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>#:word<c?a*b{1,2}>')
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
        reverse('/foo/:path/:baz<foo(1|2|3)>')({
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
        reverse('/:baz<(aa){2,3}>/')
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
        reverse('/user/:id<\\d+>/')({
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
        () => reverse('/:baz<(aa){2,3}>/')({ query: {}, path: {}, hash: {} })
      ).toThrow('baz undefined')
    })
  })

  describe('query', () => {
    test('happy 1', () => {
      expect(
        reverse
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
        reverse
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
        reverse
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
        () => reverse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({ query: {}, path: {}, hash: {} })
      ).toThrow(
        'hi undefined'
      )
    })

    test('no =', () => {
      expect(
        reverse
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
        parse('/foo#:word<c?a*b{1,2}>')
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
        reverse('/foo#:word<c?a*b{1,2}>')
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
