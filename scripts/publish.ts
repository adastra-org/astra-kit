// Publica cada paquete del workspace cuya versión actual todavía no está en el registro público (scope @adastrarp).
// NO se ejecuta desde acá: el primer release lo corre Faku a mano (`bun run release`, shell con `npm login`, 2FA por
// terminal). Bun empaqueta el tarball (resuelve `workspace:*`) y npm publica, porque `bun publish` no tiene OIDC.
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const dirs = readdirSync(join(root, 'packages'))
  .map((d) => join(root, 'packages', d))
  .filter((d) => existsSync(join(d, 'package.json')))
const interactive = !process.env.CI

const run = async (cmd: string[], cwd: string, inherit = false) => {
  if (inherit) {
    const p = Bun.spawn(cmd, {
      cwd,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      env: process.env,
    })
    return { code: await p.exited, text: '' }
  }
  const p = Bun.spawn(cmd, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  })
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ])
  return { code: await p.exited, text: (out + err).trim() }
}

let failed = false
for (const dir of dirs) {
  const {
    name,
    version,
    private: isPrivate,
  } = await Bun.file(join(dir, 'package.json')).json()
  if (isPrivate) continue
  const spec = `${name}@${version}`
  // `npm view` imprime warnings por stderr: la versión se busca en las líneas, no se lee la última.
  const info = await run(['npm', 'view', spec, 'version'], dir)
  if (
    info.code === 0 &&
    info.text
      .split('\n')
      .map((l) => l.trim())
      .includes(version)
  ) {
    console.log(`skip ${spec} (ya publicado)`)
    continue
  }
  // Un paquete nunca publicado responde 404: es el caso para el que existe este script.
  if (info.code !== 0 && !/E404|404 Not Found/i.test(info.text)) {
    console.error(`no se pudo chequear ${spec}: ${info.text}`)
    failed = true
    continue
  }
  const out = mkdtempSync(join(tmpdir(), 'adastra-pack-'))
  try {
    const pack = await run(['bun', 'pm', 'pack', '--destination', out], dir)
    const tarball = readdirSync(out).find((f) => f.endsWith('.tgz'))
    if (pack.code !== 0 || !tarball) throw new Error(`pack falló\n${pack.text}`)
    const pub = await run(
      ['npm', 'publish', join(out, tarball), '--access', 'public'],
      dir,
      interactive,
    )
    if (pub.code !== 0) throw new Error(pub.text || `npm publish ${pub.code}`)
    console.log(`publicado ${spec}`)
  } catch (error) {
    console.error(
      `FALLÓ ${spec}\n${error instanceof Error ? error.message : error}`,
    )
    failed = true
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}
process.exit(failed ? 1 : 0)
