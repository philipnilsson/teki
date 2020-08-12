import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default {
  input: __dirname + '/src/index.ts',
  
  output: [
    {
      sourcemap: true,
      dir: "dist/esm",
      format: 'esm',
    },
    {
      sourcemap: true,
      dir: "dist/cjs",
      format: 'cjs',
    },
  ],
  
  preserveModules: true,
  
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    process.env.NODE_ENV === 'production' && terser(),
  ],
}
