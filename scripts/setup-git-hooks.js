import { execFileSync } from 'node:child_process'

// Keep Git hooks in the repository so every clone uses the same pre-push checks.
try {
  execFileSync('git', ['rev-parse', '--show-toplevel'], { stdio: 'ignore' })
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'])
} catch {
  // Package installs outside a Git checkout do not need local hooks.
}
