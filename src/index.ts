const decode =
  decodeURIComponent

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
      if (regex && !regex.test(str)) {
        return false
      }
      paths[name] = str
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

    if (keys.some(x => !queryKeys.includes(x))) {
      return false
    }

    for (let i = 0; i < keys.length; i++) {
      if (!parsers[i](query.get(keys[i])!, params)) {
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
    pattern.match(/:\w[\w\d_]*<[^>]+>/g) || []

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
    new URL('x://x/' + escapeRegexes(trimSlashes(pattern)))

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

  return function(urlString : string) : null | {
    path : Record<string, string>
    query : Record<string, string>
    hash : Record<string, string>
  } {
    const route =
      new URL(urlString)

    const query : Record<string, string> =
      {}

    const path : Record<string, string> =
      {}

    const hash : Record<string, string> =
      {}

    if (
      pp(
        splitPath(trimSlashes(route.pathname)),
        path
      ) &&
      pq(
        route.searchParams,
        query
      ) &&
      ph(
        getHash(route.hash),
        hash
      )
    ) {
      return { query, path, hash }
    }

    return null
  }
}

function reverseSegment(
  str : string,
  dict : Record<string, string>
) : string {
  const match =
    str.match(/:\w[\w\d_]*(<[^>]+>)?/g) || []

  for (let i = 0; i < match.length; i++) {
    const m =
      match[i]

    const endIx =
      m.indexOf('<')

    const name =
      m.slice(1, endIx < 0 ? m.length : endIx)

    if (!(name in dict)) {
      throw new Error(name + ' ' + undefined)
    }

    str =
      str.replace(m, dict[name])
  }

  return str
}

export function reverse(
  pattern : string
) {
  const escapedString =
    escapeRegexes(trimSlashes(pattern))

  const target =
    new URL('x://x/' + escapedString)

  const segments =
    splitPath(target.pathname)

  return function(
    dict : {
      path : Record<string, string>,
      query : Record<string, string>,
      hash : Record<string, string>,
    }
  ) : string {

    const result =
      new URL('x://x/')

    result.pathname =
      segments
        .map(x => reverseSegment(x, dict.path))
        .join('/')

    target.searchParams.forEach((regex, name) => {
      result.searchParams.set(
        name,
        reverseSegment(regex, dict.query)
      )
    })

    result.hash =
      reverseSegment(
        decode(target.hash),
        dict.hash
      )

    return ('' + result)
      .replace('x://x', '')
  }
}

