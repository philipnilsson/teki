import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default {
  input: __dirname + '/src/iife.ts',
  
  output: {
    file: "cdn/teki.min.js",
    format: 'iife',
  },
  
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    terser(),
  ],
}
