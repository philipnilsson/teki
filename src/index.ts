type RouteParams =
  Record<string, string | null>

const decode =
  decodeURIComponent

function pathToURL(url : string) {
  return new URL('ftp://x/' + url)
}

function trimSlashes(p : string) {
  return p.replace(/(\/$)|(^\/)/g, '')
}

function splitPath(path : string) {
  return trimSlashes(path).split('/').map(decode)
}

function getHash(path : string) {
  return decode(path.replace(/^#/, ''))
}

function parseSegment(seg : string) {
  if (seg[0] === ':') {
    let regex : null | RegExp =
      null

    const ix =
      seg.indexOf('<')

    let name =
      seg.slice(1, seg.length)

    if (ix >= 0) {
      if (seg[seg.length - 1] !== '>') {
        throw new Error('No closing >')
      }

      const regexStr =
        seg.slice(ix + 1, seg.length - 1)

      regex =
        new RegExp('^(' + regexStr + ')$')

      name =
        seg.slice(1, ix)
    }

    return function(
      str : string,
      paths : Record<string, string>
    ) : boolean {
      paths[name] =
        str

      if (regex && !regex.test(str)) {
        return false
      }

      return true
    }
  } else {
    return function(
      str : string,
      _paths : Record<string, string>
    ) : boolean {
      return str === seg
    }
  }
}

function parsePaths(
  targets : string[]
) {
  const parsers =
    targets.map(parseSegment)

  return function(
    path : string[],
    params : Record<string, string>
  ) {
    if (targets.length !== path.length) {
      return false
    }

    for (let i = 0; i < targets.length; i++) {
      if (!parsers[i](path[i], params)) {
        return false
      }
    }

    return true
  }
}

function optional(p : string) {
  return p.endsWith('?')
}

function parseQueries(
  target : URLSearchParams
) {
  const keys =
    Array.from(target.keys())

  const parsers =
    keys.map(key => parseSegment(target.get(key)!))

  return function(
    query : URLSearchParams,
    params : Record<string, string>
  ) : boolean {
    const queryKeys =
      Array.from(query.keys())

    if (!keys.every(x => optional(x) || queryKeys.includes(x))) {
      return false
    }

    for (let i = 0; i < keys.length; i++) {
      let key =
        keys[i]

      const opt =
        optional(key)

      key =
        opt ? key.slice(0, -1) : key

      if (!parsers[i](query.get(key)!, params) && !opt) {
        return false
      }
    }

    return true
  }
}

function escapeRegexes(
  pattern : string
) : string {

  const match =
    pattern.match(/:\w[\w\d_]*\??<[^>]+>/g) || []

  for (let i = 0; i < match.length; i++) {
    const m =
      match[i]

    const regex =
      m.slice(
        m.indexOf('<') + 1,
        m.length - 1
      )

    pattern =
      pattern.replace(
        regex,
        encodeURIComponent(regex)
      )
  }
  return pattern
}

export function parse(pattern : string) {
  if (pattern[0] !== '/') {
    throw new Error('Must start with /')
  }

  const target =
    pathToURL(escapeRegexes(trimSlashes(pattern)))

  const targetSegments =
    splitPath(trimSlashes(target.pathname))

  const targetHash =
    getHash(target.hash)

  const pq =
    parseQueries(target.searchParams)

  const pp =
    parsePaths(targetSegments)

  const ph =
    parseSegment(targetHash)

  return function(urlString : string) : null | RouteParams {
    const route =
      new URL(urlString)

    const params : Record<string, string> =
      {}

    if (
      pp(
        splitPath(trimSlashes(route.pathname)),
        params
      ) &&
      pq(
        route.searchParams,
        params
      ) &&
      ph(
        getHash(route.hash),
        params
      )
    ) {
      return params
    }

    return null
  }
}

function reverseSegment(
  str : string,
  dict : Record<string, string | null>
) : string {
  const match =
    str.match(/:\w[\w\d_]*\??(<[^>]+>)?/g) || []

  for (let i = 0; i < match.length; i++) {
    const m =
      match[i]

    const endIx =
      m.indexOf('<')

    let name =
      m.slice(1, endIx < 0 ? m.length : endIx)

    if (optional(name)) {
      name = name.slice(0, -1)
    }

    if (!(name in dict)) {
      throw new Error(name + ' ' + undefined)
    }

    str =
      str.replace(m, dict[name]!)
  }

  return str
}

export function reverse(
  pattern : string
) {
  const escapedString =
    escapeRegexes(trimSlashes(pattern))

  const target =
    pathToURL(escapedString)

  const segments =
    splitPath(target.pathname)

  return function(
    dict : RouteParams
  ) : string {

    const result =
      pathToURL('')

    result.pathname =
      segments
        .map(x => reverseSegment(x, dict))
        .join('/')

    target.searchParams.forEach((regex, name) => {
      const opt =
        optional(name)

      name =
        opt ? name.slice(0, -1) : name

      if (opt && !dict[name]) {
        result.searchParams.delete(name)
        return
      }

      result.searchParams.set(
        name,
        reverseSegment(regex, dict)
      )
    })

    result.hash =
      reverseSegment(
        decode(target.hash),
        dict
      )

    return ('' + result)
      .replace('ftp://x', '')
  }
}
