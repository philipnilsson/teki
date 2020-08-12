import { parse, reverse } from '../index'

describe('parsing', () => {
  describe('path', () => {
    test('happy 1', () => {
      expect(
        parse('/foo/:path/:baz<foo(1|2|3)>')
          ('http://localhost/foo/bar/foo1')
      ).toEqual({
        baz: 'foo1',
        path: 'bar',
      })
    })

    test('happy 2', () => {
      expect(
        parse('/:baz<(aa){2,3}>/')
          ('https://www.example.com/aaaaaa')
      ).toEqual({
        baz: 'aaaaaa',
      })
    })

    test('happy 3', () => {
      expect(
        parse('/user/:id<\\d+>/')
          ('https://www.example.com:8080/user/123')
      ).toEqual({
        id: '123',
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
        hi: 'aaa',
        ipsum: '123'
      })
    })

    test('happy 2', () => {
      expect(
        parse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ('http://localhost/foo?ipsum=123&lorem=b')
      ).toEqual({
        hi: 'b',
        ipsum: '123'
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
        hi: 'aaa'
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
      ).toEqual({})
    })

    test('no = #2', () => {
      expect(
        parse
          ('/foo?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>')
          ('http://localhost/foo?lorem&ipsum&dolor=sit')
      ).toEqual({
        ipsum: '',
        dolor: 'sit'
      })
    })

    test('no = #3', () => {
      expect(
        parse
          ('/foo?lorem&ipsum=:ipsum&dolor=:dolor<sit|amet>')
          ('http://localhost/foo?lorem&ipsum&dolor=sitx')
      ).toEqual(null)
    })

    test('optional params 1', () => {
      expect(
        parse
          ('/foo?lorem?=:lorem')
          ('http://localhost/foo?lorem=123')
      ).toEqual({
        lorem: '123'
      })
    })

    test('optional params 2', () => {
      expect(
        parse
          ('/foo?lorem?=:lorem')
          ('http://localhost/foo')
      ).toEqual({
        lorem: null
      })
    })

    test('optional params 3', () => {
      expect(
        parse
          ('/foo?lorem?=:lorem&ipsum=:ipsum&dolor?=:dolor')
          ('http://localhost/foo?ipsum=123')
      ).toEqual({
        lorem: null,
        ipsum: '123',
        dolor: null
      })
    })

    test('optional params with regex', () => {
      expect(
        parse
          ('/foo?lorem?=:lorem<\\d+>&ipsum=:ipsum&dolor?=:dolor')
          ('http://localhost/foo?ipsum=123')
      ).toEqual({
        lorem: null,
        ipsum: '123',
        dolor: null
      })
    })
  })

  describe('hash', () => {
    test('happy 1', () => {
      expect(
        parse('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#aaabb')
      ).toEqual({
        word: 'aaabb'
      })
    })

    test('happy 2', () => {
      expect(
        parse('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#b')
      ).toEqual({
        word: 'b'
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
      word: 'caaabb',
      b1_2: 'bar',
      baz: '123',
      dolor: 'amet',
      ipsum: 'ip',
    })
  })
})

describe('reversing', () => {
  describe('path', () => {
    test('happy 1', () => {
      expect(
        reverse('/foo/:path/:baz<foo(1|2|3)>')({
          baz: 'foo1',
          path: 'bar',
        })
      ).toEqual(
        '/foo/bar/foo1'
      )
    })

    test('happy 2', () => {
      expect(
        reverse('/:baz<(aa){2,3}>/')
          ({ baz: 'aaaaaa' })
      ).toEqual('/aaaaaa')
    })

    test('happy 3', () => {
      expect(
        reverse('/user/:id<\\d+>/')({ id: '123' })
      ).toEqual('/user/123')
    })

    test('fail 1', () => {
      expect(
        () => reverse('/:baz<(aa){2,3}>/')({})
      ).toThrow('baz undefined')
    })
  })

  describe('query', () => {
    test('happy 1', () => {
      expect(
        reverse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({ hi: 'aaa', ipsum: '123' })
      ).toEqual('/foo?lorem=aaa&ipsum=123')
    })

    test('happy 2', () => {
      expect(
        reverse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({ hi: 'b', ipsum: '123' })
      ).toEqual('/foo?lorem=b&ipsum=123')
    })

    test('superset', () => {
      expect(
        reverse
          ('/foo?lorem=:hi<a+|b+>')
          ({ hi: 'aaa', bar: '123', baz: '' })
      ).toEqual('/foo?lorem=aaa')
    })

    test('subset', () => {
      expect(
        () => reverse
          ('/foo?lorem=:hi<a+|b+>&ipsum=:ipsum')
          ({})
      ).toThrow(
        'hi undefined'
      )
    })

    test('no =', () => {
      expect(
        reverse
          ('/foo?lorem&ipsum&dolor')
          ({})
      ).toEqual('/foo?lorem=&ipsum=&dolor=')
    })

    test('optional params 1', () => {
      expect(
        reverse
          ('/foo?lorem?=:lorem')
          ({ lorem: '123' })
      ).toEqual('/foo?lorem=123')
    })

    test('optional params 2', () => {
      expect(
        reverse
          ('/foo?lorem?=:lorem')
          ({})
      ).toEqual('/foo')
    })

    test('optional params 3', () => {
      expect(
        reverse
          ('/foo?lorem?=:lorem&ipsum=:ipsum&dolor?=:dolor')
          ({ ipsum: '123' })
      ).toEqual('/foo?ipsum=123')
    })

    test('optional params with regex', () => {
      expect(
        reverse
          ('/foo?lorem?=:lorem<\\d+>&ipsum=:ipsum&dolor?=:dolor')
          ({ lorem: null, ipsum: '123' })
      ).toEqual('/foo?ipsum=123')
    })
  })

  describe('hash', () => {
    test('happy 1', () => {
      expect(
        parse('/foo#:word<c?a*b{1,2}>')
          ('http://localhost/foo#aaabb')
      ).toEqual({ word: 'aaabb' })
    })

    test('happy 2', () => {
      expect(
        reverse('/foo#:word<c?a*b{1,2}>')
          ({ word: 'b' })
      ).toEqual('/foo#b')
    })
  })
})
